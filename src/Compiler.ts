import { conventional, iReader, iDefaultReaderCreator } from './readers'
import { bool, iValueTransformer, json, num } from './valueTransformers'
import { iConfigLogger, iConfigValidator, POJO } from './Config'
import { ConfigurationError, ErrorCodes } from './errors'
import { deepFreeze, flatten, randomString, scheduleTimeout, unflatten } from './utils'

export interface iConfigGetter {
    (path: string): Promise<unknown>
}

const FakeSubtreeRoot = randomString()

export class Compiler {
    private config: POJO = {}
    private missingPaths: { [key: string]: ((value?: unknown) => void)[] } = {}
    constructor(
        private readonly logger: iConfigLogger,
        private readonly validator: iConfigValidator = (config) => config,
        private readonly defaultReaderCreator: iDefaultReaderCreator = conventional,
        private readonly defaultTransformers: iValueTransformer<unknown>[] = [json, bool, num],
        private readonly compilationTimeout = 3000,
    ) {}

    public async compile(scenario: POJO): Promise<POJO> {
        this.config = flatten(scenario)

        Object.entries(this.config).forEach(([path, valueOrReader]) => {
            let reader: iReader
            if (typeof valueOrReader === 'function') {
                reader = valueOrReader as iReader
            } else {
                reader = this.defaultReaderCreator(valueOrReader)
            }
            this.config[path] = reader(path, this.logger, this.get, this.defaultTransformers).then((value) => {
                this.insertValue(path, value)
                return value
            })
        })

        const timeoutPromise = scheduleTimeout(this.compilationTimeout)

        await Promise.race([
            Promise.all(Object.values(this.config)).then(() => timeoutPromise.cancel()),
            timeoutPromise.catch(() => {
                const missingPaths = Object.keys(this.missingPaths).length
                    ? Object.keys(this.missingPaths)
                    : Object.entries(this.config)
                          .filter(([_, value]) => value && typeof (value as Promise<unknown>).then === 'function')
                          .map(([key]) => key)
                throw new ConfigurationError(
                    ErrorCodes.COMPILATION_ERROR,
                    `Could not resolve config paths: ${missingPaths}`,
                    { missingPaths },
                )
            }),
        ])
        try {
            this.config = this.validator(unflatten(this.config))
        } catch (e) {
            throw new ConfigurationError(ErrorCodes.COMPILATION_ERROR, 'Configuration is invalid', e)
        }
        deepFreeze(this.config)
        return this.config
    }

    private insertValue(path: string, value: unknown) {
        if (value && typeof value === 'object' && !Array.isArray(value)) {
            Object.entries(flatten(value as POJO)).forEach(([subPath, value]) =>
                this.insertValue(path + '.' + subPath, value),
            )
        } else {
            this.config[path] = value
            if (this.missingPaths[path]) {
                this.missingPaths[path].forEach((resolver) => resolver())
                delete this.missingPaths[path]
            }
        }
    }

    private get: iConfigGetter = async (path = '') => {
        let matchingEntries = Object.entries(this.config).filter(([key]) => key.startsWith(path))
        if (!matchingEntries.length) {
            const pathWatcher = new Promise((resolve) => {
                this.missingPaths[path] = [...(this.missingPaths[path] || []), resolve]
            })
            await pathWatcher
            matchingEntries = Object.entries(this.config).filter(([key]) => key.startsWith(path))
        }
        const result: POJO = unflatten(
            matchingEntries
                .map(([key, value]) => [key.replace(path, FakeSubtreeRoot), value])
                .reduce((acc, [key, value]) => ({ ...acc, [key as string]: value }), {}),
        )
        return result[FakeSubtreeRoot]
    }
}
