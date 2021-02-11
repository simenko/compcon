import { scenario } from '../Config'

export interface iFileLoader {
    (filename: string): Promise<scenario>
}

export const ts: iFileLoader = async function ts(filename) {
    return import(filename).then((module) => module.default)
}

export const js: iFileLoader = async function js(filename) {
    return import(filename).then((module) => module.default)
}

export const json: iFileLoader = async function json(filename) {
    return import(filename).then((module) => module.default)
}
