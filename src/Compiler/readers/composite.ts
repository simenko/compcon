import { iValueTransformer } from '../valueTransformers'
import { ConfigurationError, ConfigurationErrorCodes } from '../../errors'
import { iDefaultReaderCreator, withTransformers } from './common'
import { arg, env } from './basic'

export const firstOf = (readersOrValues: unknown[], valueTransformer?: iValueTransformer<unknown>) => {
    if (!Array.isArray(readersOrValues)) {
        throw new ConfigurationError(
            ConfigurationErrorCodes.READER_ERROR,
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
                    if (value !== undefined) {
                        return value
                    }
                } catch (e) {
                    logger.debug(
                        new ConfigurationError(
                            ConfigurationErrorCodes.READER_ERROR,
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
            return undefined
        },
        undefined,
        valueTransformer,
    )
}

export const conventional: iDefaultReaderCreator = (defaultValue?: unknown) =>
    withTransformers(async function conventional(path, logger, get) {
        return firstOf([arg(), env(), defaultValue])(path, logger, get)
    })
