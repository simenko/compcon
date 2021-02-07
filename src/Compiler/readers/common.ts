import { iConfigLogger } from '../../BaseConfig'
import { iValueTransformer, composeValueTransformers, passThrough } from '../valueTransformers'
import { iConfigGetter } from '../Compiler'
import { iPathTransformer, identity } from '../pathTransformers'

const ReaderSuffix = 'WithTransformers'

export interface iReader {
    (
        path: string,
        logger: iConfigLogger,
        get: iConfigGetter,
        defaultTransformers?: iValueTransformer<unknown>[],
    ): Promise<unknown>
}

export interface iReaderCreator {
    (key?: string | iPathTransformer, valueTransformer?: iValueTransformer<unknown>): iReader
}

export interface iDefaultReaderCreator {
    (defaultValue?: unknown): iReader
}

export function withTransformers(
    reader: iReader,
    pathTransformer: string | iPathTransformer = identity,
    valueTransformer: iValueTransformer<unknown> = passThrough,
): iReader {
    if (reader.name.endsWith(ReaderSuffix)) {
        return reader
    }
    const readerWithTransformers: iReader = async function (
        path: string,
        logger: iConfigLogger,
        get: iConfigGetter,
        defaultTransformers: iValueTransformer<unknown>[] = [],
    ) {
        const value = await reader(
            typeof pathTransformer === 'string' ? pathTransformer : pathTransformer(path),
            logger,
            get,
        )
        return composeValueTransformers(valueTransformer, ...defaultTransformers)(value)
    }
    Object.defineProperty(readerWithTransformers, 'name', { value: `${reader.name}${ReaderSuffix}` })
    return readerWithTransformers
}
