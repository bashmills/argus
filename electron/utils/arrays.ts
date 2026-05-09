export function asArray<T>(value?: T[] | T): T[] {
  return value ? (!Array.isArray(value) ? [value] : value) : [];
}
