import { iConfigLogger } from './index'

export interface iConfigGetter {
    (path: string): Promise<unknown>
}

export interface iReader {
    (path: string, logger: iConfigLogger, get: iConfigGetter): Promise<unknown>
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

export const env = (envVarName?: string): iReader =>
    async function env(path): Promise<unknown> {
        return process.env[(envVarName as string) || path.replace('.', '_').toUpperCase()]
    }

export const get = (configPath: string): iReader =>
    async function get(_, __, get): Promise<unknown> {
        return get(configPath)
    }
