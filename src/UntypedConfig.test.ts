import { UntypedConfig } from './UntypedConfig'
import { ConfigurationError } from './ConfigurationError'
import { iLoad } from './Loader'
import { iCompile } from './Compiler'

const layer1 = { a: { b: { c: 'reader1' } } }
const scenario1 = { a: { b: { c: 'reader2', d: null } } }
const rawConfiguration = { a: { b: { c: 'value', d: null } } }
const mockLoader: jest.MockedFunction<iLoad> = jest.fn(async (_1, _2) => scenario1)
const mockCompiler: jest.MockedFunction<iCompile> = jest.fn(async (_1) => rawConfiguration)

describe('Untyped Config access', () => {
    let config
    beforeEach(async () => {
        config = await new UntypedConfig({
            logger: console,
            load: mockLoader,
            compile: mockCompiler,
        }).create([layer1])
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
            expect(config.get()).toEqual(rawConfiguration)
        })

        it('Should return the subtree or leaf for the correct path', () => {
            expect(config.get('a.b')).toEqual(rawConfiguration.a.b)
            expect(config.get('a.b.d')).toEqual(rawConfiguration.a.b.d)
        })

        it('Should throw if the path not found', () => {
            expect(() => config.get('a.z')).toThrow(ConfigurationError)
        })
    })
})
