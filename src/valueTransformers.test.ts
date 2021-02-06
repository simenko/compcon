import { json, bool, num, composeValueTransformers } from './valueTransformers'

describe('Transformers', () => {
    describe('JSON transformer', () => {
        it('Should parse null', () => {
            expect(json('null')).toEqual(null)
        })

        it('Should parse valid objects', () => {
            const testObject = {
                testNum: 1,
                testString: 'str',
                testBool: true,
                testNull: null,
                testArray: [1, 'str', false, null, { nestedNum: 1 }],
            }

            const testJSON = JSON.stringify(testObject)
            expect(json(testJSON)).toEqual(testObject)
        })

        it('Should return undefined if the string is not valid json', () => {
            expect(json(1)).toEqual(undefined)
            expect(json('sdgdft')).toEqual(undefined)
            expect(json({})).toEqual(undefined)
        })
    })

    describe('Boolean transformer', () => {
        it('Should parse boolean values regardless of case', () => {
            expect(bool('true')).toEqual(true)
            expect(bool('True')).toEqual(true)
            expect(bool('TRUE')).toEqual(true)
            expect(bool('TruE')).toEqual(true)
            expect(bool('false')).toEqual(false)
            expect(bool('False')).toEqual(false)
            expect(bool('FALSE')).toEqual(false)
            expect(bool('FaLsE')).toEqual(false)
        })

        it('Should return undefined for everything else', () => {
            expect(bool(1)).toEqual(undefined)
            expect(bool(undefined)).toEqual(undefined)
            expect(bool(0)).toEqual(undefined)
            expect(bool('ok')).toEqual(undefined)
            expect(bool([])).toEqual(undefined)
        })
    })

    describe('Num trunsformer', () => {
        it('Should correctly parse decimal numbers', () => {
            expect(num('123456')).toEqual(123456)
            expect(num('0123456')).toEqual(123456)
            expect(num('-123456')).toEqual(-123456)
            expect(num('0101010.01')).toEqual(101010.01)
        })

        it('Should correctly parse non-decimal numbers', () => {
            expect(num('0b10')).toEqual(2)
            expect(num('0B10')).toEqual(2)

            expect(num('0o10')).toEqual(8)
            expect(num('0O10')).toEqual(8)

            expect(num('0x10')).toEqual(16)
            expect(num('0X10')).toEqual(16)
        })

        it('Should parse scientific notation', () => {
            expect(num('1e3')).toEqual(1000)
        })

        it('Should return undefined for non-numbers or infsetupy', () => {
            expect(num(1 / 0)).toEqual(undefined)
            expect(num('0z10')).toEqual(undefined)
            expect(num(Infinity)).toEqual(undefined)
            expect(num(null)).toEqual(undefined)
            expect(num({})).toEqual(undefined)
            expect(num(false)).toEqual(undefined)
            expect(num(true)).toEqual(undefined)
            expect(num('')).toEqual(undefined)
            expect(num([])).toEqual(undefined)
        })

        it('Should return undefined if a value is already numeric', () => {
            expect(num(10)).toEqual(undefined)
        })
    })

    describe('Transformers compositor', () => {
        it('Should return identity transformer when called without params', () => {
            const compositeTransformer = composeValueTransformers()
            expect(compositeTransformer('null')).toEqual('null')
            expect(compositeTransformer(null)).toEqual(null)
            expect(compositeTransformer(1)).toEqual(1)
            expect(compositeTransformer('1')).toEqual('1')
            expect(compositeTransformer('true')).toEqual('true')
        })

        it('Should try transformers from left to right, until one of them returns a value other than undefined', () => {
            const firstTransformer = jest.fn(() => 'b')
            const secondTransformer = jest.fn()
            const compositeTransformer = composeValueTransformers(firstTransformer, secondTransformer)
            expect(compositeTransformer('a')).toEqual('b')
            expect(firstTransformer).toHaveBeenCalledWith('a')
            expect(secondTransformer).not.toHaveBeenCalled()
        })

        it('The resulting transformer should return the value as is if all transformers have returned undefined', () => {
            const firstTransformer = jest.fn()
            const secondTransformer = jest.fn()
            const compositeTransformer = composeValueTransformers(firstTransformer, secondTransformer)
            expect(compositeTransformer('a')).toEqual('a')
            expect(firstTransformer).toHaveBeenCalledWith('a')
            expect(secondTransformer).toHaveBeenCalledWith('a')
        })
    })
})
