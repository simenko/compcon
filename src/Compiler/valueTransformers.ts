import { toNumber as _toNumber } from 'lodash'
import { POJO } from '../Config'

export interface iValueTransformer<T> {
    (value: unknown): T | undefined
}

export const json: iValueTransformer<POJO> = (value) => {
    if (typeof value !== 'string') {
        return undefined
    }
    try {
        return JSON.parse(value)
    } catch {
        return undefined
    }
}

export const bool: iValueTransformer<boolean> = (value) => {
    if (typeof value !== 'string') {
        return undefined
    }
    if (value.toLowerCase() === 'true') {
        return true
    } else if (value.toLowerCase() === 'false') {
        return false
    }
    return undefined
}

export const num: iValueTransformer<number> = (value) => {
    // Lodash toNumber() converts '' to 0 which is undesirable, hence the second check
    if (typeof value !== 'string' || value === '') {
        return undefined
    }
    const n = _toNumber(value)
    if (isFinite(n)) {
        return n
    }
    return undefined
}

export const passThrough: iValueTransformer<undefined> = (_: unknown) => undefined

const identity: iValueTransformer<unknown> = (v) => v

export const composeValueTransformers = (...transformers: iValueTransformer<unknown>[]): iValueTransformer<unknown> => (
    value: unknown,
) => {
    for (const t of [...transformers, identity]) {
        const transformedValue = t(value)
        if (transformedValue !== undefined) {
            return transformedValue
        }
    }
}
