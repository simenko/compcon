import { POJO } from './index'

export interface iLoader {
    (filename: string): Promise<POJO>
}

export const ts: iLoader = async function ts(filename) {
    return import(filename).then((module) => module.default)
}

export const js: iLoader = async function js(filename) {
    return import(filename).then((module) => module.default)
}

export const json: iLoader = async function json(filename) {
    return import(filename).then((module) => module.default)
}
