import Scale from '../components/scale'
import compose from '../core/compose'
import Chart from '../components/chart'
import LineWidth from '../components/line-width'
import LineStyle from '../components/line-style'
import Opacity from '../components/opacity'
import Smoothing from '../components/smoothing'
import ElementTooltip from '../components/tooltip/element-tooltip'
import Highlight from '../components/highlight'
import extend from '../core/extend'
import {axisRight, areaRadial, lineRadial, curveLinearClosed, curveCatmullRomClosed} from 'd3'
import {interpolatePath} from 'd3-interpolate-path'
import {measureText} from '../utils/measure-text'

/**
 * The radar chart widget. Being a chart, it extends the [Chart]{@link ../components/chart.html} component, with all of
 * its available APIs. Furthermore it extends the following components:
 * <ul>
 *   <li><a href="../components/line-width.html">LineWidth</a></li>
 *   <li><a href="../components/smoothing.html">Smoothing</a></li>
 * </ul>
 *
 * @function RadarChart
 * @param {string} name Name of the chart. Should be a unique identifier.
 * @param {string} [parent = body] See [Widget]{@link ../components/widget.html} for description.
 */
export default (name, parent = 'body') => {
  // Default values.
  const DEFAULTS = {
    radius: 100,
    dimensions: null,
    max: 1,
    scale: 'linear'
  }

  // Build scales.
  const scales = {
    angle: Scale('linear'),
    radius: Scale('linear')
  }

  // Build widget from components
  let { self, api } = compose(
    Chart('radar-chart', name, parent),
    LineStyle,
    LineWidth(1),
    Opacity(0),
    Smoothing,
    ElementTooltip,
    Highlight(() => self._chart.plots, ['.plot-group']),
  )

  // Private members.
  const _ = {
    // Variables.
    scales,

    // TODO Move this to RadialAxis.
    tickValues: [],
    tickFormat: x => x,

    // Internal.
    i: Object.assign({}, DEFAULTS),

    // TODO Move this to RadialAxis component using BaseAxis.
    radialAxis: (() => {
      const type = 'radial'

      // Container: an SVG group that contains all axis related DOM elements.
      const container = self._widget.content.insert('g', ':first-child')
        .attr('class', `dalian-axis-container ${type}`)
        .style('font-family', 'inherit')
        .style('font-size', 'inherit')

      // The axis group
      const axis = container.append('g')
        .attr('class', `axis ${type}`)
        .style('font-family', 'inherit')
        .style('font-size', 'inherit')

      return {
        container,
        axis
      }
    })(),

    radialGrid: (() => {
      const container = self._widget.content.insert('g', ':first-child')
        .attr('class', 'dalian-grid-container')

      return {
        container
      }
    })(),

    mapData(d) {
      // Determine dimensions.
      const dimensions = _.i.dimensions || Object.keys(self._chart.data[0].values).sort()

      // Map data.
      return dimensions.map(c => ({
        y: +d.values[c].y,
        lo: +d.values[c].lo,
        hi: +d.values[c].hi
      }))
    },

    axisX (i, n) {
      return _.i.radius * Math.sin(i * 2 * Math.PI / n)
    },

    axisY (i, n) {
      return -_.i.radius * Math.cos(i * 2 * Math.PI / n)
    },

    textAnchor (i, n) {
      if (i === 0 || i === n / 2) {
        return 'middle'
      }
      if (i < n / 2) {
        return 'start'
      }
      return 'end'
    },

    dominantBaseline (i, n) {
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
    },

    updateAxes (dimensions, duration) {
      const scale = _.scales.radius.scale.copy()

      const axisFn = axisRight(scale.range([
        0, -scale.range()[1]
      ]))
        .tickFormat(_.tickFormat)
        .tickSize(0)
        .tickValues(_.tickValues)

      self._widget.getElem(_.radialAxis.container, duration)
        .attr('transform', `translate(${parseFloat(self._widget.size.width) / 2}, ${parseFloat(self._widget.size.height) / 2})`)
        .call(axisFn)
      _.radialAxis.container
        .selectAll('.tick > text')
        .style('font-size', '.8em')
      _.radialAxis.container
        .select('.domain').remove()

      // TODO Group lines and labels together.
      _.radialAxis.axis.selectAll('line')
        .data(dimensions, d => d)
        .join(
          enter => enter.append('line')
            .attr('stroke', 'black')
            .attr('x1', 0)
            .attr('y1', 0)
            .attr('x2', (d, i) => 1.05 * _.axisX(i, dimensions.length))
            .attr('y2', (d, i) => 1.05 * _.axisY(i, dimensions.length))
            .style('stroke-width', '1px')
            .style('shape-rendering', 'crispEdges')
            .style('stroke', 'currentColor'),

          update => update.transition().duration(duration)
            .attr('x2', (d, i) => 1.05 * _.axisX(i, dimensions.length))
            .attr('y2', (d, i) => 1.05 * _.axisY(i, dimensions.length)),

          exit => exit.remove()
        )

      // TODO Adjust text position.
      _.radialAxis.axis.selectAll('.axis-label')
        .data(dimensions, d => d)
        .join(
          enter => enter.append('text')
            .attr('class', 'axis-label radial')
            .attr('x', (d, i) => 1.15 * _.axisX(i, dimensions.length))
            .attr('y', (d, i) => 1.15 * _.axisY(i, dimensions.length))
            .attr('fill', 'currentColor')
            .attr('stroke', 'none')
            .attr('text-anchor', (d, i) => _.textAnchor(i, dimensions.length))
            .attr('dominant-baseline', (d, i) => _.dominantBaseline(i, dimensions.length))
            .style('font-family', 'inherit')
            .style('font-size', 'inherit')
            .style('font-size', '1em')
            .text(d => d),

          update => update.transition().duration(duration)
            .attr('x', (d, i) => 1.15 * _.axisX(i, dimensions.length))
            .attr('y', (d, i) => 1.15 * _.axisY(i, dimensions.length))
            .attr('text-anchor', (d, i) => _.textAnchor(i, dimensions.length))
            .attr('dominant-baseline', (d, i) => _.dominantBaseline(i, dimensions.length))
            .text(d => d),

          exit => exit.remove()
        )
    },

    updateGrid (dimensions, duration) {
      if (self._smoothing.isOn()) {
        _.radialGrid.container
          .attr('transform', `translate(${parseFloat(self._widget.size.width) / 2}, ${parseFloat(self._widget.size.height) / 2})`)
          .selectAll('circle')
          .data(_.tickValues)
          .join(
            enter => enter.append('circle')
              .attr('cx', 0)
              .attr('cy', 0)
              .attr('r', _.scales.radius.scale)
              .attr('fill', 'none')
              .attr('stroke', '#bbb'),

            update => update.transition().duration(duration)
              .attr('r', _.scales.radius.scale),

            exit => exit.remove()
          )
      } else {
        const lineFn = lineRadial()
          .angle((d, i) => _.scales.angle.scale(i))
          .radius(_.scales.radius.scale)
          .curve(curveLinearClosed)

        const gridData = _.tickValues.map(d => Array(dimensions.length).fill(d))
        _.radialGrid.container
          .attr('transform', `translate(${parseFloat(self._widget.size.width) / 2}, ${parseFloat(self._widget.size.height) / 2})`)
          .selectAll('path')
          .data(gridData)
          .join(
            enter => enter.append('path')
              .attr('d', lineFn)
              .attr('fill', 'none')
              // TODO Use font color.
              .attr('stroke', '#bbb'),

            update => update.transition().duration(duration)
              .attr('d', lineFn),

            // TODO Opacity first.
            exit => exit.remove()
          )
      }
    },

    // Methods.
    update (duration) {
      // Prepare dimensions.
      const dimensions = _.i.dimensions || Object.keys(self._chart.data[0].values).sort()

      // Update scales.
      _.scales.radius = Scale(_.i.scale)
        .range(0, _.i.radius)
        .domain([0, _.i.max])
      _.scales.angle.range(0, (dimensions.length - 1) * 2 * Math.PI / dimensions.length)
        .domain([0, dimensions.length - 1])

      // Update axis.
      _.updateAxes(dimensions, duration)

      // Update grid.
      _.updateGrid(dimensions, duration)

      // Create line and error path functions.
      // TODO Add flag to decide if is should be filled.
      const lineFn = lineRadial()
        .angle((d, i) => _.scales.angle.scale(i))
        .radius(d => _.scales.radius.scale(d.y))
        .curve(self._smoothing.closed())
      const errorFn = areaRadial()
        .angle((d, i) => _.scales.angle.scale(i))
        .innerRadius(d => _.scales.radius.scale(d.y - d.lo))
        .outerRadius(d => _.scales.radius.scale(d.y + d.hi))
        .curve(self._smoothing.closed())

      // Add plots.
      self._chart.plotGroups({
        enter: g => {
          // Translate group.
          g.style('opacity', 0)
            .style('color', self._color.mapper)
            .attr('transform', `translate(${parseFloat(self._widget.size.innerWidth) / 2}, ${parseFloat(self._widget.size.innerHeight) / 2})`)
            .attr('pointer-events', 'visiblePainted')
            .on('mouseover.radar', d => {
              _.current = d
            })
            .on('mouseleave.radar', () => {
              _.current = undefined
            })

          // Add error bands.
          g.append('path')
            .attr('class', 'error-band')
            .attr('d', d => errorFn(_.mapData(d)))
            .attr('stroke', 'none')
            .attr('fill', 'currentColor')
            .attr('fill-opacity', 0)

          // Add lines.
          g.append('path')
            .attr('class', 'line')
            .attr('d', d => lineFn(_.mapData(d)))
            .attr('fill-opacity', self._opacity.value())
            .attr('stroke', 'currentColor')
            .attr('stroke-linejoin', 'round')
            .attr('stroke-linecap', 'round')

          return g
        },

        update: g => {
          // Show group.
          g.style('opacity', 1)
            .style('color', self._color.mapper)
            .attr('transform', `translate(${parseFloat(self._widget.size.innerWidth) / 2}, ${parseFloat(self._widget.size.innerHeight) / 2})`)

          // TODO Fix transition animation.
          // Update error bands.
          g.select('.error-band')
            .attr('fill-opacity', 0.2)
            .attr('d', d => errorFn(_.mapData(d)))

          // Update lines.
          g.select('.line')
            .attr('d', d => lineFn(_.mapData(d)))
            .attr('fill', self._opacity.value() > 0 ? 'currentColor' : 'none')
            .attr('fill-opacity', self._opacity.value())
            .attr('stroke-width', d => self._lineWidth.mapping(d.name))
            .attr('stroke-dasharray', d => self._lineStyle.strokeDashArray(d.name))

          return g
        },

        exit: g => g.style('opacity', 0)
      }, duration)

      // TODO Add grid lines if needed.
      // TODO Make separate component RadialGrid.
    }
  }

  // Overrides.
  self._tooltip.content = () => {
    if (typeof _.current === 'undefined') {
      return
    }

    const dimensions = _.i.dimensions || Object.keys(self._chart.data[0].values).sort()

    return {
      title: _.current.name,
      stripe: self._color.mapper(_.current),
      content: {
        data: dimensions.map(name => ({
          name,
          value: _.current.values[name].y
        }))
      }
    }
  }

  self._chart.transformData = data => {
    return data.map(({name, values}) => ({
      name,
      values: Object.entries(values)
        .reduce((obj, [key, d]) => Object.assign(obj, {
          [key]:{
              y: d[0] || d,
              lo: d[1] || 0,
              hi: d[2] || 0
          }
        }), {})
    }))
  }

  // Extend widget update: update plot before widget.
  self._widget.update = extend(self._widget.update, _.update, true)

  // Public API.
  api = Object.assign(api || {},  {
    /**
     * Sets the order of dimensions to show: they are positioned counter -clockwise. By default dimensions are read from the data and keys are sorted alphabetically.
     *
     * @method dimensions
     * @methodOf RadarChart
     * @param {string[]} [dimensions = null] Array representing the order of dimensions. If not specified, keys are read from data and sorted alphabetically.
     * @returns {Object} Reference to the ViolinPlot's API.
     * @example
     *
     * // Use a subset of dimensions.
     * const radar = dalian.RadarPlot('my-chart')
     *   .dimensions(['col1', 'col2'])
     *   .render()
     *
     * // Reset radar to use all dimensions sorted alphabetically.
     * radar.dimensions()
     *   .render()
     */
    dimensions (dimensions = DEFAULTS.dimensions) {
      _.i.dimensions = dimensions
      return api
    },

    /**
     * Sets the radius in pixels.
     *
     * @method radius
     * @methodOf RadarChart
     * @param {number} [radius = 100] Radius length to set.
     * @returns {Object} Reference to the ViolinPlot's API.
     * @example
     *
     * // Set radius to 60 pixels.
     * const radar = dalian.RadarPlot('my-chart')
     *   .radius(60)
     *   .render()
     *
     * // Reset radius to 100 pixels.
     * radar.radius()
     *   .render()
     */
    radius (radius = DEFAULTS.radius) {
      _.i.radius = radius
      return api
    },

    // TODO Move this to RadialRange.
    // TODO Default to data max.
    max (max = DEFAULTS.max) {
      _.i.max = max
      return api
    },

    scale (scale = DEFAULTS.scale) {
      _.i.scale = scale
      return api
    },

    // TODO Move this to RadialAxis.
    radialAxis: {
      values (values = []) {
        _.tickValues = values
        return api
      },

      /**
       * Sets the Y tick format of the chart.
       *
       * @method format
       * @methodOf RadialAxis
       * @param {Function} format Function to set as formatter.
       * @returns {Object} Reference to the LeftAxis API.
       */
      format: format => {
        _.tickFormat = format || (x => x)
        return api
      },
    }
  })

  return api
}
