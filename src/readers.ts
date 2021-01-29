import parseArgs from 'minimist'
import { iConfigLogger } from './Config'
import { iTransformer } from './transformers'

const args = parseArgs(process.argv.slice(2))

export interface iConfigGetter {
    (path: string): Promise<unknown>
}
export interface iReader {
    (path: string, logger: iConfigLogger, get: iConfigGetter, defaultTransformers?: iTransformer[]): Promise<unknown>
}

export function withTransformers(reader: iReader, customTransformer: iTransformer = (_) => undefined): iReader {
    const readerWithTransformers: iReader = async function (
        path: string,
        logger: iConfigLogger,
        get: iConfigGetter,
        defaultTransformers: iTransformer[] = [],
    ) {
        const value = await reader(path, logger, get)
        return [customTransformer, ...defaultTransformers, (v: unknown) => v].reduce(
            (transformedValue: unknown, transformer) => {
                if (transformedValue !== undefined) {
                    return transformedValue
                }
                return transformer(value)
            },
            undefined,
        )
    }
    Object.defineProperty(readerWithTransformers, 'name', { value: reader.name })
    return readerWithTransformers
}

export const literal = (value: unknown) => {
    return withTransformers(async function literal() {
        return value
    })
}

export const env = (envVarName: unknown = '', customTransformer?: iTransformer) => {
    if (typeof envVarName !== 'string') {
        throw new Error(`Env path must be a string, got ${typeof envVarName} instead.`)
    }
    return withTransformers(async function env(path): Promise<unknown> {
        return process.env[envVarName || path.replace('.', '_').toUpperCase()]
    }, customTransformer)
}

export const get = (configPath: unknown, customTransformer?: iTransformer) => {
    if (typeof configPath !== 'string') {
        throw new Error(`Env path must be a string, got ${typeof configPath} instead.`)
    }

    return withTransformers(async function get(_, __, get): Promise<unknown> {
        return get(configPath)
    }, customTransformer)
}

export const arg = (argName: unknown = '', customTransformer?: iTransformer) => {
    if (typeof argName !== 'string') {
        throw new Error(`Env path must be a string, got ${typeof argName} instead.`)
    }

    return withTransformers(async function arg(path): Promise<unknown> {
        return args[(argName as string) || path.replace('.', '-')]
    }, customTransformer)
}

export const firstOf = (readersOrValues: unknown, customTransformer?: iTransformer) => {
    if (!Array.isArray(readersOrValues)) {
        throw new Error(`Array of readers or default value expected, got ${typeof readersOrValues} instead.`)
    }

    return withTransformers(async function firstOf(path, logger, get) {
        for (const readerOrValue of readersOrValues) {
            if (typeof readerOrValue !== 'function') {
                return readerOrValue
            }
            try {
                const value = await readerOrValue(path, logger, get)
                if (value !== undefined) {
                    return value
                }
            } catch (e) {
                logger.debug(`Reader ${readerOrValue.name} could not read value at ${path}. Reason: ${e.message}`, e)
            }
        }
        return undefined
    }, customTransformer)
}

export const conventional = (defaultValue: unknown) =>
    withTransformers(async function conventional(path, logger, get) {
        return firstOf([arg(), env(), defaultValue])(path, logger, get)
    })
