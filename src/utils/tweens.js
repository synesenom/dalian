import { interpolate } from 'd3'

export const attrTween = (callback, tag) => {
  const key = '_current' + (tag || '')
  return function (d) {
    let i = interpolate(this[key], d)
    this[key] = i(0)
    return t => callback(i(t), d)
  }
}
