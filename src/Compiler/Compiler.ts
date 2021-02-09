import { iDefaultReaderCreator, iReader } from './readers'
import { iValueTransformer } from './valueTransformers'
import { iConfigLogger, POJO } from '../Config'
import { ConfigurationError, Codes } from '../ConfigurationError'
import { flatten, randomString, scheduleTimeout, unflatten } from '../utils'

const FakeSubtreeRoot = randomString()

interface iMissingPathsTracker {
    [key: string]: ((value?: unknown) => void)[]
}

export interface iConfigGetter {
    (path: string): Promise<unknown>
}

export interface iCompile {
    (scenario: POJO): Promise<POJO>
}

export default function Compiler(
    logger: iConfigLogger,
    defaultReaderCreator: iDefaultReaderCreator,
    defaultTransformers: iValueTransformer<unknown>[],
    compilationTimeout = 5000,
) {
    return async function compile(scenario: POJO): Promise<POJO> {
        const config = flatten(scenario)
        const missingPaths: iMissingPathsTracker = {}

        Object.entries(config).forEach(([path, valueOrReader]) => {
            let reader: iReader
            if (typeof valueOrReader === 'function') {
                reader = valueOrReader as iReader
            } else {
                reader = defaultReaderCreator(valueOrReader)
            }
            try {
                config[path] = reader(path, logger, createGetter(config, missingPaths), defaultTransformers).then(
                    (value) => {
                        insertValue(path, value, config, missingPaths)
                        return value
                    },
                )
            } catch (e) {
                throw new ConfigurationError(
                    Codes.COMPILATION_ERROR,
                    {
                        path,
                        reader: reader.name,
                        reason: e,
                    },
                    `Failed to read configuration value at ${path}`,
                )
            }
        })

        const timeoutPromise = scheduleTimeout(compilationTimeout)

        await Promise.race([
            Promise.all(Object.values(config)).then(() => timeoutPromise.cancel()),
            timeoutPromise.catch(() => {
                const missing = Object.keys(missingPaths)
                const unresolved = Object.entries(config)
                    .filter(([_, value]) => value && typeof (value as Promise<unknown>).then === 'function')
                    .map(([key]) => key)
                const details: Partial<Record<'missingPaths' | 'unresolvedPaths', string[]>> = {}
                missing.length && (details.missingPaths = missing)
                unresolved.length && (details.unresolvedPaths = unresolved)

                throw new ConfigurationError(
                    Codes.COMPILATION_ERROR,
                    details,
                    `Could not resolve config paths: ${[...missing, ...unresolved].join(', ')}`,
                )
            }),
        ])
        return unflatten(config)
    }

    function insertValue(path: string, value: unknown, config: POJO, missingPaths: iMissingPathsTracker) {
        if (value && typeof value === 'object' && !Array.isArray(value)) {
            Object.entries(flatten(value as POJO)).forEach(([subPath, value]) =>
                insertValue(path + '.' + subPath, value, config, missingPaths),
            )
        } else {
            config[path] = value
            if (missingPaths[path]) {
                missingPaths[path].forEach((resolver) => resolver())
                delete missingPaths[path]
            }
        }
    }

    function createGetter(config: POJO, missingPaths: iMissingPathsTracker): iConfigGetter {
        return async (path = '') => {
            let matchingEntries = Object.entries(config).filter(([key]) => key.startsWith(path))
            if (!matchingEntries.length) {
                const pathWatcher = new Promise((resolve) => {
                    missingPaths[path] = [...(missingPaths[path] || []), resolve]
                })
                await pathWatcher
                matchingEntries = Object.entries(config).filter(([key]) => key.startsWith(path))
            }
            const result: POJO = unflatten(
                matchingEntries
                    .map(([key, value]) => [key.replace(path, FakeSubtreeRoot), value])
                    .reduce((acc, [key, value]) => ({ ...acc, [key as string]: value }), {}),
            )
            return result[FakeSubtreeRoot]
        }
    }
}
