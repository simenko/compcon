import { Config, POJO, classTransformer, iConfigLogger, validator } from './Config'
import { iLoad } from './Loader/Loader'
import { iCompile } from './Compiler/Compiler'
import { ConfigurationError, Codes } from './ConfigurationError'
import { get, has } from 'lodash'

const stubTransformer: classTransformer<POJO> = (rawConfig) => rawConfig

export class UntypedConfig extends Config<POJO> {
    constructor(logger: iConfigLogger = console, load: iLoad, compile: iCompile, validate?: validator<POJO>) {
        super(stubTransformer, logger, load, compile, validate)
    }

    public get(path?: string) {
        if (!this.has(path)) {
            throw new ConfigurationError(Codes.ACCESS_ERROR, { path }, `Could not find path ${path}`)
        }
        return !path ? this.config : get(this.config, path)
    }

    public has(path?: string) {
        return !path || has(this.config, path)
    }
}
