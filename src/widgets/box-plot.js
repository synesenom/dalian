import { max, min } from 'd3'
import extend from '../core/extend'
import compose from '../core/compose'
import Chart from '../components/chart'
import BottomAxis from '../components/axis/bottom-axis'
import ElementTooltip from '../components/tooltip/element-tooltip'
import Highlight from '../components/highlight'
import Horizontal from '../components/horizontal'
import LeftAxis from '../components/axis/left-axis'
import LineWidth from '../components/line-width'
import Opacity from '../components/opacity'
import Scale from '../components/scale'

// TODO Add LineColor component.
/**
 * The box plot widget. As a chart, it extends the [Chart]{@link ../components/chart.html} component, with all of its
 * available APIs. Furthermore, it extends the following components:
 * <ul>
 *   <li><a href="../components/bottom-axis.html">BottomAxis</a></li>
 *   <li><a href="../components/element-tooltip.html">ElementTooltip</a> The default entries shown in the tooltip are:
 *   median, q1, q3, lower whisker (as low), upper whisker (as high), number of mild outliers, number of extreme
 *   outliers.</li>
 *   <li>
 *     <a href="../components/highlight.html">Highlight</a> Boxes can be highlighted by passing their names as specified
 *     in the data array.
 *   </li>
 *   <li><a href="../components/horizontal.html">Horizontal</a></li>
 *   <li><a href="../components/left-axis.html">LeftAxis</a></li>
 *   <li><a href="../components/line-width.html">LineWidth</a></li>
 *   <li><a href="../components/opacity.html">Opacity</a></li>
 * </ul>
 *
 * @function BoxPlot
 * @param {string} name Name of the chart. Should be a unique identifier.
 * @param {string} [parent = body] Query selector of the parent element to append widget to.
 */
export default (name, parent = 'body') => {
  // Build widget from components
  const scales = {
    x: Scale('point'),
    y: Scale('linear')
  }
  let { self, api } = compose(
    Chart('box-plot', name, parent),
    BottomAxis(scales.x),
    ElementTooltip,
    Highlight(['.plot-group']),
    Horizontal(scales),
    LeftAxis(scales.y),
    LineWidth(1),
    Opacity(0.2)
  )

  // Private members.
  const _ = {
    // Variables.
    current: undefined,
    scales: self._horizontal.scales(),

    // UI elements.
    boxWidth: 20,
    horizontal: false,

    // Methods.
    // TODO Merge these to a whisker method.
    whiskerPath (side) {
      const quartile = side === 'lower' ? 'q1' : 'q3'
      return d => `M${_.scales.x.scale(_.horizontal ? d.value[quartile] : d.name)} ${_.scales.y.scale(_.horizontal ? d.name : d.value[quartile])}
      L${_.scales.x.scale(_.horizontal ? d.value.whiskers[side] : d.name)} ${_.scales.y.scale(_.horizontal ? d.name : d.value.whiskers[side])}
      m${_.horizontal ? 0 : -0.4 * _.boxWidth} ${_.horizontal ? -0.4 * _.boxWidth : 0}
      l${_.horizontal ? 0 : 0.8 * _.boxWidth} ${_.horizontal ? 0.8 * _.boxWidth : 0}`
    },

    outlierX: d => _.scales.x.scale(_.horizontal ? d : d.name),

    outlierY: d => _.scales.y.scale(_.horizontal ? d.name : d),

    update (duration) {
      // Collect X values and Y max.
      const xValues = self._chart.data.map(d => d.name)
      let yMin = min(self._chart.data,
          d => min(d.value.outliers.extreme.concat(d.value.outliers.mild).concat([d.value.whiskers.lower])))
      let yMax = max(self._chart.data,
          d => max(d.value.outliers.extreme.concat(d.value.outliers.mild).concat([d.value.whiskers.upper])))
      const yRange = yMax - yMin
      yMin -= 0.05 * yRange
      yMax += 0.05 * yRange

      // Update scales.
      _.horizontal = self._horizontal.on()
      _.scales = self._horizontal.scales()
      _.scales.x.range(0, parseInt(self._widget.size.innerWidth))
        .domain(_.horizontal ? [yMin, yMax] : xValues)
      _.scales.y.range(parseInt(self._widget.size.innerHeight), 0)
        .domain(_.horizontal ? xValues : [yMin, yMax])

      // Add plots
      const xShift = _.horizontal ? 0 : _.boxWidth / 2
      const yShift = _.horizontal ? _.boxWidth / 2 : 0
      self._chart.plotGroups({
        enter: g => {
          g.style('opacity', 0)
            .on('mouseover.box', d => {
              _.current = d
            })
            .on('mouseleave.box', () => {
              _.current = undefined
            })
            .style('color', self._color.mapper)

          // Add box elements.
          g.append('rect')
            .attr('class', 'box-body')
            .attr('rx', '2px')
            .attr('ry', '2px')
            .attr('stroke', 'currentColor')
            .attr('stroke-width', d => self._lineWidth.mapping(d.name))
            .attr('fill', 'currentColor')
            .attr('fill-opacity', self._opacity.value())
            .attr('x', d => _.scales.x.scale(_.horizontal ? d.value.q1 : d.name) - xShift)
            .attr('y', d => _.scales.y.scale(_.horizontal ? d.name : d.value.q3) - yShift)
            .attr('width', d => _.horizontal ? _.scales.x.scale(d.value.q3) - _.scales.x.scale(d.value.q1) : _.boxWidth)
            .attr('height', d => _.horizontal ? _.boxWidth : _.scales.y.scale(d.value.q1) - _.scales.y.scale(d.value.q3))
          g.append('line')
            .attr('class', 'box-median')
            .attr('x1', d => _.scales.x.scale(_.horizontal ? d.value.median : d.name) - xShift)
            .attr('y1', d => _.scales.y.scale(_.horizontal ? d.name : d.value.median) - yShift)
            .attr('x2', d => _.scales.x.scale(_.horizontal ? d.value.median : d.name) + xShift)
            .attr('y2', d => _.scales.y.scale(_.horizontal ? d.name : d.value.median) + yShift)
            .attr('stroke', 'currentColor')
            .attr('stroke-width', '2px')
          g.append('path')
            .attr('class', 'box-whisker-lower')
            .attr('d', _.whiskerPath('lower'))
            .attr('stroke', 'currentColor')
            .attr('stroke-width', d => self._lineWidth.mapping(d.name))
            .attr('fill', 'none')
          g.append('path')
            .attr('class', 'box-whisker-upper')
            .attr('d', _.whiskerPath('upper'))
            .attr('stroke', 'currentColor')
            .attr('stroke-width', d => self._lineWidth.mapping(d.name))
            .attr('fill', 'none')

          // Mild outliers.
          g.selectAll('.box-mild-outlier')
            .data(d => d.value.outliers.mild.map(dd => Object.assign(dd, { name: d.name })))
            .enter().append('circle')
            .attr('class', 'box-mild-outlier')
            .attr('cx', _.outlierX)
            .attr('cy', _.outlierY)
            .attr('r', 3)
            .attr('stroke', 'none')
            .attr('fill', 'currentColor')

          // Extreme outliers.
          g.selectAll('.box-extreme-outlier')
            .data(d => d.value.outliers.extreme.map(dd => Object.assign(dd, { name: d.name })))
            .enter().append('circle')
            .attr('class', 'box-extreme-outlier')
            .attr('cx', _.outlierX)
            .attr('cy', _.outlierY)
            .attr('r', 3)
            .attr('stroke', 'none')
            .attr('fill', 'currentColor')
            .style('opacity', 0.3)

          return g
        },
        updateBefore: g => {
          // Mild outliers.
          g.selectAll('.box-mild-outlier')
            .data(d => d.value.outliers.mild.map(dd => Object.assign(dd, { name: d.name })))
            .join(
              enter => enter.append('circle')
                .attr('class', 'box-mild-outlier')
                .attr('cx', _.outlierX)
                .attr('cy', _.outlierY)
                .attr('r', 3)
                .attr('stroke', 'currentColor')
                .attr('fill', 'currentColor')
                .style('opacity', 0),
              update => update,
              exit => exit.transition().duration(duration)
                .style('opacity', 0)
                .remove()
            )
            .transition().duration(duration)
            .attr('cx', _.outlierX)
            .attr('cy', _.outlierY)
            .style('opacity', 1)

          // Extreme outliers.
          g.selectAll('.box-extreme-outlier')
            .data(d => d.value.outliers.extreme.map(dd => Object.assign(dd, { name: d.name })))
            .join(
              enter => enter.append('circle')
                .attr('class', 'box-extreme-outlier')
                .attr('cx', _.outlierX)
                .attr('cy', _.outlierY)
                .attr('r', 3)
                .attr('stroke', 'currentColor')
                .attr('fill', 'currentColor')
                .style('opacity', 0),
              update => update,
              exit => exit.transition().duration(duration)
                .style('opacity', 0)
                .remove()
            )
            .transition().duration(duration)
            .attr('cx', _.outlierX)
            .attr('cy', _.outlierY)
            .style('opacity', self._opacity.value())

          return g
        },
        update: g => {
          g.style('opacity', 1)
            .style('color', self._color.mapper)

          g.select('.box-body')
            .attr('x', d => _.scales.x.scale(_.horizontal ? d.value.q1 : d.name) - xShift)
            .attr('y', d => _.scales.y.scale(_.horizontal ? d.name : d.value.q3) - yShift)
            .attr('width', d => _.horizontal ? _.scales.x.scale(d.value.q3) - _.scales.x.scale(d.value.q1) : _.boxWidth)
            .attr('height', d => _.horizontal ? _.boxWidth : _.scales.y.scale(d.value.q1) - _.scales.y.scale(d.value.q3))
            .attr('stroke-width', d => self._lineWidth.mapping(d.name))
            .attr('fill-opacity', self._opacity.value())
          g.select('.box-median')
            .attr('x1', d => _.scales.x.scale(_.horizontal ? d.value.median : d.name) - xShift)
            .attr('y1', d => _.scales.y.scale(_.horizontal ? d.name : d.value.median) - yShift)
            .attr('x2', d => _.scales.x.scale(_.horizontal ? d.value.median : d.name) + xShift)
            .attr('y2', d => _.scales.y.scale(_.horizontal ? d.name : d.value.median) + yShift)
          g.select('.box-whisker-lower')
            .attr('d', _.whiskerPath('lower'))
            .attr('stroke-width', d => self._lineWidth.mapping(d.name))
          g.select('.box-whisker-upper')
            .attr('d', _.whiskerPath('upper'))
            .attr('stroke-width', d => self._lineWidth.mapping(d.name))

          return g
        },
        exit: g => g.style('opacity', 0)
      }, duration)
    }
  }

  // Overrides.
  self._highlight.container = self._chart.plots

  self._tooltip.content = () => typeof _.current === 'undefined' ? undefined : {
    title: _.current.name,
    stripe: self._color.mapper(_.current),
    content: {
      data: [
        {name: 'median', value: _.current.value.median},
        {name: 'q1', value: _.current.value.q1},
        {name: 'q3', value: _.current.value.q3},
        {name: 'low', value: _.current.value.whiskers.lower},
        {name: 'high', value: _.current.value.whiskers.upper},
        {name: 'mild outliers', value: _.current.value.outliers.mild.length},
        {name: 'extreme outliers', value: _.current.value.outliers.extreme.length}
      ]
    }
  }

  // Extend widget update
  self._widget.update = extend(self._widget.update, _.update, true)

  // Public API.
  api = Object.assign(api || {}, {
    /**
     * Sets the box width in pixels.
     *
     * @method boxWidth
     * @methodOf BoxPlot
     * @param {number} [width = 20] Width of the box in pixels.
     * @returns {Object} Reference to the BoxPlot's API.
     */
    boxWidth (width = 20) {
      _.boxWidth = width
      return api
    }
  })

  return api

  /**
   * Set/updates the data that is shown in the box plot. Each box is a plot group in itself, so all methods that operate
   * on plot groups are applied on the box level.
   *
   * @method data
   * @methodOf BoxPlot
   * @param {Object[]} plots Array of objects representing the boxes to show. Each box has two properties:
   * <ul>
   *   <li>{string} <i>name</i>: Category name.</li>
   *   <li>{Object} <i>value</i>: Category value.</li>
   * </ul>
   * The <i>values</i> property is an object with the following structure:
   * <dl>
   *   <dt><i>median</i> {number}</dt> <dd>The sample median.</dd>
   *   <dt><i>q1</i> {number}</dt> <dd>Lower quantile of the sample.</dd>
   *   <dt><i>q3</i> {number}</dt> <dd>Upper quantile of the sample.</dd>
   *   <dt><i>whiskers</i> {Object}</dt> <dd>Object containing two numbers: the <i>lower</i> and <i>upper</i> whiskers. Meaning of these can vary.</dd>
   *   <dt><i>outliers</i> {Object}</dt> <dd>Object containing two arrays of numbers: the list of <i>mild</i> and <i>extreme</i> outliers
   *   </dd>
   * </dl>
   * @returns {BoxPlot} Reference to the BoxPlot API.
   */
}
