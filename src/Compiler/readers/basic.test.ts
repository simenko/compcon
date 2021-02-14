import { arg, env, get } from './basic'
import * as pathTransformers from '../pathTransformers'
import { iConfigGetter } from '../Compiler'

const mockGet: iConfigGetter = jest.fn(async (path: string) => path)

describe('Basic readers', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    describe('Env reader creator', () => {
        const envPathTransformerSpy = jest.spyOn(pathTransformers, 'envPathTransformer')

        const originalEnv = JSON.stringify(process.env)

        afterEach(() => {
            process.env = JSON.parse(originalEnv)
        })
        it('Should use default env path transformer unless custom one is given', () => {
            const reader = env()
            reader('a.b', console, mockGet)
            expect(envPathTransformerSpy).toHaveBeenCalledWith('a.b')
        })

        it('Should read values from process.env', async () => {
            process.env = { A_B: 'valueFromA_B' }
            const reader = env()
            const value = await reader('a.b', console, mockGet)
            expect(value).toEqual(process.env.A_B)
        })
    })

    describe('Arg reader creator', () => {
        const argPathTransformerSpy = jest.spyOn(pathTransformers, 'argPathTransformer')

        const originalArgv = JSON.stringify(process.argv)

        afterEach(() => {
            process.argv = JSON.parse(originalArgv)
        })
        it('Should use default arg path transformer unless custom one is given', () => {
            const reader = arg()
            reader('a.b', console, mockGet)
            expect(argPathTransformerSpy).toHaveBeenCalledWith('a.b')
        })

        it('Should read values from args', async () => {
            process.argv = ['', '', '--a-b=valueFrom--a-b']
            const reader = arg()
            const value = await reader('a.b', console, mockGet)
            expect(value).toEqual('valueFrom--a-b')
        })
    })

    describe('Get reader creator', () => {
        it('Should call the config getter with given path', () => {
            const reader = get()
            reader('a.b', console, mockGet)
            expect(mockGet).toHaveBeenCalledWith('a.b')
        })

        it('Should return the value obtained from config getter', async () => {
            const reader = get()
            const value = await reader('a.b', console, mockGet)
            expect(value).toEqual('a.b')
        })
    })
})
