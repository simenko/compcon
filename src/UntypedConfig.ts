import { Codes, ConfigurationError } from './ConfigurationError'
import { get, has } from 'lodash'
import { Config, configLeaf, iConfigLogger, tree, validator } from './Config'
import { iLoad } from './Loader'
import { iCompile } from './Compiler'

interface iUntypedConfigOptions {
    logger?: iConfigLogger
    load?: iLoad
    compile?: iCompile
    validate?: validator<tree<configLeaf>>
}

export class UntypedConfig extends Config<tree<configLeaf>> {
    constructor(options: iUntypedConfigOptions = {}) {
        super({
            ...options,
            transform: (c: tree<configLeaf>): tree<configLeaf> => c,
            validate: options.validate ?? ((_1) => {}),
        })
    }

    public get(path?: string): configLeaf | tree<configLeaf> {
        if (!this.has(path)) {
            throw new ConfigurationError(Codes.ACCESS_ERROR, { path }, `Could not find path ${path}`)
        }
        return !path ? this.config : get(this.config, path)
    }

    public has(path?: string) {
        return !path || has(this.config, path)
    }
}
