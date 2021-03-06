import extend from '../../core/extend'
import attributes from '../../utils/attributes'

// Default values.
const DEFAULTS = {
  format: x => x,
  values: null,
  tickAnchor: null,
  tickColor: 'currentColor'
}

// TODO Docstring.
export default (type, self, axisFn, scale, labelAttr) => {
  // Container: an SVG group that contains all axis related DOM elements.
  const container = self._widget.content.append('g')
    .attr('class', `dalian-axis-container ${type}`)
    .style('font-family', 'inherit')
    .style('font-size', 'inherit')

  // The axis group
  const axis = container.append('g')
    .attr('class', `axis ${type}`)
    .style('font-family', 'inherit')
    .style('font-size', 'inherit')

  // Axis path.
  axis.selectAll('path')
    .style('fill', 'none')
    .style('stroke-width', '1px')
    .style('shape-rendering', 'crispEdges')
    .style('stroke', 'currentColor')

  // Private members.
  const _ = {
    margin: {left: 0, top: 0, right: 0, bottom: 0},
    format: DEFAULTS.format,
    values: DEFAULTS.values,
    scale,
    container,
    tickColor: DEFAULTS.tickColor,
    ticks: true,
    tickAnchor: DEFAULTS.tickAnchor,
    axisLine: true
  }

  // Extend update.
  self._widget.update = extend(self._widget.update, duration => {
    // Update container
    self._widget.getElem(_.container, duration)
      .attr('transform', 'translate(' + (self._widget.margins.left + _.margin.left - _.margin.right) + ',' + (self._widget.margins.top + _.margin.top - _.margin.bottom) + ')')
      .style('width', self._widget.size.innerWidth)
      .style('height', self._widget.size.innerHeight)

    // Update axis
    api.fn.scale(_.scale.scale)
      .tickFormat(_.format)
      .tickSize(_.ticks ? 6 : 0)
      .tickPadding(_.ticks ? 3 : 9)
      .tickValues(_.values || null)
    self._widget.getElem(api.axis, duration)
      .call(api.fn)
      .selectAll('path')
      .style('opacity', _.axisLine ? 1 : 0)

    // Update ticks.
    axis.selectAll('.tick > text')
      .attr('text-anchor', _.tickAnchor)
    axis.selectAll('.tick > line')
      .attr('stroke', _.tickColor)
  })

  // Public members.
  const api = {
    // Axis function.
    fn: axisFn().ticks(5),

    // Axis selection.
    axis,

    // TODO Docstring.
    margin: margin => {
      _.margin = Object.assign(_.margin, margin)
      return api
    },

    label: attributes(container.append('text')
      .attr('class', `axis-label ${type}`)
      .attr('stroke-width', 0)
      .attr('fill', 'currentColor')
      .style('font-size', '1em')
      .text(''), labelAttr),

    // TODO Docstring.
    tickAnchor: (tickAnchor = DEFAULTS.tickAnchor) => {
      _.tickAnchor = tickAnchor
      return api
    },

    // Change scale object.
    // TODO Docstring.
    scale: scale => {
      _.scale = scale
      return api
    },

    // Hide axis line.
    // TODO Docstring.
    hideAxisLine: on => {
      _.axisLine = !on
      return api
    },

    // Hide tick lines.
    // TODO Docstring.
    hideTicks: on => {
      _.ticks = !on
      return api
    },

    // Tick format.
    // TODO Docstring.
    format: (format = DEFAULTS.format) => {
      _.format = format
      return api
    },

    // Set specific tick values.
    // TODO Docstring.
    values: (values = DEFAULTS.values) => {
      _.values = values
      return api
    },

    // TODO Docstring.
    tickColor (color = 'currentColor') {
      _.tickColor = color
      return api
    }
  }

  return api
}
