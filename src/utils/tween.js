import { interpolate, interpolateNumber } from 'd3'

export const textTween = format => {
  return function (d) {
    let prev = this._current || 0
    this._current = d.value
    let i = interpolateNumber(prev, d.value)
    return t => format(i(t))
  }
}

export const attrTween = (callback, tag) => {
  const key = '_current' + (tag || '')
  return function (d) {
    let i = interpolate(this[key], d)
    this[key] = i(0)
    return t => callback(i(t))
  }
}
