import { select } from 'd3'

/**
 * Gets/creates an SVG and the global defs used by the library.
 *
 * @method defs
 * @return {Function} Getter to the selection containing the defs.
 */
export default (() => {
  const TAG = 'dalian-defs'
  const _ = {}

  // TODO Docstring.
  function getDefs () {
    if (typeof _.defs === 'undefined') {
      console.log('create defs')
      _.defs = select('body').append('svg')
        .attr('id', TAG)
        .append('defs')
    }
    return _.defs
  }

  const api = {}

  /* test-code */
  api.__test__ = {
    _reset () {
      _.defs = undefined
      return api
    },
    getDefs,
    TAG
  }
  /* end-test-code */

  // TODO Docstring.
  api.addMask = (id, pos, size) => {
    return getDefs().append('mask')
      .attr('id', id)
      .attr('x', pos.x)
      .attr('y', pos.y)
      .attr('width', size.width)
      .attr('height', size.height)
  }

  // TODO Docstring.
  api.addPattern = (id, pos, size) => {
    return getDefs().append('pattern')
      .attr('id', id)
      .attr('x', pos.x)
      .attr('y', pos.y)
      .attr('width', size.width)
      .attr('height', size.height)
      .attr('patternUnits', 'userSpaceOnUse')
      .attr('patternTransform', 'rotate(-45)')
  }

  return api
})()
