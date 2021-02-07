import { POJO } from './Config'

export enum ErrorCodes {
    ACCESS_ERROR = 'ACCESS_ERROR',
    LOADING_ERROR = 'LOADING_ERROR',
    COMPILATION_ERROR = 'COMPILATION_ERROR',
    READER_ERROR = 'READER_ERROR',
    VALIDATION_ERROR = 'VALIDATION_ERROR',
    INITIALIZATION_ERROR = 'INITIALIZATION_ERROR',
}

export class ConfigurationError extends Error {
    public readonly details: POJO | undefined
    public readonly reason: Error | Error[] | undefined
    constructor(public readonly code: ErrorCodes, message: string = '', detailsOrReason: POJO | Error | Error[] = {}) {
        super(message)
        Error.captureStackTrace(this, ConfigurationError)
        this.name = this.constructor.name
        const mainMessage = `${code} ${message}`
        let reasonMessage = ''
        if (detailsOrReason instanceof Error || Array.isArray(detailsOrReason)) {
            if (Array.isArray(detailsOrReason)) {
                reasonMessage = `[${detailsOrReason.map((e) => e.message).join(', ')}]`
            } else {
                reasonMessage = detailsOrReason.message
            }
            this.reason = detailsOrReason
        } else {
            this.details = detailsOrReason
        }
        this.message = `${mainMessage}${reasonMessage}`
    }
}
