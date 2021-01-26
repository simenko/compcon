import { get as _get, set as _set, cloneDeep as _cloneDeep } from 'lodash'
import { iConfigGetter, iReader } from './readers'
import { iConfigLogger, POJO } from './Config'

export default async function compile(scenario: POJO, logger: iConfigLogger): Promise<POJO> {
    const config = _cloneDeep(scenario)
    const pendingAsyncNodes: Promise<unknown>[] = []
    const freezingRefs: POJO[] = [config]

    function traverse(configSubtree: POJO, pathPrefix = ''): void {
        Object.entries(configSubtree).forEach(([nodeName, node]) => {
            const path = pathPrefix ? `${pathPrefix}.${nodeName}` : nodeName
            if (typeof node === 'function') {
                invokeReader(path, node as iReader)
            }
            if (Array.isArray(node)) {
                return
            }
            if (typeof node === 'object' && node !== null) {
                traverse(node as POJO, path)
                freezingRefs.push(node as POJO)
            }
        })
    }

    function invokeReader(path: string, reader: iReader): void {
        const pendingValue = reader(path, logger, get).then((value) => {
            _set(config, path, value)
            return value
        })
        _set(config, path, pendingValue)
        pendingAsyncNodes.push(pendingValue)
    }

    const get: iConfigGetter = async function (path: string) {
        const node = _get(config, path)
        if (typeof node === 'function') {
            invokeReader(path, node as iReader)
        }
        return _get(config, path)
    }

    traverse(config)
    await Promise.all(pendingAsyncNodes)
    freezingRefs.forEach((node) => Object.freeze(node))
    return config
}
