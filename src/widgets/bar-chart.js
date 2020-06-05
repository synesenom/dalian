import { max } from 'd3'
import { measureText } from '../utils/measure-text'
import compose from '../core/compose'
import extend from '../core/extend'
import brightnessAdjustedColor from '../utils/brightness-adjusted-color'
import BottomAxis from '../components/axis/bottom-axis'
import Chart from '../components/chart'
import ElementTooltip from '../components/tooltip/element-tooltip'
import Highlight from '../components/highlight'
import Label from '../components/label'
import LeftAxis from '../components/axis/left-axis'
import Scale from '../components/scale'
import YGrid from '../components/grid/y-grid'

/**
 * The bar chart widget. Being a chart, it extends the [Chart]{@link ../components/chart.html} component, with all of
 * its available APIs. Furthermore, it extends the following components:
 * <ul>
 *   <li><a href="../components/bottom-axis.html">BottomAxis</a></li>
 *   <li><a href="../components/element-tooltip.html">ElementTooltip</a></li>
 *   <li>
 *     <a href="../components/highlight.html">Highlight</a> Bars can be highlighted by passing their category names as
 *     specified in the data array.
 *   </li>
 *   <li><a href="../components/label.html">Label</a></li> Labels are shown at the top of the bars. If the fit in the
 *   bar they are inside, otherwise they are outside.
 *   <li><a href="../components/left-axis.html">LeftAxis</a></li>
 *   <li><a href="../components/y-grid.html">YGrid</a> The same component (and namespace) is used for the default and
 *   horizontal modes, adapting to the orientation.</li>
 * </ul>
 *
 * @function BarChart
 * @param {string} name Name of the chart. Should be a unique identifier.
 * @param {string} [parent = body] Query selector of the parent element to append widget to.
 */
// TODO Support negative values.
export default (name, parent = 'body') => {
  // Build widget from components
  const scales = {
    x: Scale('band'),
    y: Scale('linear')
  }
  let { self, api } = compose(
    Chart('bar-chart', name, parent),
    LeftAxis(scales.y),
    BottomAxis(scales.x),
    ElementTooltip,
    Highlight(['.plot-group']),
    Label,
    YGrid
  )

  // Private members
  const _ = {
    // Variables
    current: undefined,
    scales: {
      x: scales.x,
      y: scales.y
    },

    // UI elements.
    horizontal: false,

    // Methods.
    measureX: (d, bandwidth, style) => {
      const ts = measureText(self._label.format(d), style)
      const dx = Math.max((bandwidth - ts.height) / 2, 5)
      const x = _.scales.x.scale(d.value)
      const inside = x > 2 * dx + ts.width
      return {
        inside,
        x: inside ? x - dx : x + dx + ts.width,
        y: _.scales.y.scale(d.name) + bandwidth / 2,
        color: inside ? brightnessAdjustedColor(self._color.mapper(d)) : style.color
      }
    },

    measureY: (d, bandwidth, style) => {
      const ts = measureText(self._label.format(d), style)
      const dy = Math.max((bandwidth - ts.width) / 2, 5)
      const y = _.scales.y.scale(d.value)
      const h = parseFloat(self._widget.size.innerHeight) - y
      const inside = h > 2 * dy + ts.height
      return {
        inside,
        x: _.scales.x.scale(d.name) + bandwidth / 2,
        y: inside ? y + dy : y - dy - ts.height,
        color: inside ? brightnessAdjustedColor(self._color.mapper(d)) : style.color
      }
    },

    // Update method.
    update: duration => {
      // Compute some constants beforehand.
      const style = self._widget.getStyle()

      // Collect X values and Y max.
      const xValues = self._chart.data.map(d => d.name)
      const yMax = 1.01 * max(self._chart.data.map(d => d.value)) || 1

      // Update scales.
      _.scales.x.range(0, parseInt(self._widget.size.innerWidth))
        .domain(_.horizontal ? [0, yMax] : xValues)
      _.scales.y.range(parseInt(self._widget.size.innerHeight), 0)
        .domain(_.horizontal ? xValues : [0, yMax])

      // Add plots.
      self._chart.plotGroups({
        enter: g => {
          const bandwidth = _.horizontal ? _.scales.y.scale.bandwidth() : _.scales.x.scale.bandwidth()

          // Add bars.
          g.append('rect')
            .attr('class', 'bar')
            .on('mouseover.bar', d => {
              _.current = d
            })
            .on('mouseleave.bar', () => {
              _.current = undefined
            })
            .attr('x', d => _.scales.x.scale(_.horizontal ? 0 : d.name))
            .attr('y', d => _.scales.y.scale(_.horizontal ? d.name : 0))
            .attr('width', _.horizontal ? 0 : bandwidth)
            .attr('height', _.horizontal ? bandwidth : 0)
            .attr('fill', self._color.mapper)

          // Add labels.
          const measure = _.horizontal ? _.measureX : _.measureY
          g.append('text')
            .style('display', 'none')
            .attr('class', 'bar-label')
            .attr('stroke', 'none')
            .style('pointer-events', 'none')
            .text(self._label.format)
            .each(d => Object.assign(d, { _measures: measure(d, bandwidth, style) }))
            .attr('fill', d => d._measures.color)
            .attr('x', d => _.horizontal ? _.scales.x.scale(0) : d._measures.x)
            .attr('y', d => _.horizontal ? d._measures.y : _.scales.y.scale(0))

          return g
        },
        update: g => {
          // Show group.
          g.style('opacity', 1)

          const bandwidth = _.horizontal ? _.scales.y.scale.bandwidth() : _.scales.x.scale.bandwidth()

          // Update bars.
          g.select('.bar')
            .attr('x', d => _.scales.x.scale(_.horizontal ? 0 : d.name))
            .attr('y', d => _.scales.y.scale(_.horizontal ? d.name : d.value))
            .attr('width', d => _.horizontal ? _.scales.x.scale(d.value) : bandwidth)
            .attr('height', d => _.horizontal ? bandwidth
              : (parseInt(self._widget.size.innerHeight) - _.scales.y.scale(d.value)))
            .attr('fill', self._color.mapper)

          // Update labels.
          const measure = _.horizontal ? _.measureX : _.measureY
          g.select('.bar-label')
            .each(d => Object.assign(d, { _measures: measure(d, bandwidth, style) }))
            .attr('text-anchor', _.horizontal ? 'end' : 'middle')
            .attr('dominant-baseline', _.horizontal ? 'central' : 'hanging')
            .attr('font-size', self._font.size)
            .attr('fill', self._font.color)
            .attr('fill', d => d._measures.color)
            .attr('x', d => d._measures.x)
            .attr('y', d => d._measures.y)
            .text(self._label.format)
            .style('display', self._label.show ? null : 'none')

          return g
        },
        exit: g => g.style('opacity', 0)
      }, duration)
    }
  }

  // Overrides
  self._highlight.container = self._chart.plots

  self._tooltip.content = () => typeof _.current === 'undefined' ? undefined : {
    title: _.current.name,
    stripe: self._color.mapper(_.current),
    content: {
      data: [{
        name: 'value',
        value: _.current.value
      }]
    }
  }

  // Extend widget update
  self._widget.update = extend(self._widget.update, _.update, true)

  // Public API
  api = Object.assign(api || {}, {
    /**
     * Converts the bar chart to a horizontal bar chart. Note that this method does not swap the axis labels.
     *
     * @method horizontal
     * @methodOf BarChart
     * @param {boolean} on Whether the bar chart should be horizontal.
     * @returns {BarChart} The BarChart itself.
     */
    horizontal (on) {
      _.horizontal = on

      // Assign scales
      _.scales.x = on ? scales.y : scales.x
      _.scales.y = on ? scales.x : scales.y

      // Update axes
      self._bottomAxis.scale(_.scales.x)
      self._leftAxis.scale(_.scales.y)

      // Change grid type.
      self._yGrid.type(on ? 'x' : 'y')

      return api
    }
  })

  return api

  // Documentation
  /**
   * Set/updates the data that is shown in the bar chart. In the bar chart, each bar is a plot group in itself, so all
   * methods that operate on plot groups are applied on the bar level.
   *
   * @method data
   * @methodOf BarChart
   * @param {Object[]} plots Array of objects representing the bars to show. Each bar has two properties:
   * <ul>
   *   <li>{string} <i>name</i>: Category name.</li>
   *   <li>{number} <i>value</i>: Category value.</li>
   * </ul>
   * @returns {BarChart} Reference to the BarChart API.
   */
}
