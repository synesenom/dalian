export default (id, parent) => {
  // Private members
  let _ = {
    nodes: new Map(),
    links: new Map(),
    transform: {
      k: 1,
      x: 0,
      y: 0
    },
    size: null,
    painter: undefined,
    type: 'canvas',
    active: false,
    defaultStyle: {
      nodes: {
        size: 1,
        fill: 'royalblue',
        stroke: 'white'
      },
      links: {
        lineWidth: 0.1,
        stroke: '#aaa'
      }
    }
  }

  // Public API
  let api = {
    getId: () => id,
    getType: () => _.type,
    isActive: () => _.active,

    canvas: {
      resize () {
        // TODO Resize canvas width/height to fit parent.
      },

      style: style => {
        // TODO Set the overall style for nodes/links.
      },

      hide: onHidden => {
        // TODO Transition opacity to 0, at the end set z-index to -1.
      },

      show: onShown => {
        // TODO Set z-index to 10 and transition opacity to 1.
      },

      zoom: transform => {
        // TODO Update zoom level of canvas.
      },

      pan: (transform, orig) => {
        // TODO Update pan of the canvas.
      },

      disable() {
        // TODO Disable pointer events.
      },

      enable() {
        // TODO Enable pointer events.
      },

      render() {
        // TODO Render network.
      }
    },

    network: {
      reset: graph => {
        // TODO Remove all nodes/links and build new graph.
      },

      update: subGraph => {
        // TODO Update only nodes/links in subGraph.
      },

      style: style => {
        // TODO Update the style of specific nodes/links.
      },

      getNodeIndex: (size, transform) => {
        // TODO Get the index of currently hovered node.
        // TODO Get rid of the size parameter.
      },

      getInternalPos: (pos, size) => {
        // TODO Get position for a specific location.
        // TODO Get rid of the size parameter.
      }
    }
  }

  return api
}
