import { POJO } from './Config'

export enum ErrorCodes {
    ACCESS_ERROR = 'ACCESS_ERROR',
    LOADING_ERROR = 'LOADING_ERROR',
    COMPILATION_ERROR = 'COMPILATION_ERROR',
    READER_ERROR = 'READER_ERROR',
}

export class ConfigurationError extends Error {
    public readonly details: POJO | undefined
    public readonly reason: Error | undefined
    constructor(public readonly code: ErrorCodes, message?: string, detailsOrReason: POJO | Error = {}) {
        super(message)
        Error.captureStackTrace(this, ConfigurationError)
        this.name = this.constructor.name
        if (detailsOrReason instanceof Error) {
            this.reason = detailsOrReason
            this.message = `${message}: ${detailsOrReason.message}`
        } else {
            this.details = detailsOrReason
        }
    }
}
