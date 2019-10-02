/**
 * Extends a function with another one.
 *
 * @method extend
 * @param {Function} func Function to extend.
 * @param {Function} extension Extension method.
 * @param {boolean} [before = false] Whether to call extension before or after the base function.
 * @returns {Function} The extended function.
 */
export default (func, extension, before = false) => {
  let baseFunc = func
  return (...args) => {
    if (before) {
      extension(...args)
      baseFunc(...args)
    } else {
      baseFunc(...args)
      extension(...args)
    }
  }
}
