import { max } from 'd3'
import compose from '../core/compose'
import encode from '../core/encode'
import extend from '../core/extend'
import Chart from '../components/chart'
import Scale from '../components/scale'
import LeftAxis from '../components/axis/left-axis'
import BottomAxis from '../components/axis/bottom-axis'
import ElementTooltip from '../components/tooltip/element-tooltip'
import Highlight from '../components/highlight'

// TODO Add vertical()
// TODO Add values()
// TODO Add valueFormat()

export default (name, parent) => {
// Build widget from components
  // TODO Fix this separate declaration of scales (needed by the axis components)
  let scales = {
    x: Scale('band'),
    y: Scale('linear')
  }
  let { self, api } = compose(
    Chart('bar-chart', name, parent, 'svg'),
    ElementTooltip,
    Highlight,
    (s, a) => LeftAxis(s, a, 'y', scales.y),
    (s, a) => BottomAxis(s, a, 'x', scales.x)
  )

  // Private members
  let _ = {
    current: undefined,

    // Variables
    scales,

    // Methods
    update: duration => {
      // Collect X values and Y max
      const xValues = self._chart.data.map(d => d.name)
      const yMax = 1.1 * max(self._chart.data.map(d => d.value)) || 1

      // Update scales
      _.scales.x.range(0, parseInt(self._widget.size.innerWidth))
        .domain(xValues)
      _.scales.y.range(parseInt(self._widget.size.innerHeight), 0)
        // Make sure scale starts at 0
        .domain([0, yMax])

      // Add plots
      self._chart.plotGroups({
        enter: g => {
          // Add bars
          g.append('rect')
            .attr('class', d => `bar ${encode(d.name)}`)
            .attr('x', d => _.scales.x.scale(d.name))
            .attr('width', _.scales.x.scale.bandwidth())
            .attr('y', () => _.scales.y.scale(0))
            .attr('height', 0)
            .style('stroke-with', '2px')
            .on('mouseover', d => _.current = d)
            .on('mouseleave', () => _.current = undefined)
          return g
        },
        union: {
          after: g => {
            g.select('.bar')
              .attr('x', d => _.scales.x.scale(d.name))
              .attr('width', _.scales.x.scale.bandwidth())
              .attr('y', d => _.scales.y.scale(d.value))
              .attr('height', d => _.scales.y.scale(yMax - d.value))
            return g
          }
        }
      }, duration)
    }
  }

  // Overrides
  self._highlight.container = self._chart.plots

  self._highlight.selectors = ['.bar']

  self._tooltip.content = () => {
    // If no bar is hovered, hide tooltip
    if (typeof _.current === 'undefined') {
      return
    }

    return {
      title: _.current.name,
      stripe: self._colors.mapping(_.current.name),
      content: {
        type: 'plots',
        data: [{
          name: 'value',
          value: _.current.value
        }]
      }
    }
  }

  // Extend widget update
  // Update plot before widget
  self._widget.update = extend(self._widget.update, _.update, true)

  // Public API
  return api

  // Documentation
  // TODO
}
