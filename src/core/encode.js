const CHARS = '0123456789abcdefghijklmnopqrstuvwxyz'

/**
 * Converts any string to a purely ascii ID.
 *
 * @method encode
 * @param {string} name Name to convert to an ID.
 * @return {string} The converted ascii ID.
 */
export default function (name) {
  if (name === '') {
    return 'da'
  }

  return 'da-' + Array.from(name).map(d => {
    // Convert character to lower case.
    let c = d.toLowerCase()

    // If it is a valid digit or letter, just return it.
    if (CHARS.indexOf(c) > -1) {
      return c
    }

    // If it's a space, replace with underscore.
    if (c === ' ') {
      return '_'
    }

    // Otherwise replace with 'U<code>-' where <code> is it's unicode point with radix of 32.
    return 'U' + c.charCodeAt(0).toString(32) + '-'
  }).join('')
}
