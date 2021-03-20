/**
 * Sets multiple attributes to a selection.
 *
 * @method attributes
 * @param {Object} selection D3 selection.
 * @param {Object} attributes Object representing the attributes to set.
 * @return {Object} The selection with the attributes set.
 */
export default function attributes (selection, attributes) {
  Object.entries(attributes)
    .forEach(([name, value]) => {
      selection.attr(name, value)
    })
  return selection
}
