type errors = Error | Error[]

export class ProperError<ErrorCodes> extends Error {
    public readonly details?: Record<string, unknown>
    public readonly reason?: errors

    constructor(
        public readonly code: ErrorCodes,
        detailsOrReason?: Record<string, unknown> | errors,
        message?: string,
    ) {
        super(message)
        // For Nodejs only, need alternative solution for minified cross-browser code
        this.name = this.constructor.name
        Error.captureStackTrace(this, this.constructor)

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

export function thrw(e: Error): never {
    throw e
}

function isErrors(maybeErrors: unknown): maybeErrors is errors {
    return (
        maybeErrors instanceof Error ||
        (Array.isArray(maybeErrors) && maybeErrors.every((item) => item instanceof Error))
    )
}
