import { iConfigLogger } from './Config'
import parseArgs from 'minimist'
const args = parseArgs(process.argv.slice(2))

export interface iConfigGetter {
    (path: string): Promise<unknown>
}

export interface iReader {
    (path: string, logger: iConfigLogger, get: iConfigGetter): Promise<unknown>
}

export const env = (envVarName?: string): iReader =>
    async function env(path): Promise<unknown> {
        return process.env[(envVarName as string) || path.replace('.', '_').toUpperCase()]
    }

export const get = (configPath: string): iReader =>
    async function get(_, __, get): Promise<unknown> {
        return get(configPath)
    }

export const arg = (argName?: string): iReader =>
    async function arg(path): Promise<unknown> {
        return args[(argName as string) || path.replace('.', '_')]
    }

export const firstOf = (...readersOrValues: unknown[]): iReader =>
    async function firstOf(path, logger, get) {
        for (const readerOrValue of readersOrValues) {
            if (typeof readerOrValue !== 'function') {
                return readerOrValue
            }
            try {
                const value = await (readerOrValue as iReader)(path, logger, get)
                if (value !== undefined) {
                    return value
                }
            } catch (e) {
                logger.debug(
                    `Reader ${(readerOrValue as iReader).name} could not read value at ${path}. Reason: ${e.message}`,
                    e,
                )
            }
        }
        return undefined
    }

export const conventional = (defaultValue: unknown): iReader =>
    async function conventional(path, logger, get) {
        return firstOf(arg(), env(), defaultValue)(path, logger, get)
    }
