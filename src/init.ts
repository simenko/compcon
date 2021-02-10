import Compiler, { iCompile } from './Compiler/Compiler'
import Loader, { iLoad } from './Loader/Loader'
import { ConfigurationError, Codes } from './ConfigurationError'
import { js, json as jsonFileLoader, ts } from './Loader/fileLoaders'
import { conventional } from './Compiler/readers'
import { json, bool, num } from './Compiler/valueTransformers'
import { classTransformer, iConfigLogger, POJO, validator, Config } from './Config'

export interface iConfigInitOptions<T> {
    logger?: iConfigLogger
    load?: iLoad
    compile?: iCompile
    validate?: validator<T>
    transform?: classTransformer<T>
}

let isInitialized = false
const stubTransformer = function <T>() {
    return (rawConfig: POJO): T => (rawConfig as unknown) as T
}

// @TODO: Decide if it is really necessary to enforce singleton here, or leave it to the end user
export function init<T = POJO>(options: iConfigInitOptions<T> = {}): Config<T> {
    if (isInitialized) {
        throw new ConfigurationError(
            Codes.INITIALIZATION_ERROR,
            undefined,
            'The configuration can only be initialized once',
        )
    }
    const {
        logger = console,
        load = Loader(logger, [jsonFileLoader, js, ts]),
        compile = Compiler(logger, conventional, [json, bool, num]),
        validate,
        transform = stubTransformer<T>(),
    } = options

    isInitialized = true
    return new Config<T>(transform, logger, load, compile, validate)
}
