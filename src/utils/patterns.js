import { addPattern, addMask } from './defs'


/*
 * Hidden variables
 */
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
let dashedId = undefined
let dottedId = undefined


/*
 * Methods
 */
/**
 * Creates a new pattern.
 *
 * @method createPattern
 * @param {string} id Pattern identifier.
 * @return {object} D3 selection of the new pattern.
 */
function createPattern (id) {
  return addPattern(id, { x: 0, y: 0 }, { width: 4, height: 4 })
}

/**
 * Creates a new mask.
 *
 * @method createMask
 * @param {string} maskId Identifier of the mask.
 * @param {string} patternId Identifier of the pattern to use.
 * @return {object} D3 selection of the new mask.
 */
function createMask (maskId, patternId) {
  return addMask(maskId, { x: 0, y: 0 }, { width: 4, height: 4 })
    .append('rect')
    .attr('x', '-50%')
    .attr('y', '-50%')
    .attr('width', '100%')
    .attr('height', '100%')
    .attr('fill', `url(#${patternId})`)
}


/*
 * Exports
 */
/**
 * Retrieves a pattern.
 *
 * @method getPattern
 * @param {string} name Name of the pattern to get.
 * @return {string|null} String representing the pattern URL if it exists or it is not a solid pattern, null otherwise.
 */
export default function (name) {
  switch (name) {
    case 'solid':
    default:
      return null

    case 'dashed':
      if (typeof dashedId === 'undefined') {
        const patternId = TAGS.dashed.pattern
        createPattern(patternId)
          .append('path')
          .attr('d', 'm 0 0 h 4')
          .attr('stroke', '#fff')
          .attr('stroke-width', 4)
        dashedId = TAGS.dashed.mask
        createMask(dashedId, patternId)
      }
      return `url(#${dashedId})`

    case 'dotted':
      if (typeof dottedId === 'undefined') {
        const patternId = TAGS.dotted.pattern
        createPattern(patternId)
          .append('circle')
          .attr('cx', 2)
          .attr('cy', 2)
          .attr('r', 1.5)
          .attr('fill', '#fff')
        dottedId = TAGS.dotted.mask
        createMask(dottedId, patternId)
      }
      return `url(#${dottedId})`
  }
}
