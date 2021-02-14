import { Config } from './Config'

export class TypedConfig<T> extends Config<T> {
    public getClass(): T {
        return this.config
    }
}
