import { select } from 'd3'

const DEFAULT_STYLE = {
  nodes: {
    size: 1,
    fill: 'royalblue',
    stroke: 'white'
  },
  links: {
    lineWidth: 0.1,
    stroke: 'rgba(100, 100, 100, 0.1)'
  }
}

export default (name, parent) => {
  // Private members
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
    canvas: undefined,
    zIndex: -1,

    intersection: (map, array) => {
      return Array.isArray(array) ? array.filter(d => map.has(d.index)) : []
    }
  }

  let self = {
    init: () => throw Error('Layer.init() is not implemented')
  }

  // Public API
  let api = {
    bind: parent => {
      _.size = {
        width: parseFloat(select(parent).style('width')),
        height: parseFloat(select(parent).style('height'))
      }
      parent.append('canvas')
    },

    graph: graph => {
      // If graph is not specified, return current graph
      if (typeof graph === 'undefined') {
        return _.graph
      } else {
        // Copy node IDs and positions
        if (typeof graph.nodes !== 'undefined') {
          _.graph.nodes = new Map(
            graph.nodes.map(d => [d.index, {
              // Node ID
              index: d.index,

              // Copy reference to position
              pos: d.pos,

              // Deep copy style
              style: {
                size: DEFAULT_STYLE.nodes.size,
                fill: DEFAULT_STYLE.nodes.fill,
                stroke: DEFAULT_STYLE.nodes.stroke
              }
            }])
          )
        }

        // Copy link IDs and end nodes
        if (typeof graph.links !== 'undefined') {
          _.graph.links = new Map(
            // Only between nodes that we have
            graph.links.filter(d => _.graph.nodes.has(d.source.index) && _.graph.nodes.has(d.target.index))
              .map(d => [d.index, {
                // Link ID
                index: d.index,

                // Copy reference to source and target
                source: d.source,
                target: d.target,

                // Deep copy style
                style: {
                  lineWidth: DEFAULT_STYLE.links.lineWidth,
                  stroke: DEFAULT_STYLE.links.stroke
                }
              }])
          )
        }

        return api
      }
    },

    clear: () => {
      // Clear node and link maps
      delete _.graph.nodes
      delete _.graph.links
      return api
    },

    style: style => {
      // If style is not specified, return current style
      if (typeof style === 'undefined') {
        return api
      }

      // Update style for the overlapping nodes (both in style and current nodes)
      _.intersection(_.nodes, style.nodes).forEach(d => {
        _.nodes.get(d.index).style = {
          // Deep copy style
          size: d.style.size,
          fill: d.style.fill,
          stroke: d.style.stroke
        }
      })

      // Update style for the overlapping links
      _.intersection(_.links, style.links).forEach(d => {
        _.links.get(d.index).style = {
          // Deep copy style
          lineWidth: d.style.lineWidth,
          stroke: d.style.stroke
        }
      })
    },

    opacity: (value, duration = 700) => {
      if (typeof _.canvas !== 'undefined') {
        _.canvas.transition().duration(duration)
          .style('opacity', 0)
      }
      return api
    },

    zIndex: (value) => {
      if (typeof value === 'undefined') {
        return _.zIndex
      } else {
        if (typeof _.canvas !== 'undefined') {
          _.canvas.style('z-index', value)
        }
        return api
      }
    },

    active: on => {
      if (typeof on === 'undefined') {
        return _.active
      } else {
        _.active = on
      }
    },

    zoom: () => throw Error('Layer.zoom() is not implemented'),

    pan: () => throw Error('Layer.pan() is not implemented'),

    getNodeIndex: () => throw Error('Layer.getNodeIndex(position) is not implemented')
  }

  return api
}
