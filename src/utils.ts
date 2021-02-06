import crypto from 'crypto'
import rawFlatten, { unflatten as rawUnflatten } from 'flat'
import { get as _get, has as _has, merge as _merge, cloneDeep } from 'lodash'
import { POJO } from './Config'
import { ConfigurationError, ErrorCodes } from './errors'

export function deepFreeze(obj: object): void {
    Object.getOwnPropertyNames(obj).forEach((prop) => {
        if (!Object.isFrozen(obj[prop as keyof typeof obj])) {
            deepFreeze(obj[prop as keyof typeof obj])
        }
    })
    Object.freeze(obj)
}

interface iCancelableTimeout extends Promise<unknown> {
    cancel: () => void
}

export function scheduleTimeout(time = 2000) {
    let cancel
    const timeoutPromise: Partial<iCancelableTimeout> = new Promise((resolve, reject) => {
        const timeout = setTimeout(reject, time)
        cancel = () => {
            clearTimeout(timeout)
            resolve(undefined)
        }
    })
    timeoutPromise.cancel = cancel
    return timeoutPromise as iCancelableTimeout
}

export const randomString = (length = 32) => crypto.randomFillSync(Buffer.alloc(Math.ceil(length / 2))).toString('hex')

export const flatten = (obj: POJO = {}): POJO => rawFlatten(obj, { safe: true })
export const unflatten = (obj: POJO = {}): POJO => rawUnflatten(obj, { overwrite: true })

export const has = (obj: POJO, path: string) => !path || _has(obj, path)
export const get = (obj: POJO, path: string = '') => {
    if (!has(obj, path)) {
        throw new ConfigurationError(ErrorCodes.ACCESS_ERROR, `Could not find path ${path}`, { path })
    }
    return !path ? obj : _get(obj, path)
}
export const merge = (...objs: POJO[]): POJO => _merge({}, ...objs)
export const clone = (obj: POJO) => cloneDeep(obj)

export const parseArgs = (argv: string[]): POJO =>
    argv
        .filter((arg) => arg.startsWith('--'))
        .map((arg) => {
            const [key, value] = arg.split('=')

            return { [key.replace('--', '')]: value === undefined ? true : value }
        })
        .reduce((args, pair) => ({ ...args, ...pair }), {})
