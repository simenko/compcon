import { iDefaultReaderCreator, iReader } from './readers'
import { iValueTransformer } from './valueTransformers'
import { configLeaf, iConfigLogger, scenarioLeaf, tree } from '../Config'
import { ConfigurationError, Codes } from '../ConfigurationError'
import { flatten, randomString, scheduleTimeout, unflatten } from '../utils'

const FakeSubtreeRoot = randomString()
export type pendingConfigLeaf = configLeaf | ReturnType<iReader>

interface iMissingPathsTracker {
    [key: string]: (() => void)[]
}

export interface iConfigGetter {
    (path: string): Promise<configLeaf | tree<configLeaf>>
}

export interface iCompile {
    (scenario: tree<scenarioLeaf>): Promise<tree<configLeaf>>
}

export function Compiler(
    logger: iConfigLogger,
    defaultReaderCreator: iDefaultReaderCreator,
    defaultTransformers: iValueTransformer<configLeaf | tree<configLeaf> | undefined>[],
    compilationTimeout = 5000,
) {
    return async function compile(scenario: tree<scenarioLeaf>): Promise<tree<configLeaf>> {
        const flatScenario = flatten(scenario)
        const config: { [key: string]: pendingConfigLeaf } = {}
        const missingPaths: iMissingPathsTracker = {}

        Object.entries(flatScenario).forEach(([path, valueOrReader]) => {
            let reader: iReader
            if (typeof valueOrReader === 'function') {
                reader = valueOrReader
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
                    .filter(([_, value]) => value && typeof (value as ReturnType<iReader>).then === 'function')
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

    function insertValue(
        path: string,
        value: configLeaf | tree<configLeaf> | configLeaf[],
        config: { [key: string]: pendingConfigLeaf },
        missingPaths: iMissingPathsTracker,
    ) {
        if (value && typeof value === 'object' && !Array.isArray(value)) {
            Object.entries(flatten(value)).forEach(([subPath, value]) =>
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

    function createGetter(
        config: { [key: string]: pendingConfigLeaf },
        missingPaths: iMissingPathsTracker,
    ): iConfigGetter {
        return async (path = '') => {
            let matchingEntries = Object.entries(config).filter(([key]) => key.startsWith(path))
            if (!matchingEntries.length) {
                const pathWatcher = new Promise<void>((resolve) => {
                    missingPaths[path] = [...(missingPaths[path] || []), resolve]
                })
                await pathWatcher
                matchingEntries = Object.entries(config).filter(([key]) => key.startsWith(path))
            }
            const result: tree<configLeaf> = unflatten(
                matchingEntries
                    .map<[string, pendingConfigLeaf]>(([key, value]) => [key.replace(path, FakeSubtreeRoot), value])
                    .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {}),
            )
            return result[FakeSubtreeRoot]
        }
    }
}
