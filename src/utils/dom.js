/**
 * Generator for the dynamically created DOM elements.
 *
 * @function DynamicDom
 * @ignore
 */
export default function () {
  // The DOM elements.
  const elems = new Map()

  // Public API.
  const api = {}

  /**
   * Adds a dynamically generated DOM element. The DOM element can be accessed by the specified name or its tag name.
   *
   * @method add
   * @memberOf DynamicDom
   * @param {string} tagName The tag name of the DOM element.
   * @param {string=} name The name of the DOM element. If specified, it will be used as the accessor method for the
   * element. If omitted, the tag name is used.
   */
  api.add = (tagName, name) => {
    // Create key: defaults to the tag name.
    const key = typeof name === 'undefined' ? tagName : name

    // Add accessor method.
    api[key] = () => {
      if (!elems.has(key)) {
        elems.set(key, document.createElement(tagName))
      }
      return elems.get(key)
    }
    return api
  }

  return api
}
