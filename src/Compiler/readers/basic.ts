import { iValueTransformer } from '../valueTransformers'
import { withTransformers, iReaderCreator, iDefaultReaderCreator } from './common'
import { parseArgs } from '../../utils'
import { argPathTransformer, envPathTransformer, iPathTransformer } from '../pathTransformers'

export const literal: iDefaultReaderCreator = (value: unknown) => {
    return withTransformers(async function literal() {
        return value
    })
}

export const env: iReaderCreator = (
    envVar: iPathTransformer | string = envPathTransformer,
    valueTransformer?: iValueTransformer<unknown>,
) => {
    return withTransformers(
        async function env(path): Promise<unknown> {
            return process.env[path]
        },
        envVar,
        valueTransformer,
    )
}

export const arg: iReaderCreator = (
    argName: iPathTransformer | string = argPathTransformer,
    valueTransformer?: iValueTransformer<unknown>,
) => {
    return withTransformers(
        async function arg(path): Promise<unknown> {
            return parseArgs(process.argv.slice(2))[path]
        },
        argName,
        valueTransformer,
    )
}

export const get: iReaderCreator = (configPath?, valueTransformer?: iValueTransformer<unknown>) => {
    return withTransformers(
        async function get(path, _, get): Promise<unknown> {
            return get(path)
        },
        configPath,
        valueTransformer,
    )
}
