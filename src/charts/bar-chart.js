import { max, min } from 'd3'
import { measureText } from '../utils/measure-text'
import { backgroundAdjustedColor } from '../utils/color'
import { compose, extend } from '../core'
import {
  BottomAxis, Chart, ElementTooltip, Highlight, Horizontal, Label, LeftAxis, Objects, Scale, YGrid, YRange
} from '../components'

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
 *   <li><a href="../components/y-range.html">YRange</a> The same component (and namespace) is used for the default and
 *   horizontal modes, adapting to the orientation.</li>
 * </ul>
 *
 * @function BarChart
 * @param {string} name Name of the chart. Should be a unique identifier.
 * @param {string} [parent = body] See [Widget]{@link ../components/widget.html} for description.
 */
// TODO Support negative values.
export default (name, parent = 'body') => {
  // Define scales.
  const scales = {
    x: Scale('band'),
    y: Scale()
  }

  // Build widget.
  const { self, api } = compose(
    Chart('bar-chart', name, parent),
    LeftAxis(scales.y),
    BottomAxis(scales.x),
    ElementTooltip,
    Highlight(() => self._chart.plots, ['.plot-group']),
    Horizontal(scales),
    Label,
    Objects(scales),
    YGrid,
    YRange
  )

  // Private methods.
  // TODO Docstring.
  function measureX (d, bandwidth, style) {
    const ts = measureText(self._label.format(d), style)
    const dx = Math.max((bandwidth - ts.height) / 2, 5)
    const x = _.scales.x(Math.max(0, d.value))
    const w = Math.abs(x - _.scales.x(0))
    const inside = w > 2 * dx + ts.width
    return {
      inside,
      x: inside ? x - dx : x + dx + ts.width,
      y: _.scales.y(d.name) + bandwidth / 2,
      color: inside ? backgroundAdjustedColor(self._color.mapper(d)) : style.color
    }
  }

  // TODO Merge this with measureX.
  // TODO Docstring.
  function measureY (d, bandwidth, style) {
    const ts = measureText(self._label.format(d), style)
    const dy = Math.max((bandwidth - ts.width) / 2, 5)
    const y = _.scales.y(Math.max(0, d.value))
    const h = Math.abs(y - _.scales.y(0))
    const inside = h > 2 * dy + ts.height
    return {
      inside,
      x: _.scales.x(d.name) + bandwidth / 2,
      y: inside ? y + dy : y - dy - ts.height,
      color: inside ? backgroundAdjustedColor(self._color.mapper(d)) : style.color
    }
  }

  function addBars (g, horizontal) {
    const bandwidth = horizontal ? _.scales.y.scale.bandwidth() : _.scales.x.scale.bandwidth()
    g.append('rect')
      .attr('class', 'bar')
      .on('mouseover.bar', d => {
        _.current = d
      })
      .on('mouseleave.bar', () => {
        _.current = undefined
      })
      .attr('x', d => _.scales.x(horizontal ? 0 : d.name))
      .attr('y', d => _.scales.y(horizontal ? d.name : 0))
      .attr('width', horizontal ? 0 : bandwidth)
      .attr('height', horizontal ? bandwidth : 0)
      .attr('fill', self._color.mapper)
  }

  function addLabels (g, horizontal, style) {
    const bandwidth = horizontal ? _.scales.y.scale.bandwidth() : _.scales.x.scale.bandwidth()
    const measure = horizontal ? measureX : measureY
    g.append('text')
      .attr('class', 'bar-label')
      .attr('stroke', 'none')
      .style('display', 'none')
      .style('pointer-events', 'none')
      .text(self._label.format)
      .each(d => Object.assign(d, { _measures: measure(d, bandwidth, style) }))
      .attr('fill', d => d._measures.color)
      .attr('x', d => horizontal ? _.scales.x(0) : d._measures.x)
      .attr('y', d => horizontal ? d._measures.y : _.scales.y(0))
  }

  function updateBars (g, horizontal) {
    const bandwidth = horizontal ? _.scales.y.scale.bandwidth() : _.scales.x.scale.bandwidth()
    g.select('.bar')
      .attr('x', d => _.scales.x(horizontal ? Math.min(0, d.value) : d.name))
      .attr('y', d => _.scales.y(horizontal ? d.name : Math.max(d.value, 0)))
      .attr('width', d => horizontal
        ? Math.abs(_.scales.x(d.value) - _.scales.x(0))
        : bandwidth)
      .attr('height', d => horizontal
        ? bandwidth
        : Math.abs(_.scales.y(d.value) - _.scales.y(0)))
      .attr('fill', self._color.mapper)
  }

  function updateLabels (g, horizontal, style) {
    const bandwidth = horizontal ? _.scales.y.scale.bandwidth() : _.scales.x.scale.bandwidth()
    const measure = horizontal ? measureX : measureY
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
  }

  // Private members
  const _ = {
    // Variables
    current: undefined,
    horizontal: false,

    // TODO Get rid of this variable.
    scales: self._horizontal.scales()
  }

  // Overrides
  self._tooltip.content = () => typeof _.current === 'undefined'
    ? undefined
    : {
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
  self._widget.update = extend(self._widget.update, duration => {
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
    _.scales.x.range([0, parseInt(self._widget.size.innerWidth)])
      .domain(horizontal ? self._yRange.range([yMin, yMax]) : xValues)
    _.scales.y.range([parseInt(self._widget.size.innerHeight), 0])
      .domain(horizontal ? xValues : self._yRange.range([yMin, yMax]))

    // Add plots.
    self._chart.plotGroups({
      enter: g => {
        // Add bars.
        addBars(g, horizontal)

        // Add labels.
        addLabels(g, horizontal, style)

        return g
      },
      update: g => {
        // Show group.
        // TODO Replace this with highlight focus and blur styles.
        // g.style('opacity', d => self._highlight.isHighlighted(d.name) ? 1 : 0.1)
        self._highlight.apply(g, 'name')

        updateBars(g, horizontal)

        // Update labels.
        updateLabels(g, horizontal, style)

        return g
      },
      exit: g => g.style('opacity', 0)
    }, duration)
  }, true)

  /**
   * Set/updates the data that is shown in the bar chart. In the bar chart, each bar is a plot group in itself, so all
   * methods that operate on plot groups are applied on the bar level.
   *
   * @method data
   * @memberOf BarChart
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
