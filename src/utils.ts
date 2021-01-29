export function deepFreeze(obj: object): void {
    Object.getOwnPropertyNames(obj).forEach((prop) => {
        if (!Object.isFrozen(obj[prop as keyof typeof obj])) {
            deepFreeze(obj[prop as keyof typeof obj])
        }
    })
    Object.freeze(obj)
}
