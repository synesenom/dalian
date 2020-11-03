import { select } from 'd3'

/**
 * Gets/creates an SVG and the global defs used by the library.
 *
 * @method defs
 * @return {Function} Getter to the selection containing the defs.
 */
export default (() => {
  let defs = undefined

  return () => {
    if (typeof defs === 'undefined') {
      defs = select('body').append('svg')
        .attr('id', 'dalian-defs')
        .append('defs')
    }
    return defs
  }
})()
