export function shallowCopy<T>(value: T): T {
    if (Array.isArray(value)) {
        return value.slice(0) as any
    }
    if (typeof value === 'object') {
        return { ...(value as any) }
    }

    return value
}
