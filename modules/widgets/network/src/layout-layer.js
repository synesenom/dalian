import { forceSimulation } from 'd3-force'

export default name => {
  let _ = {
    size: {
      width: 1,
      height: 1
    },
    graph: {
      nodes: new Map(),
      links: new Map()
    },
    active: false,
    simulation: forceSimulation()
  }
}
