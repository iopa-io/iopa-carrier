export function shallowCopy(value) {
    if (Array.isArray(value)) {
        return value.slice(0);
    }
    if (typeof value === 'object') {
        return { ...value };
    }
    return value;
}
//# sourceMappingURL=util.js.map