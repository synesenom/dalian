/**
 * Extends a function with another one.
 *
 * @method extend
 * @param {Function} func Function to extend.
 * @param {Function} extension Extension method.
 * @returns {Function} The extended function.
 */
export default (func, extension) => {
  let baseFunc = func
  return (...args) => {
    baseFunc(...args)
    extension(...args)
  }
}
