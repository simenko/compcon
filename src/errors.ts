import { ProperError } from './ProperError'

export enum ConfigurationErrorCodes {
    ACCESS_ERROR = 'ACCESS_ERROR',
    LOADING_ERROR = 'LOADING_ERROR',
    COMPILATION_ERROR = 'COMPILATION_ERROR',
    READER_ERROR = 'READER_ERROR',
    VALIDATION_ERROR = 'VALIDATION_ERROR',
    INITIALIZATION_ERROR = 'INITIALIZATION_ERROR',
}

export class ConfigurationError extends ProperError<ConfigurationErrorCodes> {}
