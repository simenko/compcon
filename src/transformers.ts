import { toNumber as _toNumber } from 'lodash'
export interface iTransformer {
    (value: unknown): unknown[] | object | number | string | boolean | undefined
}

export const json: iTransformer = (value) => {
    if (typeof value !== 'string') {
        return undefined
    }
    try {
        return JSON.parse(value)
    } catch {
        return undefined
    }
}

export const bool: iTransformer = (value) => {
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

export const num: iTransformer = (value) => {
    if (typeof value !== 'string') {
        return undefined
    }
    const n = _toNumber(value)
    if (isFinite(n)) {
        return n
    }
    return undefined
}
