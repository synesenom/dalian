import { max, min } from 'd3'
import { measureText } from '../utils/measure-text'
import compose from '../core/compose'
import extend from '../core/extend'
import {backgroundAdjustedColor} from '../utils/color'
import BottomAxis from '../components/axis/bottom-axis'
import Chart from '../components/chart'
import ElementTooltip from '../components/tooltip/element-tooltip'
import Highlight from '../components/highlight'
import Horizontal from '../components/horizontal'
import Label from '../components/label'
import LeftAxis from '../components/axis/left-axis'
import Objects from '../components/objects'
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
 *   <li><a href="../components/horizontal.html">Horizontal</a></li>
 *   <li><a href="../components/label.html">Label</a></li> Labels are shown at the top of the bars. If the fit in the
 *   bar they are inside, otherwise they are outside.
 *   <li><a href="../components/left-axis.html">LeftAxis</a></li>
 *   <li><a href="../components/objects.html">Objects</a></li>
 *   <li><a href="../components/y-grid.html">YGrid</a> The same component (and namespace) is used for the default and
 *   horizontal modes, adapting to the orientation.</li>
 * </ul>
 *
 * @function BarChart
 * @param {string} name Name of the chart. Should be a unique identifier.
 * @param {string} [parent = body] See [Widget]{@link ../components/widget.html} for description.
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
    Highlight(() => self._chart.plots, ['.plot-group']),
    Horizontal(scales),
    Label,
    Objects(scales),
    YGrid
  )

  // Private members
  const _ = {
    // Variables
    current: undefined,
    scales: self._horizontal.scales(),

    // UI elements.
    horizontal: false,

    // Methods.
    measureX: (d, bandwidth, style) => {
      const ts = measureText(self._label.format(d), style)
      const dx = Math.max((bandwidth - ts.height) / 2, 5)
      const x = _.scales.x.scale(Math.max(0, d.value))
      const w = Math.abs(x - _.scales.x.scale(0))
      const inside = w > 2 * dx + ts.width
      return {
        inside,
        x: inside ? x - dx : x + dx + ts.width,
        y: _.scales.y.scale(d.name) + bandwidth / 2,
        color: inside ? backgroundAdjustedColor(self._color.mapper(d)) : style.color
      }
    },

    // TODO Merge this with measureX.
    measureY: (d, bandwidth, style) => {
      const ts = measureText(self._label.format(d), style)
      const dy = Math.max((bandwidth - ts.width) / 2, 5)
      const y = _.scales.y.scale(Math.max(0, d.value))
      const h = Math.abs(y - _.scales.y.scale(0))
      const inside = h > 2 * dy + ts.height
      return {
        inside,
        x: _.scales.x.scale(d.name) + bandwidth / 2,
        y: inside ? y + dy : y - dy - ts.height,
        color: inside ? backgroundAdjustedColor(self._color.mapper(d)) : style.color
      }
    },

    // Update method.
    update: duration => {
      // Update scales.
      _.scales = self._horizontal.scales()
      const horizontal = self._horizontal.on()

      // Compute some constants beforehand.
      const style = self._widget.getStyle()

      // Collect X values and Y range.
      const xValues = self._chart.data.map(d => d.name)
      let yMin = Math.min(0, min(self._chart.data.map(d => d.value)))
      let yMax = max(self._chart.data.map(d => d.value)) || 1
      const yRange = yMax - yMin
      yMax += 0.01 * yRange
      if (yMin < 0) {
        yMin -= 0.01 * yRange
      }

      // Update scales.
      _.scales.x.range(0, parseInt(self._widget.size.innerWidth))
        .domain(horizontal ? [yMin, yMax] : xValues)
      _.scales.y.range(parseInt(self._widget.size.innerHeight), 0)
        .domain(horizontal ? xValues : [yMin, yMax])

      // Add plots.
      self._chart.plotGroups({
        enter: g => {
          const bandwidth = horizontal ? _.scales.y.scale.bandwidth() : _.scales.x.scale.bandwidth()

          // Add bars.
          g.append('rect')
            .attr('class', 'bar')
            .on('mouseover.bar', d => {
              _.current = d
            })
            .on('mouseleave.bar', () => {
              _.current = undefined
            })
            .attr('x', d => _.scales.x.scale(horizontal ? 0 : d.name))
            .attr('y', d => _.scales.y.scale(horizontal ? d.name : 0))
            .attr('width', horizontal ? 0 : bandwidth)
            .attr('height', horizontal ? bandwidth : 0)
            .attr('fill', self._color.mapper)

          // Add labels.
          const measure = horizontal ? _.measureX : _.measureY
          g.append('text')
            .attr('class', 'bar-label')
            .attr('stroke', 'none')
            .style('display', 'none')
            .style('pointer-events', 'none')
            .text(self._label.format)
            .each(d => Object.assign(d, { _measures: measure(d, bandwidth, style) }))
            .attr('fill', d => d._measures.color)
            .attr('x', d => horizontal ? _.scales.x.scale(0) : d._measures.x)
            .attr('y', d => horizontal ? d._measures.y : _.scales.y.scale(0))

          return g
        },
        update: g => {
          // Show group.
          g.style('opacity', 1)

          const bandwidth = horizontal ? _.scales.y.scale.bandwidth() : _.scales.x.scale.bandwidth()

          // Update bars.
          g.select('.bar')
            .attr('x', d => _.scales.x.scale(horizontal ? Math.min(0, d.value) : d.name))
            .attr('y', d => _.scales.y.scale(horizontal ? d.name : Math.max(d.value, 0)))
            .attr('width', d => horizontal
              ? Math.abs(_.scales.x.scale(d.value) - _.scales.x.scale(0)) : bandwidth)
            .attr('height', d => horizontal ? bandwidth
              : Math.abs(_.scales.y.scale(d.value) - _.scales.y.scale(0)))
            .attr('fill', self._color.mapper)

          // Update labels.
          const measure = horizontal ? _.measureX : _.measureY
          g.select('.bar-label')
            .each(d => Object.assign(d, { _measures: measure(d, bandwidth, style) }))
            .attr('text-anchor', horizontal ? 'end' : 'middle')
            .attr('dominant-baseline', horizontal ? 'central' : 'hanging')
            .attr('font-size', 'inherit')
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

  /**
   * Set/updates the data that is shown in the bar chart. In the bar chart, each bar is a plot group in itself, so all
   * methods that operate on plot groups are applied on the bar level.
   *
   * @method data
   * @methodOf BarChart
   * @param {Object[]} plots Array of objects representing the bars to show. Each bar has two properties:
   * <dl>
   *   <dt>name</dt>  <dd>{string} Category name.</dd>
   *   <dt>value</dt> <dd>{number} Category value.</dd>
   * </dl>
   * @returns {BarChart} Reference to the BarChart API.
   * @example
   *
   * const bar = dalian.BarChart('my-chart')
   *   .data([
   *     {name: 'bar 1', value: 1},
   *     {name: 'bar 2', value: 3},
   *     {name: 'bar 3', value: 2},
   *     ...
   *   ])
   *   .render()
   */
  return api
}
