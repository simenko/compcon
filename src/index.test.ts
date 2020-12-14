import { identity } from './index'

test('Returns what passed into it', () => {
    expect(identity(1)).toBe(1)
})
