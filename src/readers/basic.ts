import parseArgs from 'minimist'
import { iTransformer } from '../transformers'
import { ConfigurationError, ErrorCodes } from '../errors'
import { withTransformers } from './common'

export const literal = (value: unknown) => {
    return withTransformers(async function literal() {
        return value
    })
}

export const env = (envVarName: unknown = '', customTransformer?: iTransformer) => {
    if (typeof envVarName !== 'string') {
        throw new ConfigurationError(
            ErrorCodes.READER_ERROR,
            `Env var name must be a string, got ${typeof envVarName} instead.`,
        )
    }
    return withTransformers(async function env(path): Promise<unknown> {
        return process.env[envVarName || path.replace('.', '_').toUpperCase()]
    }, customTransformer)
}

const args = parseArgs(process.argv.slice(2))
export const arg = (argName: unknown = '', customTransformer?: iTransformer) => {
    if (typeof argName !== 'string') {
        throw new ConfigurationError(
            ErrorCodes.READER_ERROR,
            `Argument name must be a string, got ${typeof argName} instead.`,
        )
    }

    return withTransformers(async function arg(path): Promise<unknown> {
        return args[(argName as string) || path.replace('.', '-')]
    }, customTransformer)
}

export const get = (configPath: unknown, customTransformer?: iTransformer) => {
    if (typeof configPath !== 'string') {
        throw new ConfigurationError(
            ErrorCodes.READER_ERROR,
            `Config path must be a string, got ${typeof configPath} instead.`,
        )
    }

    return withTransformers(async function get(_, __, get): Promise<unknown> {
        return get(configPath)
    }, customTransformer)
}
