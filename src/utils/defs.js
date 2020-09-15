import { select } from 'd3'


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
