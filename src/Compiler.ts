import flatten, { unflatten } from 'flat'
import crypto from 'crypto'
import { iConfigGetter, iReader, conventional } from './readers'
import { json, bool, num, iTransformer } from './transformers'
import { iConfigLogger, iConfigValidator, POJO } from './Config'
import { deepFreeze } from './utils'
interface iCancelablePromise extends PromiseLike<unknown> {
    cancel: () => void
}

const FakeSubtreeRoot = crypto.randomFillSync(Buffer.alloc(16)).toString('hex')

export class Compiler {
    private compilationTimeout = 2000
    private config: POJO = {}
    private missingPaths: { [key: string]: ((value?: unknown) => void)[] } = {}
    constructor(
        private readonly logger: iConfigLogger,
        private readonly validator: iConfigValidator = (config) => config,
        private readonly defaultReaderCreator: (options: unknown) => iReader = conventional,
        private readonly defaultTransformers: iTransformer[] = [json, bool, num],
    ) {}

    public async compile(scenario: POJO): Promise<POJO> {
        this.config = flatten(scenario, { safe: true })

        Object.entries(this.config).forEach(([path, valueOrReader]) => {
            let reader: iReader
            if (typeof valueOrReader === 'function') {
                reader = valueOrReader as iReader
            } else {
                reader = this.defaultReaderCreator(valueOrReader)
            }
            this.config[path] = reader(path, this.logger, this.get, this.defaultTransformers).then((value: unknown) => {
                this.insertValue(path, value)
                return value
            })
        })

        const timeoutPromise = this.scheduleTimeout()

        await Promise.race([
            Promise.all(Object.values(this.config)).then(() => timeoutPromise.cancel()),
            timeoutPromise,
        ])
        this.config = this.validator(unflatten(this.config, { overwrite: true }))
        deepFreeze(this.config)
        return this.config
    }

    private insertValue(path: string, value: unknown) {
        if (value && typeof value === 'object' && !Array.isArray(value)) {
            Object.entries(flatten(value)).forEach(([subPath, value]) => this.insertValue(path + '.' + subPath, value))
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
            { overwrite: true },
        )
        return result[FakeSubtreeRoot]
    }

    private scheduleTimeout() {
        let cancel
        const timeoutPromise: Partial<iCancelablePromise> = new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                const missingPaths = Object.keys(this.missingPaths).length
                    ? Object.keys(this.missingPaths)
                    : Object.entries(this.config)
                          .filter(([_, value]) => value && typeof (value as PromiseLike<unknown>).then === 'function')
                          .map(([key]) => key)
                reject(new Error(`Could not resolve config paths: ${missingPaths}`))
            }, this.compilationTimeout)
            cancel = () => {
                clearTimeout(timeout)
                resolve(undefined)
            }
        })
        timeoutPromise.cancel = cancel
        return timeoutPromise as iCancelablePromise
    }
}
