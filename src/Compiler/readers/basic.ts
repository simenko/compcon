import { iValueTransformer } from '../valueTransformers'
import { withTransformers, iReaderCreator, iDefaultReaderCreator } from './common'
import { parseArgs } from '../../utils'
import { argPathTransformer, envPathTransformer, iPathTransformer } from '../pathTransformers'
import { configLeaf, configValue } from '../../Config'

export const literal: iDefaultReaderCreator = (value: configLeaf) => {
    return withTransformers(async function literal() {
        return value
    })
}

export const env: iReaderCreator = (
    envVar: iPathTransformer | string = envPathTransformer,
    valueTransformer?: iValueTransformer<configValue>,
) => {
    return withTransformers(
        async function env(path): Promise<configValue> {
            return process.env[path] || null
        },
        envVar,
        valueTransformer,
    )
}

export const arg: iReaderCreator = (
    argName: iPathTransformer | string = argPathTransformer,
    valueTransformer?: iValueTransformer<configValue>,
) => {
    return withTransformers(
        async function arg(path): Promise<configLeaf> {
            return parseArgs(process.argv.slice(2))[path] || null
        },
        argName,
        valueTransformer,
    )
}

export const get: iReaderCreator = (configPath, valueTransformer?: iValueTransformer<configValue>) => {
    return withTransformers(
        async function get(path, _, get): Promise<configValue> {
            return get(path)
        },
        configPath,
        valueTransformer,
    )
}
