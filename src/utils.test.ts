import { deepFreeze, get, has, merge, randomString, parseArgs, scheduleTimeout } from './utils'
import { ConfigurationError } from './errors'

describe('Utility functions', () => {
    describe('merge', () => {
        it('Should merge nested objects deeply', async () => {
            expect(merge({ a: { b: { c1: 1, c2: 2 } } }, { a: { b: { c1: 2 } } })).toEqual({
                a: { b: { c1: 2, c2: 2 } },
            })
        })

        it('Should replace arrays', async () => {
            expect(merge({ a: [1, 2, 3] }, { a: ['a', 'b', 'c'] })).toEqual({ a: ['a', 'b', 'c'] })
        })
    })

    describe('has', () => {
        it('Should return true for empty path', () => {
            expect(has({}, '')).toEqual(true)
        })

        it('Should return true if an object has the path', () => {
            expect(has({ a: { b: null } }, 'a.b')).toEqual(true)
        })

        it('Should return false if an object does not have the path', () => {
            expect(has({ a: { b: null } }, 'a.c')).toEqual(false)
        })
    })

    describe('get', () => {
        it('Should return the whole object when called with empty path', () => {
            expect(get({}, '')).toEqual({})
        })

        it('Should return the subtree or leaf for the correct path', () => {
            expect(get({ a: { b: { c: 1 } } }, 'a.b')).toEqual({ c: 1 })
            expect(get({ a: { b: { c: undefined } } }, 'a.b.c')).toEqual(undefined)
        })

        it('Should throw if the path not found', () => {
            expect(() => get({}, 'a')).toThrow(ConfigurationError)
        })
    })

    describe('deepFreeze', () => {
        it('Should freeze all nested objects and arrays', () => {
            const obj = { a: { b1: { c: 1 }, b2: { c2: [1, 2, 3] } } }
            deepFreeze(obj)
            expect(Object.isFrozen(obj)).toEqual(true)
            expect(Object.isFrozen(obj.a)).toEqual(true)
            expect(Object.isFrozen(obj.a.b1)).toEqual(true)
            expect(Object.isFrozen(obj.a.b1.c)).toEqual(true)
            expect(Object.isFrozen(obj.a.b2)).toEqual(true)
            expect(Object.isFrozen(obj.a.b2.c2)).toEqual(true)
            expect(Object.isFrozen(obj.a.b2.c2[0])).toEqual(true)
        })
    })

    describe('randomString', () => {
        it('Should return the string of a correct length', () => {
            expect(randomString(2)).toHaveLength(2)
            expect(randomString(3)).toHaveLength(3)
        })

        it('Should generate string of length 32 by default', () => {
            expect(randomString()).toHaveLength(32)
        })

        it('Should generate lower-case hexadecimal string', () => {
            expect(randomString()).toMatch(/^[0-9a-f]+$/)
        })
    })

    describe('parseArgs', () => {
        it('Should create a key for each arg starting from "--"', () => {
            expect(Object.keys(parseArgs(['a', '--b', '--c=1', 'd']))).toEqual(['b', 'c'])
        })

        it('Should assign each key a string value found after "="', () => {
            expect(parseArgs(['--a=1', '--b=c'])).toEqual({ a: '1', b: 'c' })
        })

        it('Should assign true for each kay without a value', () => {
            expect(parseArgs(['--a'])).toEqual({ a: true })
        })
    })

    describe('scheduleTimeout', () => {
        beforeEach(() => {
            jest.useFakeTimers()
        })
        afterEach(() => {
            jest.useRealTimers()
        })
        it('Should return a Promise which rejects after the specified timeout passed', async () => {
            const time = 1000
            const resolveSpy = jest.fn()
            const rejectSpy = jest.fn()
            scheduleTimeout(time).then(resolveSpy, rejectSpy)
            expect(setTimeout).toHaveBeenCalledTimes(1)
            expect(setTimeout).toHaveBeenLastCalledWith(expect.any(Function), time)
            expect(resolveSpy).not.toHaveBeenCalled()
            expect(rejectSpy).not.toHaveBeenCalled()
            jest.runAllTimers()
            // Wait a bit to purge microtasks queue
            await Promise.resolve()
            expect(resolveSpy).not.toHaveBeenCalled()
            expect(rejectSpy).toHaveBeenCalledTimes(1)
        })

        it('Should allow canceling the timeout rejection with cancel() method', async () => {
            const timeout = scheduleTimeout(1000)
            timeout.cancel()
            await expect(timeout).resolves.toEqual(undefined)
        })
    })
})
