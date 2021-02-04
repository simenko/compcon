import { argPathTransformer, envPathTransformer } from './pathTransformers'

describe('Path transformers', () => {
    describe('Env path transformer', () => {
        it('Should replace . with _ and capitalize path', () => {
            expect(envPathTransformer('a.b')).toEqual('A_B')
        })
    })

    describe('Arg path transformer', () => {
        it('Should replace . with - ', () => {
            expect(argPathTransformer('a.b')).toEqual('a-b')
        })
    })
})
