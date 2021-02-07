import Compiler, { iCompile } from './Compiler/Compiler'
import Loader, { iLoad } from './Loader/Loader'
import { ConfigurationError, ErrorCodes } from './errors'
import { js, json as jsonFileLoader, ts } from './Loader/fileLoaders'
import { conventional } from './Compiler/readers'
import { json, bool, num } from './Compiler/valueTransformers'
import { classTransformer, iConfigLogger, POJO, validator } from './BaseConfig'
import { TypedConfig } from './TypedConfig'
import { Config } from './Config'

export interface iConfigInitOptions<T> {
    logger?: iConfigLogger
    load?: iLoad
    compile?: iCompile
    validate?: validator<T>
}

let isInitialized = false

/* eslint-disable no-redeclare */
export function init<T>(transform: classTransformer<T>, options?: iConfigInitOptions<T>): TypedConfig<T>
export function init(options?: iConfigInitOptions<POJO>): Config
export function init<T>(
    transformerOrOptions?: classTransformer<T> | iConfigInitOptions<T>,
    options: iConfigInitOptions<T> = {},
): TypedConfig<T> | Config {
    /* eslint-enable no-redeclare */

    if (isInitialized) {
        throw new ConfigurationError(ErrorCodes.INITIALIZATION_ERROR, 'The configuration can only be initialized once')
    }

    let transform
    if (typeof transformerOrOptions === 'function') {
        transform = transformerOrOptions as classTransformer<T>
    } else {
        options = (transformerOrOptions || options) as iConfigInitOptions<T>
    }

    const {
        logger = console,
        load = Loader(logger, [jsonFileLoader, js, ts]),
        compile = Compiler(logger, conventional, [json, bool, num]),
        validate,
    } = options

    isInitialized = true
    return transform
        ? new TypedConfig<T>(transform, logger, load, compile, validate)
        : new Config(logger, load, compile, validate as validator<POJO>)
}
