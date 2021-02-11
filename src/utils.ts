import crypto from 'crypto'
import rawFlatten, { unflatten as rawUnflatten } from 'flat'
import { merge as _merge, cloneDeep } from 'lodash'
import { POJO } from './Config'

export function deepFreeze(obj: unknown): void {
    if (obj === null) {
        return
    }
    // Arrays are OK
    if (typeof obj !== 'object') {
        return
    }
    Object.getOwnPropertyNames(obj).forEach((prop) => {
        // We know for sure that prop is an obj's key and obj is not null, but Typescript seems to not see it
        if (!Object.isFrozen(obj![prop as keyof typeof obj])) {
            deepFreeze(obj![prop as keyof typeof obj])
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

export const randomString = (length = 32) =>
    crypto
        .randomFillSync(Buffer.alloc(Math.ceil(length / 2)))
        .toString('hex')
        .substr(0, length)

export const parseArgs = (argv: string[]): POJO =>
    argv
        .filter((arg) => arg.startsWith('--'))
        .map((arg) => {
            const [key, value] = arg.split('=')

            return { [key.replace('--', '')]: value === undefined ? true : value }
        })
        .reduce((args, pair) => ({ ...args, ...pair }), {})

export const flatten = (obj: POJO = {}): POJO => rawFlatten(obj, { safe: true })
export const unflatten = (obj: POJO = {}): POJO => rawUnflatten(obj, { overwrite: true })
export const merge = (...objs: POJO[]): POJO => _merge({}, ...objs)
export const clone = (obj: POJO) => cloneDeep(obj)
