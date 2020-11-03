/**
 * Sets multiple styles to a selection.
 *
 * @method styles
 * @param {Object} selection D3 selection.
 * @param {Object} styles Object representing the styles to set.
 * @return {Object} The selection with the styles set.
 */
export default (selection, styles) => {
  Object.entries(styles).forEach(([name, value]) => {
    selection.style(name, value)
  })
  return selection
}
