import * as pathTransformers from '../pathTransformers'
import * as valueTransformers from '../valueTransformers'
import { iConfigGetter } from '../Compiler'
import { iReader, withTransformers } from './common'

const mockGet: iConfigGetter = jest.fn(async (path: string) => path)
const mockReader: iReader = jest.fn(async function reader(_1, _2, _3) {
    return 1
})

describe('withTransformers decorator', () => {
    const mockPathTransformer: pathTransformers.iPathTransformer = jest.fn(() => 'x')
    const mockValueTransformer: valueTransformers.iValueTransformer<number> = jest.fn(() => 2)
    const passThroughSpy = jest.spyOn(valueTransformers, 'passThrough')
    const identitySpy = jest.spyOn(pathTransformers, 'identity')

    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('Should use default path and value transformers unless custom ones are given', async () => {
        const mockReaderWithTransformers = withTransformers(mockReader)
        await mockReaderWithTransformers('a', console, mockGet)
        expect(passThroughSpy).toHaveBeenCalledWith(1)
        expect(identitySpy).toHaveBeenCalledWith('a')
    })

    it('Should use given path and value transformers instead of default ones', async () => {
        const mockReaderWithTransformers = withTransformers(mockReader, mockPathTransformer, mockValueTransformer)
        await mockReaderWithTransformers('a', console, mockGet)
        expect(passThroughSpy).not.toHaveBeenCalled()
        expect(mockValueTransformer).toHaveBeenCalledWith(1)
        expect(identitySpy).not.toHaveBeenCalled()
        expect(mockPathTransformer).toHaveBeenCalledWith('a')
    })

    it('Should accept path transformer in the form of string constant', async () => {
        const mockReaderWithTransformers = withTransformers(mockReader, 'customPath', mockValueTransformer)
        await mockReaderWithTransformers('a', console, mockGet)
        expect(mockReader).toHaveBeenCalledWith('customPath', console, mockGet)
    })

    it('The decorated reader should receive the transformed path', async () => {
        const mockReaderWithTransformers = withTransformers(mockReader, mockPathTransformer)
        await mockReaderWithTransformers('a', console, mockGet)
        expect(mockReader).toHaveBeenCalledWith('x', console, mockGet)
    })

    it('The value obtained from reader should be transformed by the given value transformer', async () => {
        const mockReaderWithTransformers = withTransformers(mockReader, undefined, mockValueTransformer)
        const value = await mockReaderWithTransformers('a', console, mockGet)
        expect(mockValueTransformer).toHaveBeenCalledWith(1)
        expect(value).toEqual(2)
    })

    it('The decorated reader should accept the array of default transformers at the compilation stage and apply them', async () => {
        const mockReaderWithTransformers = withTransformers(mockReader)
        const value = await mockReaderWithTransformers('a', console, mockGet, [mockValueTransformer])
        expect(mockValueTransformer).toHaveBeenCalledWith(1)
        expect(value).toEqual(2)
    })

    it('Custom value transformer should override default transformers', async () => {
        const customTransformer: valueTransformers.iValueTransformer<number> = jest.fn(() => 3)
        const mockReaderWithTransformers = withTransformers(mockReader, undefined, customTransformer)
        const value = await mockReaderWithTransformers('a', console, mockGet, [mockValueTransformer])
        expect(customTransformer).toHaveBeenCalledWith(1)
        expect(value).toEqual(3)
    })

    it(`Should add "withTransformers" suffix to the reader's name`, () => {
        expect(withTransformers(mockReader).name).toEqual(`${mockReader.name}WithTransformers`)
    })

    it('Should not decorate already decorated reader', () => {
        const mockReaderWithTransformers = withTransformers(mockReader)
        expect(withTransformers(mockReaderWithTransformers)).toEqual(mockReaderWithTransformers)
    })
})
