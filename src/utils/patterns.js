import defs from '../utils/defs'


export default (() => {
  const _ = {}

  function createPattern (id) {
    return defs().append('pattern')
      .attr('id', id)
      .attr('patternUnits', 'userSpaceOnUse')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', 4)
      .attr('height', 4)
      .attr('patternTransform', 'rotate(-45)')
  }

  function createMask (patternId, maskId) {
    return defs().append('mask')
      .attr('id', maskId)
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', 4)
      .attr('height', 4)
      .append('rect')
      .attr('x', '-50%')
      .attr('y', '-50%')
      .attr('width', '100%')
      .attr('height', '100%')
      .attr('fill', `url(#${patternId})`)
  }

  return name => {
    switch (name) {
      case 'solid':
      default:
        return null
      case 'dashed':
        if (typeof _.dashedId === 'undefined') {
          const patternId = 'dalian-pattern-dashed'
          _.dashedId = 'dalian-mask-dashed'
          createPattern(patternId)
            .append('path')
            .attr('d', 'm 0 0 h 4')
            .attr('stroke', '#fff')
            .attr('stroke-width', 4)
          createMask(patternId, _.dashedId)
        }
        return `url(#${_.dashedId})`
      case 'dotted':
        if (typeof _.dottedId === 'undefined') {
          const patternId = 'dalian-pattern-dotted'
          _.dottedId = 'dalian-mask-dotted'
          createPattern(patternId)
            .append('circle')
            .attr('cx', 2)
            .attr('cy', 2)
            .attr('r', 1.5)
            .attr('fill', '#fff')
          createMask(patternId, _.dottedId)
        }
        return `url(#${_.dottedId})`
    }
  }
})()
