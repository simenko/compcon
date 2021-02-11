type errors = Error | Error[]
function isErrors(maybeErrors: unknown): maybeErrors is errors {
    return (
        maybeErrors instanceof Error ||
        (Array.isArray(maybeErrors) && maybeErrors.every((item) => item instanceof Error))
    )
}

export enum Codes {
    ACCESS_ERROR = 'ACCESS_ERROR',
    LOADING_ERROR = 'LOADING_ERROR',
    COMPILATION_ERROR = 'COMPILATION_ERROR',
    READER_ERROR = 'READER_ERROR',
    VALIDATION_ERROR = 'VALIDATION_ERROR',
    INITIALIZATION_ERROR = 'INITIALIZATION_ERROR',
}

export class ConfigurationError extends Error {
    public readonly details?: Record<string, unknown>
    public readonly reason?: errors

    constructor(public readonly code: Codes, detailsOrReason?: Record<string, unknown> | errors, message?: string) {
        super(message)
        this.name = 'ConfigurationError'

        // For Nodejs only, need an alternative solution for cross-browser code
        Error.captureStackTrace(this, this.constructor)

        if (!detailsOrReason) {
            return
        }
        if (isErrors(detailsOrReason)) {
            this.reason = detailsOrReason
        } else {
            if (detailsOrReason.reason && isErrors(detailsOrReason.reason)) {
                this.reason = detailsOrReason.reason
                delete detailsOrReason.reason
            }
            this.details = detailsOrReason
        }
    }
}
