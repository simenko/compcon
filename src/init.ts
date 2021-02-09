import Compiler, { iCompile } from './Compiler/Compiler'
import Loader, { iLoad } from './Loader/Loader'
import { ConfigurationError, Codes } from './ConfigurationError'
import { js, json as jsonFileLoader, ts } from './Loader/fileLoaders'
import { conventional } from './Compiler/readers'
import { json, bool, num } from './Compiler/valueTransformers'
import { classTransformer, iConfigLogger, POJO, validator, Config } from './Config'
import { UntypedConfig } from './UntypedConfig'

export interface iConfigInitOptions<T> {
    logger?: iConfigLogger
    load?: iLoad
    compile?: iCompile
    validate?: validator<T>
}

let isInitialized = false

/* eslint-disable no-redeclare */
export function init<T>(transform: classTransformer<T>, options?: iConfigInitOptions<T>): Config<T>
export function init(options?: iConfigInitOptions<POJO>): Config
export function init<T>(
    transformerOrOptions?: classTransformer<T> | iConfigInitOptions<T>,
    options: iConfigInitOptions<T> = {},
): Config<T> | UntypedConfig {
    /* eslint-enable no-redeclare */

    if (isInitialized) {
        throw new ConfigurationError(
            Codes.INITIALIZATION_ERROR,
            undefined,
            'The configuration can only be initialized once',
        )
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
        ? new Config<T>(transform, logger, load, compile, validate)
        : new UntypedConfig(logger, load, compile, validate as validator<POJO>)
}
