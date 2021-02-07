import { POJO } from './BaseConfig'

type errors = Error | Error[]

export enum ErrorCodes {
    ACCESS_ERROR = 'ACCESS_ERROR',
    LOADING_ERROR = 'LOADING_ERROR',
    COMPILATION_ERROR = 'COMPILATION_ERROR',
    READER_ERROR = 'READER_ERROR',
    VALIDATION_ERROR = 'VALIDATION_ERROR',
    INITIALIZATION_ERROR = 'INITIALIZATION_ERROR',
}

export class ConfigurationError extends Error {
    public readonly details?: POJO
    public readonly reason?: errors
    constructor(public readonly code: ErrorCodes, message: string = '', detailsOrReason?: POJO | errors) {
        super(message)
        Error.captureStackTrace(this, ConfigurationError)
        this.name = this.constructor.name
        const mainMessage = `${code} ${message}`
        let reasonMessage = ''
        if (isErrors(detailsOrReason)) {
            reasonMessage = composeReasonMessage(detailsOrReason)
            this.reason = detailsOrReason
        } else {
            this.details = detailsOrReason
            if (detailsOrReason?.reason && isErrors(detailsOrReason.reason)) {
                reasonMessage = composeReasonMessage(detailsOrReason.reason)
                this.reason = detailsOrReason.reason
                delete detailsOrReason.reason
            }
        }
        this.message = `${mainMessage}${reasonMessage}`
    }
}

function isErrors(maybeErrors: unknown): maybeErrors is errors {
    return (
        maybeErrors instanceof Error ||
        (Array.isArray(maybeErrors) && maybeErrors.every((item) => item instanceof Error))
    )
}

function composeReasonMessage(reason: errors) {
    if (Array.isArray(reason)) {
        return `[${reason.map((e) => e.message).join(', ')}]`
    } else {
        return reason.message
    }
}
