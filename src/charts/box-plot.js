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
import Objects from '../components/objects'
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
 *   <li><a href="../components/objects.html">Objects</a></li>
 *   <li><a href="../components/opacity.html">Opacity</a></li>
 * </ul>
 *
 * @function BoxPlot
 * @param {string} name Name of the chart. Should be a unique identifier.
 * @param {string} [parent = body] See [Widget]{@link ../components/widget.html} for description.
 */
export default (name, parent = 'body') => {
  // Define scales.
  const scales = {
    x: Scale('point'),
    y: Scale()
  }

  // Build widget.
  let { self, api } = compose(
    Chart('box-plot', name, parent),
    BottomAxis(scales.x),
    ElementTooltip,
    Highlight(() => self._chart.plots, ['.plot-group']),
    Horizontal(scales),
    LeftAxis(scales.y),
    LineWidth(1),
    Objects(scales),
    Opacity(0.2)
  )

  // Private methods.
  // TODO Docstring.
  function whiskerPath (side) {
    const quartile = side === 'lower' ? 'q1' : 'q3'
    return d => `M${_.scales.x(_.horizontal ? d.value[quartile] : d.name)} ${_.scales.y(_.horizontal ? d.name : d.value[quartile])}
      L${_.scales.x(_.horizontal ? d.value.whiskers[side] : d.name)} ${_.scales.y(_.horizontal ? d.name : d.value.whiskers[side])}
      m${_.horizontal ? 0 : -0.4 * _.boxWidth} ${_.horizontal ? -0.4 * _.boxWidth : 0}
      l${_.horizontal ? 0 : 0.8 * _.boxWidth} ${_.horizontal ? 0.8 * _.boxWidth : 0}`
  }

  // TODO Docstring.
  const outlierX = d => _.scales.x(_.horizontal ? d : d.name)

  // TODO Docstring.
  const outlierY = d => _.scales.y(_.horizontal ? d.name : d)

  // Private members.
  const _ = {
    // Variables.
    current: undefined,
    boxWidth: 20,
    horizontal: false,

    // TODO Get rid of this variable.
    scales: self._horizontal.scales()
  }

  // Overrides.
  self._tooltip.content = () => typeof _.current === 'undefined' ? undefined : {
    title: _.current.name,
    stripe: self._color.mapper(_.current),
    content: {
      data: [
        { name: 'median', value: _.current.value.median },
        { name: 'q1', value: _.current.value.q1 },
        { name: 'q3', value: _.current.value.q3 },
        { name: 'low', value: _.current.value.whiskers.lower },
        { name: 'high', value: _.current.value.whiskers.upper },
        { name: 'mild outliers', value: _.current.value.outliers.mild.length },
        { name: 'extreme outliers', value: _.current.value.outliers.extreme.length }
      ]
    }
  }

  // Extend widget update
  self._widget.update = extend(self._widget.update, duration => {
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
    _.scales.x.range([0, parseInt(self._widget.size.innerWidth)])
      .domain(_.horizontal ? [yMin, yMax] : xValues)
    _.scales.y.range([parseInt(self._widget.size.innerHeight), 0])
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
          .attr('x', d => _.scales.x(_.horizontal ? d.value.q1 : d.name) - xShift)
          .attr('y', d => _.scales.y(_.horizontal ? d.name : d.value.q3) - yShift)
          .attr('width', d => _.horizontal ? _.scales.x(d.value.q3) - _.scales.x(d.value.q1) : _.boxWidth)
          .attr('height', d => _.horizontal ? _.boxWidth : _.scales.y(d.value.q1) - _.scales.y(d.value.q3))
        g.append('line')
          .attr('class', 'box-median')
          .attr('x1', d => _.scales.x(_.horizontal ? d.value.median : d.name) - xShift)
          .attr('y1', d => _.scales.y(_.horizontal ? d.name : d.value.median) - yShift)
          .attr('x2', d => _.scales.x(_.horizontal ? d.value.median : d.name) + xShift)
          .attr('y2', d => _.scales.y(_.horizontal ? d.name : d.value.median) + yShift)
          .attr('stroke', 'currentColor')
          .attr('stroke-width', '2px')
        g.append('path')
          .attr('class', 'box-whisker-lower')
          .attr('d', whiskerPath('lower'))
          .attr('stroke', 'currentColor')
          .attr('stroke-width', d => self._lineWidth.mapping(d.name))
          .attr('fill', 'none')
        g.append('path')
          .attr('class', 'box-whisker-upper')
          .attr('d', whiskerPath('upper'))
          .attr('stroke', 'currentColor')
          .attr('stroke-width', d => self._lineWidth.mapping(d.name))
          .attr('fill', 'none')

        // Mild outliers.
        g.selectAll('.box-mild-outlier')
          .data(d => d.value.outliers.mild.map(dd => Object.assign(dd, { name: d.name })))
          .enter().append('circle')
          .attr('class', 'box-mild-outlier')
          .attr('cx', outlierX)
          .attr('cy', outlierY)
          .attr('r', 3)
          .attr('stroke', 'none')
          .attr('fill', 'currentColor')

        // Extreme outliers.
        g.selectAll('.box-extreme-outlier')
          .data(d => d.value.outliers.extreme.map(dd => Object.assign(dd, { name: d.name })))
          .enter().append('circle')
          .attr('class', 'box-extreme-outlier')
          .attr('cx', outlierX)
          .attr('cy', outlierY)
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
              .attr('cx', outlierX)
              .attr('cy', outlierY)
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
          .attr('cx', outlierX)
          .attr('cy', outlierY)
          .style('opacity', 1)

        // Extreme outliers.
        g.selectAll('.box-extreme-outlier')
          .data(d => d.value.outliers.extreme.map(dd => Object.assign(dd, { name: d.name })))
          .join(
            enter => enter.append('circle')
              .attr('class', 'box-extreme-outlier')
              .attr('cx', outlierX)
              .attr('cy', outlierY)
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
          .attr('cx', outlierX)
          .attr('cy', outlierY)
          .style('opacity', self._opacity.value())

        return g
      },
      update: g => {
        g.style('opacity', 1)
          .style('color', self._color.mapper)

        g.select('.box-body')
          .attr('x', d => _.scales.x(_.horizontal ? d.value.q1 : d.name) - xShift)
          .attr('y', d => _.scales.y(_.horizontal ? d.name : d.value.q3) - yShift)
          .attr('width', d => _.horizontal ? _.scales.x(d.value.q3) - _.scales.x(d.value.q1) : _.boxWidth)
          .attr('height', d => _.horizontal ? _.boxWidth : _.scales.y(d.value.q1) - _.scales.y(d.value.q3))
          .attr('stroke-width', d => self._lineWidth.mapping(d.name))
          .attr('fill-opacity', self._opacity.value())
        g.select('.box-median')
          .attr('x1', d => _.scales.x(_.horizontal ? d.value.median : d.name) - xShift)
          .attr('y1', d => _.scales.y(_.horizontal ? d.name : d.value.median) - yShift)
          .attr('x2', d => _.scales.x(_.horizontal ? d.value.median : d.name) + xShift)
          .attr('y2', d => _.scales.y(_.horizontal ? d.name : d.value.median) + yShift)
        g.select('.box-whisker-lower')
          .attr('d', whiskerPath('lower'))
          .attr('stroke-width', d => self._lineWidth.mapping(d.name))
        g.select('.box-whisker-upper')
          .attr('d', whiskerPath('upper'))
          .attr('stroke-width', d => self._lineWidth.mapping(d.name))

        return g
      },
      exit: g => g.style('opacity', 0)
    }, duration)
  }, true)

  // Public API.
  api = Object.assign(api || {}, {
    /**
     * Sets the box width in pixels.
     *
     * @method boxWidth
     * @methodOf BoxPlot
     * @param {number} [width = 20] Width of the box in pixels.
     * @returns {Object} Reference to the BoxPlot's API.
     * @example
     *
     * // Set box width to 20px.
     * const box = dalian.BoxPlot('my-chart')
     *   .boxWidth(20)
     *   .render()
     *
     * // Reset box width to default.
     * box.boxWidth()
     *   .render()
     */
    boxWidth (width = 20) {
      _.boxWidth = width
      return api
    }

    /**
     * Set/updates the data that is shown in the box plot. Each box is a plot group in itself, so all methods that operate
     * on plot groups are applied on the box level.
     *
     * @method data
     * @methodOf BoxPlot
     * @param {Object[]} plots Array of objects representing the boxes to show. Each box has two properties:
     * <dl>
     *   <dt>name</dt>  <dd>{string} Category name.</dd>
     *   <dt>value</dt> <dd>{Object} Category value.</dd>
     * </dl>
     * The {value} property is an object with the following structure:
     * <dl>
     *   <dt>median</dt>   <dd>{number} The sample median.</dd>
     *   <dt>q1</dt>       <dd>{number} Lower quantile of the sample.</dd>
     *   <dt>q3</dt>       <dd>{number} Upper quantile of the sample.</dd>
     *   <dt>whiskers</dt> <dd>{Object} Object containing two numbers: the {lower} and {upper} whiskers. Meaning of these
     *   values can vary.</dd>
     *   <dt>outliers</dt> <dd>{Object} Object containing two arrays of numbers: the list of {mild} and {extreme} outliers
     *   </dd>
     * </dl>
     * @returns {BoxPlot} Reference to the BoxPlot API.
     * @example
     *
     * const box = dalian.BoxPlot('my-chart')
     *   .data([{
     *     name: 'box 1',
     *     value: {
     *       median: 4.5,
     *       q1: 3.2,
     *       q3: 6.5,
     *       whiskers: {
     *         lower: 2.2,
     *         upper: 7.6
     *       },
     *       outliers: {
     *         mild: [],
     *         extreme: [9.2, 10.2]
     *       }
     *     }
     *   }, {
     *     name: 'box 1',
     *     value: {
     *       median: 5.4,
     *       q1: 4.5,
     *       q3: 7.4,
     *       whiskers: {
     *         lower: 3.4,
     *         upper: 8.7
     *       },
     *       outliers: {
     *         mild: [3.2, 3.3],
     *         extreme: []
     *       }
     *     }
     *   }])
     *   .render()
     */
  })

  return api
}
