import Defs from '../utils/defs'

// TODO Docstring.
export default (() => {
  const TAGS = {
    dashed: {
      pattern: 'dalian-pattern-dashed',
      mask: 'dalian-mask-dashed'
    },
    dotted: {
      pattern: 'dalian-pattern-dotted',
      mask: 'dalian-mask-dotted'
    }
  }
  const _ = {}

  // TODO Docstring.
  function createPattern (id) {
    return Defs.addPattern(id, { x: 0, y: 0 }, { width: 4, height: 4 })
  }

  // TODO Docstring.
  function createMask (maskId, patternId) {
    return Defs.addMask(maskId, { x: 0, y: 0 }, { width: 4, height: 4 })
      .append('rect')
      .attr('x', '-50%')
      .attr('y', '-50%')
      .attr('width', '100%')
      .attr('height', '100%')
      .attr('fill', `url(#${patternId})`)
  }

  const api = {}

  /* test-code */
  api.__test__ = {
    _reset () {
      Defs.__test__._reset()
      _.dashedId = undefined
      _.dottedId = undefined
      return api
    },
    TAGS
  }
  /* end-test-code */

  // TODO Docstring.
  api.get = name => {
    switch (name) {
      case 'solid':
      default:
        return null

      case 'dashed':
        if (typeof _.dashedId === 'undefined') {
          const patternId = TAGS.dashed.pattern
          createPattern(patternId)
            .append('path')
            .attr('d', 'm 0 0 h 4')
            .attr('stroke', '#fff')
            .attr('stroke-width', 4)
          _.dashedId = TAGS.dashed.mask
          createMask(_.dashedId, patternId)
        }
        return `url(#${_.dashedId})`

      case 'dotted':
        if (typeof _.dottedId === 'undefined') {
          const patternId = TAGS.dotted.pattern
          createPattern(patternId)
            .append('circle')
            .attr('cx', 2)
            .attr('cy', 2)
            .attr('r', 1.5)
            .attr('fill', '#fff')
          _.dottedId = TAGS.dotted.mask
          createMask(_.dottedId, patternId)
        }
        return `url(#${_.dottedId})`
    }
  }

  return api
})()
