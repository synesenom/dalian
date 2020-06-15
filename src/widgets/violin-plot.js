import {area, curveBasis, extent, max, mean, median, min, range, scaleLinear, select, sum} from 'd3'
import { interpolatePath } from 'd3-interpolate-path'
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
import YRange from '../components/range/y-range'

/**
 * The violin plot widget. As a chart, it extends the [Chart]{@link ../components/chart.html} component, with all of its
 * available APIs. Furthermore, it extends the following components:
 * <ul>
 *   <li><a href="../components/bottom-axis.html">BottomAxis</a></li>
 *   <li><a href="../components/element-tooltip.html">ElementTooltip</a> The default entries shown in the tooltip are:
 *   mean, median, bimodality coefficient.</li>
 *   <li>
 *     <a href="../components/highlight.html">Highlight</a> Violins can be highlighted by passing their names as
 *     specified in the data array.
 *   </li>
 *   <li><a href="../components/horizontal.html">Horizontal</a></li>
 *   <li><a href="../components/left-axis.html">LeftAxis</a></li>
 *   <li><a href="../components/line-width.html">LineWidth</a></li>
 *   <li><a href="../components/opacity.html">Opacity</a></li>
 *   <li><a href="../components/y-range.html">YRange</a></li>
 * </ul>
 *
 * @function ViolinPlot
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
    Chart('violin-plot', name, parent),
    BottomAxis(scales.x),
    ElementTooltip,
    Highlight(['.plot-group']),
    Horizontal(scales),
    LeftAxis(scales.y),
    LineWidth(1),
    Opacity(0.2),
    YRange
  )

  // Private members.
  const _ = {
    // Variables.
    data: [],
    current: undefined,
    scales: self._horizontal.scales(),

    // UI elements.
    violinWidth: 30,
    horizontal: false,
    bandwidth: 1,

    // Calculations.
    kde (kernel, dist) {
      return sample => dist.map(x => ({ x, y: mean(sample, v => kernel(x - v)) }))
    },

    epanechnikovKernel (bandwidth) {
      return u => Math.abs(u /= bandwidth) <= 1 ? 0.75 * (1 - u * u) / bandwidth : 0
    },

    makeViolin (data) {
      const yMin = min(data)
      const yMax = max(data)
      const yRange = yMax - yMin
      const kde = _.kde(_.epanechnikovKernel(_.bandwidth),
        range(Math.floor(yRange / _.bandwidth) + 1).map(d => yMin + _.bandwidth * d))
      const values = kde(data)

      return {
        yMin,
        yMax,
        values,
        scale: scaleLinear()
          .range([_.violinWidth / 2 - 1, 0])
          .domain([0, max(values, v => v.y)])
      }
    },

    bimodality (values) {
      const n = values.length

      // Moments.
      const m = mean(values)
      const m2 = sum(values, d => (d - m) * (d - m)) / n
      const m3 = sum(values, d => Math.pow(d - m, 3)) / n
      const m4 = sum(values, d => Math.pow(d - m, 4)) / n

      // Sample skewness: https://en.wikipedia.org/wiki/Skewness#Sample_skewness
      const g = Math.sqrt(n * (n - 1)) * m3 / ((n - 2) * Math.pow(m2, 1.5))

      // Sample excess kurtosis: https://en.wikipedia.org/wiki/Kurtosis#Sample_kurtosis
      const k = m4 / (m2 * m2) - 3

      // Bimodality coefficient: https://en.wikipedia.org/wiki/Multimodal_distribution#Bimodality_coefficient
      return (g * g + 1) / (k + 3 * (n - 1) * (n - 1) / ((n - 2) * (n - 3)))
    },

    // Update.
    update (duration) {
      // Collect X values and Y max.
      const xValues = self._chart.data.map(d => d.name)
      let yMin = min(self._chart.data.map(d => d.min))
      let yMax = max(self._chart.data.map(d => d.max))
      const yRange = [yMin, yMax]
      const yBuffer = 0.05 * (yRange[1] - yRange[0])
      yRange[1] += yBuffer
      yRange[0] -= yBuffer

      // Update scales.
      _.horizontal = self._horizontal.on()
      _.scales = self._horizontal.scales()
      _.scales.x.range(0, parseInt(self._widget.size.innerWidth))
        .domain(_.horizontal ? self._yRange.range(yRange) : xValues)
      _.scales.y.range(parseInt(self._widget.size.innerHeight), 0)
        .domain(_.horizontal ? xValues : self._yRange.range(yRange))

      // Add plots.
      const yShift = _.violinWidth / 2 - 0.5
      const rotate = _.horizontal ? '' : 'rotate(90)'
      self._chart.plotGroups({
        enter: g => {
          g.style('opacity', 0)
            .on('mouseover.violin', d => {
              _.current = d
            })
            .on('mouseleave.violin', () => {
              _.current = undefined
            })
            .style('color', self._color.mapper)

          // Add violin.
          g.append('path')
            .attr('class', 'violin')
            .attr('transform', d => `translate(${_.horizontal ? 0 : _.scales.x.scale(d.name) + yShift}, ${_.horizontal ? _.scales.y.scale(d.name) - yShift : 0}) ${rotate}`)
            .attr('d', d => {
              const areaFn = d.area.x(dd => _.horizontal ? _.scales.x.scale(dd.x) : _.scales.y.scale(dd.x))
              return areaFn(d.values)
            })
            .attr('stroke', 'currentColor')
            .attr('fill', 'currentColor')
            .style('fill-opacity', 0)

          return g
        },
        update: g => {
          g.style('opacity', 1)
            .style('color', self._color.mapper)

          g.select('.violin')
            .attr('transform', d => `translate(${_.horizontal ? 0 : _.scales.x.scale(d.name) + yShift}, ${_.horizontal ? _.scales.y.scale(d.name) - yShift : 0}) ${rotate}`)
            .attrTween('d', function (d) {
              const previous = select(this).attr('d')
              const areaFn = d.area.x(dd => _.horizontal ? _.scales.x.scale(dd.x) : _.scales.y.scale(dd.x))
              const current = areaFn(d.values)
              return interpolatePath(previous, current, null)
            })
            .attr('stroke-width', d => self._lineWidth.mapping(d.name))
            .style('fill-opacity', self._opacity.value())

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
        {name: 'mean', value: _.current.stats.mean},
        {name: 'median', value: _.current.stats.median},
        {name: 'bimodality', value: _.current.stats.bimodality}
      ]
    }
  }

  self._chart.transformData = data => {
    // Save original data (so that we can change bandwidth on the fly).
    _.data = data

    // Return calculated metrics.
    return data.map(d => {
      const { yMin, yMax, values, scale } = _.makeViolin(d.values)

      return {
        name: d.name,
        min: yMin,
        max: yMax,
        stats: {
          mean: mean(d.values),
          median: median(d.values.sort((a, b) => a - b)),
          bimodality: _.bimodality(d.values)
        },
        values,
        scale,
        area: area()
          .curve(curveBasis)
          .y0(dd => scale(-dd.y))
          .y1(dd => scale(dd.y))
      }
    })
  }

  // Extend widget update
  self._widget.update = extend(self._widget.update, _.update, true)

  // Public API.
  api = Object.assign(api || {}, {
    /**
     * Sets the violin width in pixels.
     *
     * @method violinWidth
     * @methodOf ViolinPlot
     * @param {number} [width = 30] Width of the violins in pixels.
     * @returns {Object} Reference to the ViolinPlot's API.
     *
     * @example
     *
     * // Set violin width to 20px.
     * const violin = dalian.ViolinPlot('my-chart')
     *   .violinWidth(20)
     *   .render()
     *
     * // Reset violin width to default value.
     * violin.violinWidth()
     *   .render()
     */
    violinWidth (width = 30) {
      _.violinWidth = width

      // Update scales and areas.
      self._chart.data.map(d => Object.assign(d, {
        scale: d.scale && d.scale.range([_.violinWidth / 2 - 1, 0]),
        area: d.area && d.area
          .y0(dd => d.scale(-dd.y))
          .y1(dd => d.scale(dd.y))
      }))
      return api
    },

    /**
     * Sets the bandwidth of the violin's kernel density estimate to the specified value.
     *
     * @method bandwidth
     * @methodOf ViolinPlot
     * @param {number} [bandwidth = 1] Bandwidth size.
     * @returns {Object} Reference to the ViolinPlot's API.
     *
     * @example
     *
     * // Set bandwidth of KDE to 10.
     * const violin = dalian.ViolinPlot('my-chart')
     *   .bandwidth(10)
     *   .render()
     *
     * // Reset bandwidth to default.
     * violin.bandwidth()
     *   .render()
     */
    bandwidth (bandwidth = 1) {
      _.bandwidth = bandwidth

      // Update values, scales and areas.
      self._chart.data.map((d, i) => {
        const { values, scale } = _.makeViolin(_.data[i].values)

        Object.assign(d, {
          values,
          scale,
          area: d.area && d.area
            .y0(dd => scale(-dd.y))
            .y1(dd => scale(dd.y))
        })
      })
      return api
    }
  })

  return api

  /**
   * Set/updates the chart data. Each violin is a plot group in itself, so all methods that operate on plot groups are
   * applied on the violin level.
   *
   * @method data
   * @methodOf ViolinPlot
   * @param {Object[]} plots Array of objects representing the violins to show. Each violin has two properties:
   * <dl>
   *   <dt>name</dt>   <dd>{string} Category name.</dd>
   *   <dt>values</dt> <dd>{number[]} Sample values corresponding to the category. These should be the raw observations,
   *   the KDE is computed by the chart itself.</dd>
   * </dl>
   *
   * Note that for the violin plot, the raw observations should be passed as values as the chart itself calculates the
   * KDE used to represent the data.
   * @returns {ViolinPlot} Reference to the ViolinPlot API.
   *
   * @example
   *
   * const violin = dalian.ViolinPlot('my-chart')
   *   .data([{
   *     name: 'violin 1',
   *     values: [1, 1, 3, 3, 2, 4, 7, 4, 3, 9]
   *   }, {
   *     name: 'violin 2',
   *     values: [4, 5, 5, 4, 7, 4, 2, 2, 6, 2]
   *   }])
   *   .render()
   */
}
