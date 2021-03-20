import Scale from '../components/scale'
import compose from '../core/compose'
import Chart from '../components/chart'
import LineWidth from '../components/line-width'
import LineStyle from '../components/line-style'
import Opacity from '../components/opacity'
import Smoothing from '../components/smoothing'
import RadialAxis from '../components/axis/radial-axis'
import ElementTooltip from '../components/tooltip/element-tooltip'
import Highlight from '../components/highlight'
import extend from '../core/extend'
import {areaRadial, lineRadial, curveLinearClosed} from 'd3'

// Default values.
const DEFAULTS = {
  radius: 100,
  dimensions: null,
  max: 1
}

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
  // Private members.
  const _ = Object.assign({}, DEFAULTS)

  // Build scales.
  const scales = {
    angle: Scale(),
    radius: Scale()
      .domain([0, 1])
  }

  // Build widget from components
  let { self, api } = compose(
    Chart('radar-chart', name, parent),
    RadialAxis(scales.radius),
    LineStyle,
    LineWidth(1),
    Opacity(0),
    Smoothing,
    ElementTooltip,
    Highlight(() => self._chart.plots, ['.plot-group']),
  )

  // Private methods.
  // TODO Docstring.
  function mapData(d) {
    // Determine dimensions.
    const dimensions = _.dimensions || Object.keys(self._chart.data[0].values).sort()

    // Map data.
    return dimensions.map(c => {
      const value = d.values[c]
      return {
        y: +value.y,
        lo: +value.lo,
        hi: +value.hi
      }
    })
  }

  // TODO Move this to RadialGrid.
  const radialGrid = (() => {
    const container = self._widget.content.insert('g', ':first-child')
      .attr('class', 'dalian-grid-container')

    return {
      container
    }
  })()

  function updateGrid (dimensions, duration) {
    if (self._smoothing.isOn()) {
      radialGrid.container
        .attr('transform', `translate(${parseFloat(self._widget.size.width) / 2}, ${parseFloat(self._widget.size.height) / 2})`)
        .selectAll('circle')
        .data(self._radialAxis.ticks())
        .join(
          enter => enter.append('circle')
            .attr('cx', 0)
            .attr('cy', 0)
            .attr('r', scales.radius)
            .attr('fill', 'none')
            .attr('stroke', '#bbb'),

          update => update.transition().duration(duration)
            .attr('r', scales.radius),

          exit => exit.remove()
        )
    } else {
      const lineFn = lineRadial()
        .angle((d, i) => scales.angle(i))
        .radius(scales.radius)
        .curve(curveLinearClosed)

      const gridData = self._radialAxis.ticks()
        .map(d => Array(dimensions.length).fill(d))
      radialGrid.container
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
  }

  // Overrides.
  self._tooltip.content = () => {
    if (typeof _.current === 'undefined') {
      return
    }

    const dimensions = _.dimensions || Object.keys(self._chart.data[0].values).sort()

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
          [key]: {
              y: typeof d[0] === 'number' ? d[0] : d,
              lo: typeof d[1] === 'number' ? d[1] : 0,
              hi: typeof d[2] === 'number' ? d[2] : 0
          }
        }), {})
    }))
  }

  // Extend widget update.
  self._widget.update = extend(self._widget.update, duration => {
    // Prepare dimensions.
    const dimensions = _.dimensions || Object.keys(self._chart.data[0].values).sort()

    // Update scales.
    scales.radius
      .range([0, _.radius])
      .domain([0, _.max])
    scales.angle
      .range([0, (dimensions.length - 1) * 2 * Math.PI / dimensions.length])
      .domain([0, dimensions.length - 1])

    // Update axis.
    self._radialAxis.labels(dimensions)

    // Update grid.
    updateGrid(dimensions, duration)

    // Create line and error path functions.
    // TODO Add flag to decide if is should be filled.
    const lineFn = lineRadial()
      .angle((d, i) => scales.angle(i))
      .radius(d => scales.radius(d.y))
      .curve(self._smoothing.closed())
    const errorFn = areaRadial()
      .angle((d, i) => scales.angle(i))
      .innerRadius(d => scales.radius(d.y - d.lo))
      .outerRadius(d => scales.radius(d.y + d.hi))
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
          .attr('d', d => errorFn(mapData(d)))
          .attr('stroke', 'none')
          .attr('fill', 'currentColor')
          .attr('fill-opacity', 0)

        // Add lines.
        g.append('path')
          .attr('class', 'line')
          .attr('d', d => lineFn(mapData(d)))
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
          .attr('d', d => errorFn(mapData(d)))

        // Update lines.
        g.select('.line')
          .attr('d', d => lineFn(mapData(d)))
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
  }, true)

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
      _.dimensions = dimensions
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
      _.radius = radius
      return api
    },

    // TODO Move this to RadialRange.
    // TODO Default to data max.
    max (max = DEFAULTS.max) {
      _.max = max
      return api
    },

    // TODO Docs.
    scale (scale = 'linear') {
      scales.radius.type(scale)
      return api
    },
  })

  // TODO Document data format.

  return api
}
