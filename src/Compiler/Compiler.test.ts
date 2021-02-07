import Compiler, { iCompile } from './Compiler'
import { iConfigLogger } from '../BaseConfig'
import { json, bool, num } from './valueTransformers'
import { conventional } from './readers'

jest.mock('./readers')
const { conventional: realConventional } = jest.requireActual('./readers')
const conventionalReaderSpy = jest.fn(realConventional())
;(conventional as jest.Mock).mockReturnValue(conventionalReaderSpy)

const mockLogger: iConfigLogger = {
    info: jest.fn(),
    debug: jest.fn(),
}

const mockReader: jest.Mock = jest.fn(async () => 1)
const mockPrimitiveScenario = {
    testPath: {
        withReader: mockReader,
        withoutReader: 1,
    },
}

describe('Default behavior', () => {
    let compile: iCompile
    beforeEach(() => {
        compile = Compiler(mockLogger, conventional, [json, bool, num])
    })

    it('Should call the reader and pass the logger and default transformers to it', async () => {
        await compile(mockPrimitiveScenario)
        expect(mockReader).toHaveBeenCalledWith('testPath.withReader', mockLogger, expect.any(Function), [
            json,
            bool,
            num,
        ])
    })

    it('Should call the conventional reader for non-functional values', async () => {
        await compile(mockPrimitiveScenario)
        expect(conventional).toHaveBeenCalledWith(1)
        expect(conventionalReaderSpy).toHaveBeenCalledWith('testPath.withoutReader', mockLogger, expect.any(Function), [
            json,
            bool,
            num,
        ])
    })
})
