export default (type, self, axisFn, scale) => {
  // Private members
  // Container: an SVG group that contains all axis related DOM elements
  let container = self._widget.content.append('g')
    .attr('class', `dalian-axis-container ${type}`)
    .style('font-family', 'inherit')
    .style('font-size', 'inherit')
  // The axis group
  let axis = container.append('g')
    .attr('class', `axis ${type}`)
    .style('font-family', 'inherit')
    .style('font-size', 'inherit')
  axis.selectAll('path')
    .style('fill', 'none')
    .style('stroke-width', '1px')
    .style('shape-rendering', 'crispEdges')
    .style('stroke', 'currentColor')
  let _ = {
    format: x => x,
    values: null,
    scale,
    container,
    ticks: true,
    axisLine: true
  }

  let api = {
    // Variables
    label: '',
    fn: axisFn().ticks(5),
    axis,
    axisLabel: container.append('text')
      .attr('class', `axis-label ${type}`)
      .attr('stroke-width', 0)
      .attr('fill', 'currentColor')
      .style('font-size', '1em')
      .text(''),

    // Methods
    scale: scaleObj => {
      _.scale = scaleObj
    },

    adjustLabel: attr => {
      Object.entries(attr).forEach(d => {
        api.axisLabel.attr(...d)
      })
    },

    update: (duration, size, margins) => {
      // Update container
      self._widget.getElem(_.container, duration)
        .attr('transform', 'translate(' + margins.left + ',' + margins.top + ')')
        .style('width', size.innerWidth)
        .style('height', size.innerHeight)

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

      // Update label
      api.axisLabel.text(api.label)
    },

    hideAxisLine: on => _.axisLine = !on,

    hideTicks: on => _.ticks = !on,

    format: (format = x => x) => _.format = format,

    setLabel: text => api.label = text,

    values: values => _.values = values || null
  }

  return api
}
