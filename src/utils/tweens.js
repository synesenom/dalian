import { interpolate } from 'd3'

// TODO Docstring.
export const attrTween = (callback, tag) => {
  const key = '_current' + (tag || '')
  return function (d) {
    const i = interpolate(this[key], d)
    this[key] = i(0)
    // TODO Should the second parameter be removed?
    return t => callback(i(t), d)
  }
}
