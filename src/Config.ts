import { get, has } from './utils'
import { BaseConfig, classTransformer, POJO } from './BaseConfig'

export class Config extends BaseConfig<POJO> {
    public get(path?: string): unknown {
        return get(this.config, path)
    }

    public has(path: string) {
        return has(this.config, path)
    }

    protected transform: classTransformer<POJO> = (rawConfig) => rawConfig
}
