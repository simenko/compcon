import { toNumber as _toNumber } from 'lodash'
import { configLeaf, tree } from '../Config'

export interface iValueTransformer<T> {
    (value: configLeaf | tree<configLeaf>): T
}

export const json: iValueTransformer<configLeaf | tree<configLeaf> | undefined> = (value) => {
    if (typeof value !== 'string') {
        return undefined
    }
    try {
        return JSON.parse(value)
    } catch {
        return undefined
    }
}

export const bool: iValueTransformer<boolean | undefined> = (value) => {
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

export const num: iValueTransformer<number | undefined> = (value) => {
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

export const composeValueTransformers: (
    ...transformers: iValueTransformer<configLeaf | tree<configLeaf> | undefined>[]
) => iValueTransformer<configLeaf | tree<configLeaf>> = (...transformers) => (value: configLeaf | tree<configLeaf>) => {
    for (const t of [...transformers]) {
        const transformedValue = t(value)
        if (transformedValue !== undefined) {
            return transformedValue
        }
    }
    return value
}
