import { select } from 'd3'

/*
 * Hidden variables
 */
let defs = undefined


/*
 * Methods
 */
/**
 * Gets or creates the  def tag.
 *
 * @method getDefs
 * @return {object} D3 selection of the defs tag.
 */
function getDefs() {
  if (typeof defs === 'undefined') {
    defs = select('body').append('svg')
      .attr('id', 'dalian-defs')
      .append('defs')
  }
  return defs
}


/*
 * Exports
 */
/**
 * Adds a mask to the defs.
 *
 * @method addMask
 * @param {string} id Mask identifier.
 * @param {object} pos Object representing the mask x and y position.
 * @param {object} size Object representing the mask width and height.
 * @return {object} D3 selection of the mask added.
 */
export function addMask (id, pos, size) {
  return getDefs().append('mask')
    .attr('id', id)
    .attr('x', pos.x)
    .attr('y', pos.y)
    .attr('width', size.width)
    .attr('height', size.height)
}

/**
 * Adds a pattern to the defs.
 *
 * @method addPattern
 * @param {string} id Pattern identifier.
 * @param {object} pos Object representing the pattern x and y position.
 * @param {object} size Object representing the pattern width and height.
 * @return {object} D3 selection of the pattern added.
 */
export function addPattern (id, pos, size) {
  return getDefs().append('pattern')
    .attr('id', id)
    .attr('x', pos.x)
    .attr('y', pos.y)
    .attr('width', size.width)
    .attr('height', size.height)
    .attr('patternUnits', 'userSpaceOnUse')
    .attr('patternTransform', 'rotate(-45)')
}
