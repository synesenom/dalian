import extend from '../../core/extend'
import {axisRight} from 'd3'

// Default values.
const DEFAULTS = {
  format: x => x,
  values: null
}

/**
 * Component implementing the radial axis for charts. When this component is available for a widget, its API is exposed
 * via the {.radialAxis} namespace.
 *
 * @function RadialAxis
 */
export default scale => {
  return (self, api) => {
    // Axis container.
    const container = self._widget.content.insert('g', ':first-child')
      .attr('class', 'dalian-axis-container radial')
      .style('font-family', 'inherit')
      .style('font-size', 'inherit')

    // The axis group.
    const axis = container.append('g')
      .attr('class', 'axis radial')
      .style('font-family', 'inherit')
      .style('font-size', 'inherit')

    let axisFn = axisRight(scale.copy()
      .range([0, -scale.scale.range()[1]]))

    const axisX = (i, n) => scale.scale.range()[1] * Math.sin(i * 2 * Math.PI / n)

    const axisY = (i, n) => -scale.scale.range()[1] * Math.cos(i * 2 * Math.PI / n)

    function textAnchor (i, n) {
      if (i === 0 || i === n / 2) {
        return 'middle'
      }
      if (i < n / 2) {
        return 'start'
      }
      return 'end'
    }

    function dominantBaseline (i, n) {
      if (n % 4 === 0) {
        const n4 = Math.round(n / 4)
        if (i === n4 || i === n - n4) {
          return 'middle'
        }
      }
      if (i > n / 4 && i < 3 * n / 4) {
        return 'hanging'
      }
      return 'auto'
    }

    // Private members.
    const _ = Object.assign({
      labels: []
    }, DEFAULTS)

    // Protected members.
    self = Object.assign(self, {
      _radialAxis: {
        labels (labels) {
          _.labels = labels
          return self
        },

        ticks () {
          return _.values === null ? axisFn.scale().ticks() : _.values
        }
      }
    })

    // Extend update.
    self._widget.update = extend(self._widget.update, duration => {
      // Create axis function.
      axisFn = axisRight(scale.copy()
        .range([0, -scale.scale.range()[1]]))
        .tickFormat(_.format)
        .tickValues(_.values)
        .tickSize(0)

      // Update container.
      self._widget.getElem(container, duration)
        .attr('transform', `translate(${parseFloat(self._widget.size.width) / 2}, ${parseFloat(self._widget.size.height) / 2})`)
        .call(axisFn)

      // Make some changes:
      // - Set font size.
      // - Remove axis line.
      container
        .selectAll('.tick > text')
        .style('font-size', '.8em')
      container
        .select('.domain').remove()

      // Update axis lines.
      // TODO Read this from scales.angle.
      axis.selectAll('line')
        .data(_.labels, d => d)
        .join(
          enter => enter.append('line')
            .attr('stroke', 'black')
            .attr('x1', 0)
            .attr('y1', 0)
            .attr('x2', (d, i) => 1.05 * axisX(i, _.labels.length))
            .attr('y2', (d, i) => 1.05 * axisY(i, _.labels.length))
            .style('stroke-width', '1px')
            .style('shape-rendering', 'crispEdges')
            .style('stroke', 'currentColor'),

          update => update.transition().duration(duration)
            .attr('x2', (d, i) => 1.05 * axisX(i, _.labels.length))
            .attr('y2', (d, i) => 1.05 * axisY(i, _.labels.length)),

          exit => exit.remove()
        )

      // TODO Adjust text position.
      axis.selectAll('.axis-label')
        .data(_.labels, d => d)
        .join(
          enter => enter.append('text')
            .attr('class', 'axis-label radial')
            .attr('x', (d, i) => 1.15 * axisX(i, _.labels.length))
            .attr('y', (d, i) => 1.15 * axisY(i, _.labels.length))
            .attr('fill', 'currentColor')
            .attr('stroke', 'none')
            .attr('text-anchor', (d, i) => textAnchor(i, _.labels.length))
            .attr('dominant-baseline', (d, i) => dominantBaseline(i, _.labels.length))
            .style('font-family', 'inherit')
            .style('font-size', 'inherit')
            .style('font-size', '1em')
            .text(d => d),

          update => update.transition().duration(duration)
            .attr('x', (d, i) => 1.15 * axisX(i, _.labels.length))
            .attr('y', (d, i) => 1.15 * axisY(i, _.labels.length))
            .attr('text-anchor', (d, i) => textAnchor(i, _.labels.length))
            .attr('dominant-baseline', (d, i) => dominantBaseline(i, _.labels.length))
            .text(d => d),

          exit => exit.remove()
        )
    })

    // Public methods.
    api = Object.assign(api || {}, {
      radialAxis: {
        values: (values = DEFAULTS.values) => {
          _.values = values
          return api
        },

        // Tick format.
        format: (format = DEFAULTS.format) => {
          _.format = format
          return api
        },
        // TODO .hideAxisLine
        // TODO .labels
      }
    })

    return { self, api }
  }
}
