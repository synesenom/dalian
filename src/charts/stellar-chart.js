import {compose, extend} from '../core'
import {Chart, ElementTooltip, Highlight,  RadialAxis, RadialGrid, Scale, Smoothing} from '../components'
import { lineRadial } from 'd3'

// Default values.
const DEFAULTS = {
  radius: 100,
  inner: 0.05,
  dimensions: null,
  min: 0,
  max: 1
}

/**
 * The radar chart widget. Being a chart, it extends the [Chart]{@link ../components/chart.html} component, with all of
 * its available APIs. Each plot data is represented by a shape. Furthermore it extends the following components:
 * <ul>
 *   <li><a href="../components/highlight.html">Highlight</a>: Highlight one or more plots.</li>
 *   <li><a href="../components/line-style.html">LineStyle</a>: Using dashed or dotted lines for the plots.</li>
 *   <li><a href="../components/line-width.html">LineWidth</a>: Width of the plot lines.</li>
 *   <li><a href="../components/opacity.html">Opacity</a>: Fill opacity of the plots.</li>
 *   <li><a href="../components/radial-axis.html">RadialAxis</a>: The axis used in the chart.</li>
 *   <li><a href="../components/radial-grid.html">RadialAxis</a>: The grid illustrating axis values.</li>
 *   <li><a href="../components/smoothing.html">Smoothing</a>: Whether to use polygons or splines.</li>
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
  }

  // Build widget from components.
  let { self, api } = compose(
    Chart('radar-chart', name, parent),
    ElementTooltip,
    Highlight(() => self._chart.plots, ['.plot-group']),
    RadialAxis(scales.radius, scales.angle),
    RadialGrid,
    Smoothing
  )

  /**
   * Maps a plot data using the current dimensions.
   *
   * @method mapData
   * @memberOf RadarChart
   * @param {object} d Plot data.
   * @return {object[]} Array of objects representing the selected values.
   * @private
   */
  function mapData (d) {
    // Determine value for inner radius.
    const r = self._radialAxis.radialScale().invert(_.inner * _.radius)

    // Determine dimensions.
    const dimensions = _.dimensions || Object.keys(self._chart.data[0].values).sort()

    // Map data.
    const data = []
    for (let i = 0; i < dimensions.length; i++) {
      data.push(d.values[dimensions[i]])
      data.push(r)
    }
    return data
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
          value: _.current.values[name]
        }))
      }
    }
  }

  self._chart.transformData = data => {
    return data.map(({ name, values }) => ({
      name,
      values: Object.entries(values)
        .reduce((obj, [key, d]) => Object.assign(obj, {
          [key]: d
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
      .domain([_.min, _.max])
    scales.angle
      .range([0, (dimensions.length - 1) * 2 * Math.PI / dimensions.length])
      .domain([0, dimensions.length - 1])

    // Update axis.
    self._radialAxis.labels(dimensions)

    // Create line and error path functions.
    const lineFn = lineRadial()
      .angle((d, i) => scales.angle(i / 2))
      .radius(scales.radius)
      .curve(self._smoothing.closed())

    // Add plots.
    self._chart.plotGroups({
      enter: g => {
        // Translate group.
        g.style('opacity', 0)
          .style('color', self._color.mapper)
          .attr('transform', `translate(${parseFloat(self._widget.size.innerWidth) / 2}, ${parseFloat(self._widget.size.innerHeight) / 2})`)
          .attr('pointer-events', 'visiblePainted')
          .on('mouseover.stellar', d => {
            _.current = d
          })
          .on('mouseleave.stellar', () => {
            _.current = undefined
          })

        // Add lines.
        g.append('path')
          .attr('class', 'line')
          .attr('d', d => lineFn(mapData(d)))
          .attr('stroke', 'currentColor')
          .attr('stroke-width', 2)
          .attr('stroke-linejoin', 'round')
          .attr('stroke-linecap', 'round')

        return g
      },

      update: g => {
        // Show group.
        g.style('opacity', 1)
          .style('color', self._color.mapper)
          .attr('transform', `translate(${parseFloat(self._widget.size.innerWidth) / 2}, ${parseFloat(self._widget.size.innerHeight) / 2})`)

        // Update lines.
        g.select('.line')
          .attr('d', d => lineFn(mapData(d)))
          .attr('fill', 'currentColor')

        return g
      },

      exit: g => g.style('opacity', 0)
    }, duration)

    // Add white circle in the middle.
    if (self._chart.plots.select('circle').empty()) {
      self._chart.plots.append('circle')
        .attr('cx', parseFloat(self._widget.size.innerWidth) / 2)
        .attr('cy', parseFloat(self._widget.size.innerHeight) / 2)
        .attr('r', 3)
        .attr('fill', 'white')
        .raise()
    }
  }, true)

  // Public API.
  api = Object.assign(api || {}, {
    /**
     * Sets the order of dimensions to show: they are positioned counter -clockwise. By default dimensions are read from the data and keys are sorted alphabetically.
     *
     * @method dimensions
     * @memberOf StellarChart
     * @param {string[]} [dimensions = null] Array representing the order of dimensions. If not specified, keys are read from data and sorted alphabetically.
     * @returns {Object} Reference to the StellarChart's API.
     * @example
     *
     * // Use a subset of dimensions.
     * const stellar = dalian.StellarChart('my-chart')
     *   .dimensions(['col1', 'col2'])
     *   .render()
     *
     * // Reset radar to use all dimensions sorted alphabetically.
     * stellar.dimensions()
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
     * @memberOf StellarChart
     * @param {number} [radius = 100] Radius length to set.
     * @returns {Object} Reference to the StellarChart's API.
     * @example
     *
     * // Set radius to 60 pixels.
     * const stellar = dalian.StellarChart('my-chart')
     *   .radius(60)
     *   .render()
     *
     * // Reset radius to 100 pixels.
     * stellar.radius()
     *   .render()
     */
    radius (radius = DEFAULTS.radius) {
      _.radius = radius
      return api
    },

    /**
     * Sets the inner radius relative to the axis range.
     *
     * @method radius
     * @memberOf StellarChart
     * @param {number} [inner = 0.05] Relative radius length to set.
     * @returns {Object} Reference to the StellarChart's API.
     * @example
     *
     * // Set inner radius to 0.08 of the maximum radius.
     * const stellar = dalian.StellarChart('my-chart')
     *   .inner(0.08)
     *   .render()
     *
     * // Reset inner radius to 0.05 of the maximum radius.
     * stellar.inner()
     *   .render()
     */
    inner (inner = DEFAULTS.inner) {
      _.inner = inner
      return api
    },

    // TODO Move this to RadialRange.
    min (min = DEFAULTS.min) {
      _.min = min
      return api
    },

    // TODO Move this to RadialRange.
    max (max = DEFAULTS.max) {
      _.max = max
      return api
    },

    // TODO Docs.
    scale (scale = 'linear') {
      scales.radius.type(scale)
      return api
    }
  })

  // TODO Document data format.

  return api
}
