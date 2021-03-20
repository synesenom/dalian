import { interpolate } from 'd3'

/**
 * Creates an attribute tween with the specified callback.
 *
 * @method attrTween
 * @param {function} callback Function to run on transition.
 * @param {string} [tag = ''] Tag to append to the element to mark this transition.
 * @return {function} The attribute tween function.
 */
export const attrTween = (callback, tag = '') => {
  const key = '_current' + tag
  return function (d) {
    const i = interpolate(this[key], d)
    this[key] = i(0)
    return t => callback(i(t))
  }
}
