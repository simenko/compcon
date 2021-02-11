import { classTransformer, Config, POJO, validator } from './Config'
import { Codes, ConfigurationError } from './ConfigurationError'
import { iLoad } from './Loader'
import { iCompile } from './Compiler'

const layer1 = { a: { b: { c: 'reader1' } } }
const layer2 = { a: { b: { c: 'reader2', d: null } } }
const layer3 = { x: 1 }
const scenario1 = { a: { b: { c: 'reader2', d: null } } }
const rawConfiguration = { a: { b: { c: 'value', d: null } } }
const transformedConfiguration = { a: { b: { c: 'transformedValue', d: null } } }
const mockLoader: jest.MockedFunction<iLoad> = jest.fn(async (_1, _2) => scenario1)
const mockCompiler: jest.MockedFunction<iCompile> = jest.fn(async (_1) => rawConfiguration)
const mockTransformer: jest.MockedFunction<classTransformer<POJO>> = jest.fn((_1) => transformedConfiguration)
const mockValidator: jest.MockedFunction<validator<POJO>> = jest.fn((_1) => {})

describe('Configuration building', () => {
    let config
    beforeEach(() => {
        config = new Config({
            logger: console,
            load: mockLoader,
            compile: mockCompiler,
            transform: mockTransformer,
            validate: mockValidator,
        })
        jest.clearAllMocks()
    })
    it('Should call loader, compiler, transformer, and validator in order', async () => {
        await config.create([layer1, layer2])
        expect(mockLoader).toHaveBeenCalledWith([layer1, layer2], '')
        expect(mockCompiler).toHaveBeenCalledWith(scenario1)
        expect(mockTransformer).toHaveBeenCalledWith(rawConfiguration)
        expect(mockValidator).toHaveBeenCalledWith(transformedConfiguration)
    })

    it('Should add current config scenario as a first layer when update() called', async () => {
        await config.create([layer1, layer2])
        await config.update([layer3])
        expect(mockLoader.mock.calls[1][0]).toEqual([scenario1, layer3])
    })

    it('Should not add current config scenario as a first layer when create() called', async () => {
        await config.create([layer1, layer2])
        await config.create([layer3])
        expect(mockLoader.mock.calls[1][0]).toEqual([layer3])
    })

    it('Should allow subscribing on "configurationChanged" event and emit it after new config ready', async () => {
        const mockHandler = jest.fn()
        config.on('configurationChanged', mockHandler)
        await config.create([layer1, layer2])
        expect(mockHandler).toHaveBeenCalledWith(config)
    })

    it('Should not start building a new config until the previous build finished', async () => {
        const mockHandler = jest.fn()
        config.on('configurationChanged', mockHandler)
        const firstConfigPromise = config.create([layer1])
        const secondConfigPromise = config.create([layer2], 'test')
        const firstConfig = (await firstConfigPromise).get()
        mockTransformer.mockImplementationOnce((_1) => ({
            x: 1,
        }))
        expect(firstConfig).toEqual(transformedConfiguration)
        expect(mockLoader).toHaveBeenCalledWith([layer1], '')
        expect(mockLoader).toHaveBeenCalledTimes(1)
        expect(mockCompiler).toHaveBeenCalledTimes(1)
        expect(mockTransformer).toHaveBeenCalledTimes(1)
        expect(mockValidator).toHaveBeenCalledTimes(1)
        expect(mockHandler).toHaveBeenCalledTimes(1)
        const secondConfig = (await secondConfigPromise).get()
        expect(secondConfig).toEqual({ x: 1 })
        expect(mockLoader.mock.calls[1]).toEqual([[layer2], 'test'])
        expect(mockLoader).toHaveBeenCalledTimes(2)
        expect(mockCompiler).toHaveBeenCalledTimes(2)
        expect(mockTransformer).toHaveBeenCalledTimes(2)
        expect(mockValidator).toHaveBeenCalledTimes(2)
        expect(mockHandler).toHaveBeenCalledTimes(2)
    })

    it('Should fail with validation error when validator throws', async () => {
        const error = new Error('Oops!')
        mockValidator.mockImplementationOnce((_1) => {
            throw error
        })
        try {
            await config.create([layer1])
        } catch (e) {
            expect(e).toBeInstanceOf(ConfigurationError)
            expect(e.code).toEqual(Codes.VALIDATION_ERROR)
            expect(e.reason).toEqual(error)
        }
    })
})
describe('Untyped Config access', () => {
    let config
    beforeEach(async () => {
        config = await new Config({
            logger: console,
            load: mockLoader,
            compile: mockCompiler,
            transform: mockTransformer,
            validate: mockValidator,
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
            expect(config.get()).toEqual(transformedConfiguration)
        })

        it('Should return the subtree or leaf for the correct path', () => {
            expect(config.get('a.b')).toEqual(transformedConfiguration.a.b)
            expect(config.get('a.b.d')).toEqual(transformedConfiguration.a.b.d)
        })

        it('Should throw if the path not found', () => {
            expect(() => config.get('a.z')).toThrow(ConfigurationError)
        })
    })
})
