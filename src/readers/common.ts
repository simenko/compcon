import { iConfigLogger } from '../Config'
import { iTransformer } from '../transformers'

export interface iConfigGetter {
    (path: string): Promise<unknown>
}

export interface iReader {
    (path: string, logger: iConfigLogger, get: iConfigGetter, defaultTransformers?: iTransformer[]): Promise<unknown>
}

export function withTransformers(reader: iReader, customTransformer: iTransformer = () => undefined): iReader {
    const readerWithTransformers: iReader = async function (
        path: string,
        logger: iConfigLogger,
        get: iConfigGetter,
        defaultTransformers: iTransformer[] = [],
    ) {
        const value = await reader(path, logger, get)
        return [customTransformer, ...defaultTransformers, (v: unknown) => v].reduce(
            (transformedValue: unknown, transformer) => {
                if (transformedValue !== undefined) {
                    return transformedValue
                }
                return transformer(value)
            },
            undefined,
        )
    }
    Object.defineProperty(readerWithTransformers, 'name', { value: reader.name })
    return readerWithTransformers
}
