import { toNumber as _toNumber } from 'lodash'
import { configValue } from '../Config'

export interface iValueTransformer<T> {
    (value: configValue): T
}

export const json: iValueTransformer<configValue | undefined> = (value) => {
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
    ...transformers: iValueTransformer<configValue | undefined>[]
) => iValueTransformer<configValue> = (...transformers) => (value: configValue) => {
    for (const t of [...transformers]) {
        const transformedValue = t(value)
        if (transformedValue !== undefined) {
            return transformedValue
        }
    }
    return value
}
