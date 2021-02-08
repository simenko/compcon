import { POJO } from './BaseConfig'

type errors = Error | Error[]

export class ProperError<ErrorCodes> extends Error {
    public readonly details?: POJO
    public readonly reason?: errors

    constructor(public readonly code: ErrorCodes, detailsOrReason?: POJO | errors, message?: string) {
        super(message)
        Error.captureStackTrace(this, this.constructor)
        this.name = this.constructor.name

        if (!detailsOrReason) {
            return
        }
        if (isErrors(detailsOrReason)) {
            this.reason = detailsOrReason
        } else {
            this.details = detailsOrReason
            if (detailsOrReason?.reason && isErrors(detailsOrReason.reason)) {
                this.reason = detailsOrReason.reason
                delete detailsOrReason.reason
            }
        }
    }
}

// Use this until https://github.com/tc39/proposal-throw-expressions is here
export const thrw = (e: Error): never => {
    throw e
}

function isErrors(maybeErrors: unknown): maybeErrors is errors {
    return (
        maybeErrors instanceof Error ||
        (Array.isArray(maybeErrors) && maybeErrors.every((item) => item instanceof Error))
    )
}
