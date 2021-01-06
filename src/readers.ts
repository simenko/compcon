import { iConfigLogger } from './index'

export interface iConfigReader {
    (path: string): unknown
}

export interface iWrappedReader {
    (path: string, logger: iConfigLogger, get: iConfigReader): Promise<unknown>
}
export interface iReader {
    (path: string, logger: iConfigLogger, get: iConfigReader, ...options: unknown[]): Promise<unknown> | unknown
}

export interface iReaderCreator {
    (...options: unknown[]): iWrappedReader
}

export interface iCompositeReaderCreator {
    (...readersOrValues: unknown[]): iWrappedReader
}

export interface iEnvReaderCreator {
    (envVarName?: string): iWrappedReader
}

export interface iConfigReaderCreator {
    (configPath: string): iWrappedReader
}

export const composite: iReader = async function composite(path, logger, get, ...readersOrValues: []) {
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

export const env: iReader = function env(path, logger, get, envVarName: unknown) {
    return process.env[(envVarName as string) || path.replace('.', '_').toUpperCase()]
}
