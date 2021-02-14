import { iValueTransformer } from '../valueTransformers'
import { ConfigurationError, Codes } from '../../ConfigurationError'
import { iDefaultReaderCreator, iReader, withTransformers } from './common'
import { arg, env } from './basic'
import { configValue } from '../../Config'

export const firstOf = (
    readersOrValues: (configValue | iReader)[],
    valueTransformer?: iValueTransformer<configValue>,
) => {
    if (!Array.isArray(readersOrValues)) {
        throw new ConfigurationError(
            Codes.READER_ERROR,
            undefined,
            `Array of readers or default value expected, got ${typeof readersOrValues} instead.`,
        )
    }

    return withTransformers(
        async function firstOf(path, logger, get) {
            for (const readerOrValue of readersOrValues) {
                if (typeof readerOrValue !== 'function') {
                    return readerOrValue
                }
                try {
                    const value = await readerOrValue(path, logger, get)
                    if (value !== null) {
                        return value
                    }
                } catch (e) {
                    logger.debug(
                        new ConfigurationError(
                            Codes.READER_ERROR,
                            {
                                reason: e,
                                reader: readerOrValue.name,
                                path,
                            },
                            `Reader ${readerOrValue.name} could not read value at ${path}`,
                        ),
                    )
                }
            }
            return null
        },
        undefined,
        valueTransformer,
    )
}

export const conventional: iDefaultReaderCreator = (defaultValue: configValue) =>
    withTransformers(async function conventional(path, logger, get) {
        return firstOf([arg(), env(), defaultValue])(path, logger, get)
    })
