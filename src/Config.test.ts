import { Config } from './Config'
import { ConfigurationError } from './ConfigurationError'

const configuration = { a: { b: { c: 1, d: undefined } } }

describe.skip('Untyped Config class', () => {
    let config
    beforeEach(() => {
        config = new Config()
    })
    describe('has', () => {
        it('Should return true for empty path', () => {
            expect(config.has('')).toEqual(true)
        })

        it('Should return true if an object has the path', () => {
            expect(config.has('a.b')).toEqual(true)
        })

        it('Should return false if an object does not have the path', () => {
            expect(config.has('a.z')).toEqual(false)
        })
    })

    describe('get', () => {
        it('Should return the whole object when called with empty path', () => {
            expect(config.get()).toEqual(configuration)
        })

        it('Should return the subtree or leaf for the correct path', () => {
            expect(config.get('a.b')).toEqual(configuration.a.b)
            expect(config.get('a.b.d')).toEqual(configuration.a.b.d)
        })

        it('Should throw if the path not found', () => {
            expect(() => config.get('zzz.xxx')).toThrow(ConfigurationError)
        })
    })
})
