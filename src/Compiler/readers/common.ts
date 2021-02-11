import { configLeaf, iConfigLogger, tree } from '../../Config'
import { iValueTransformer, composeValueTransformers } from '../valueTransformers'
import { iConfigGetter } from '../Compiler'
import { iPathTransformer, identity } from '../pathTransformers'

const ReaderSuffix = 'WithTransformers'

export interface iReader {
    (
        path: string,
        logger: iConfigLogger,
        get: iConfigGetter,
        defaultTransformers?: iValueTransformer<configLeaf | tree<configLeaf> | undefined>[],
    ): Promise<configLeaf | tree<configLeaf>>
}

export interface iReaderCreator {
    (key?: string | iPathTransformer, valueTransformer?: iValueTransformer<configLeaf | tree<configLeaf>>): iReader
}

export interface iDefaultReaderCreator {
    (defaultValue: configLeaf): iReader
}

export function withTransformers(
    reader: iReader,
    pathTransformer: string | iPathTransformer = identity,
    valueTransformer?: iValueTransformer<configLeaf | tree<configLeaf>>,
): iReader {
    if (reader.name.endsWith(ReaderSuffix)) {
        return reader
    }
    const readerWithTransformers: iReader = async function (
        path: string,
        logger: iConfigLogger,
        get: iConfigGetter,
        defaultTransformers: iValueTransformer<configLeaf | tree<configLeaf> | undefined>[] = [],
    ) {
        const value = await reader(
            typeof pathTransformer === 'string' ? pathTransformer : pathTransformer(path),
            logger,
            get,
        )
        const transformers = valueTransformer ? [valueTransformer, ...defaultTransformers] : defaultTransformers
        return composeValueTransformers(...transformers)(value)
    }
    Object.defineProperty(readerWithTransformers, 'name', { value: `${reader.name}${ReaderSuffix}` })
    return readerWithTransformers
}
