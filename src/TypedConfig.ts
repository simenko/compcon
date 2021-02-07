import { iCompile } from './Compiler/Compiler'
import { iLoad } from './Loader/Loader'
import { BaseConfig, classTransformer, iConfigLogger, validator } from './BaseConfig'

export class TypedConfig<T> extends BaseConfig<T> {
    constructor(
        protected transform: classTransformer<T>,
        logger: iConfigLogger,
        load: iLoad,
        compile: iCompile,
        validate?: validator<T>,
    ) {
        super(logger, load, compile, validate)
    }

    public get(): T {
        return this.config
    }
}
