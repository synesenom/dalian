import { extent, interpolateLab, max, min, rgb, timer } from 'd3'
import compose from '../core/compose'
import extend from '../core/extend'
import BottomAxis from '../components/axis/bottom-axis'
import Chart from '../components/chart'
import LeftAxis from '../components/axis/left-axis'
import Scale from '../components/scale'
import XRange from '../components/range/x-range'
import YRange from '../components/range/y-range'

// TODO Support negative values.
// TODO Add colormap widget.
// TODO Add Tooltip.
// TODO Add Objects.
// TODO Add XRange and YRange.
// TODO Convert canvas to SVG before downloading or add canvas conversion to Chart.download.
/**
 * The heatmap widget. Being a chart, it extends the [Chart]{@link ../components/chart.html} component, with all of
 * its available APIs. Furthermore, it extends the following components:
 * <ul>
 *   <li><a href="../components/bottom-axis.html">BottomAxis</a></li>
 *   <li><a href="../components/left-axis.html">LeftAxis</a></li>
 * </ul>
 *
 * @function Heatmap
 * @param {string} name Name of the chart. Should be a unique identifier.
 * @param {string} [parent = body] See [Widget]{@link ../components/widget.html} for description.
 */
export default (name, parent = 'body') => {
  // Default values.
  const DEFAULTS = {
    grid: [100, 100]
  }

  // Build widget from components
  const scales = {
    x: Scale('linear'),
    y: Scale('linear')
  }
  let { self, api } = compose(
    Chart('heatmap', name, parent),
    LeftAxis(scales.y),
    BottomAxis(scales.x),
    XRange,
    YRange
  )

  // Private members.
  const _ = {
    // Variables.
    scales,

    // Internal variables.
    i: Object.assign({domain: []}, DEFAULTS),

    dom: (() => {
      const container = self._widget.content.append('foreignObject')
      const body = container.append('xhtml:body')
        .style('width', '100%')
        .style('height', '100%')
      const canvas = body.append('canvas')
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', DEFAULTS.grid[0])
        .attr('height', DEFAULTS.grid[1])
        .style('position', 'absolute')
        .style('width', '100%')
        .style('height', '100%')
        .style('image-rendering', 'crisp-edges')
        .style('image-rendering', 'pixelated')
      const context = canvas.node().getContext('2d')
      const img = context.createImageData(...DEFAULTS.grid).data

      return {container, canvas, context, img}
    })(),

    interpolateImage(imgData, data, t) {
      // Go through data.
      const img = _.dom.context.createImageData(..._.i.grid)
      for (let j = 0, k = 0, l = 0; j < _.i.grid[1]; j++) {
        for (let i = 0; i < _.i.grid[0]; i++, k++, l += 4) {
          // Get interpolated color.
          const c0 = rgb(imgData[l], imgData[l + 1], imgData[l + 2], imgData[l + 3] / 255)
          const c1 = self._color.mapper(data.values[k] / data.max)
          const c = rgb(interpolateLab(c0, c1)(t))

          // Set current color.
          img.data[l] = c.r
          img.data[l + 1] = c.g
          img.data[l + 2] = c.b
          img.data[l + 3] = 255 * c.opacity
        }
      }
      _.dom.context.putImageData(img, 0, 0)
      return img
    },

    // Update.
    update (duration) {
      // Init scales.
      _.scales.x.range(0, parseInt(self._widget.size.innerWidth))
        .domain(self._xRange.range(self._chart.data.xRange))
      _.scales.y.range(parseInt(self._widget.size.innerHeight), 0)
        .domain(self._yRange.range(self._chart.data.yRange))

      // Add tiles.
      self._widget.transition = true
      const transition = timer(function (elapsed) {
        // Create scale variable.
        let t = duration >> 0 ? elapsed / duration : 1
        _.interpolateImage(_.dom.img, self._chart.data, t)

        // Stop transition.
        if (t >= 1) {
          // Finish interpolation.
          const img = _.interpolateImage(_.dom.img, self._chart.data, 1)

          // Update image data and stop transition.
          _.dom.img = img.data.slice()
          self._widget.transition = false
          transition.stop()
        }
      })

      // Add event to detect hovering events.
      self._widget.container
        .on('mousemove.heatmap', () => {
          // TODO Update current tile.
        })
        .on('click.heatmap', () => {
          // TODO
        })

      // Update sizes.
      _.dom.container.attr('x', 1 + self._widget.margins.left + 'px')
        .attr('y', self._widget.margins.top + 'px')
        .attr('width', self._widget.size.innerWidth)
        .attr('height', self._widget.size.innerHeight)
    }
  }

  self._chart.transformData = data => {
    // TODO
    // Determine size of the tiles.
    const xRange = extent(data.map(d => d.x))
    const yRange = extent(data.map(d => d.y))
    const sx = (xRange[1] - xRange[0]) / _.i.grid[0]
    const sy = (yRange[1] - yRange[0]) / _.i.grid[1]

    // Aggregate grid values.
    let values = new Array(_.i.grid[0] * _.i.grid[1]).fill(0)
    data.forEach(d => {
      const i = Math.floor((d.x - xRange[0]) / sx)
      const j = Math.floor((d.y - yRange[0]) / sy)
      values[i + j * _.i.grid[0]] += d.value || 1
    })

    // Remove values outside the grid.
    values = values.filter(d => !isNaN(d))

    return {
      data,
      xRange,
      yRange,
      min: min(values),
      max: max(values),
      values
    }
  }

  // Extend widget update
  self._widget.update = extend(self._widget.update, _.update, true)

  // Public API.
  api = Object.assign(api || {}, {
    grid (grid) {
      // Set grid.
      _.i.grid = grid

      // Update canvas size.
      _.dom.canvas
        .attr('width', _.i.grid[0])
        .attr('height', _.i.grid[1])
      _.dom.img = _.dom.context.createImageData(..._.i.grid).data

      // Re-compute density.
      self._chart.data = self._chart.transformData(self._chart.data.data)

      return api
    }
    // TODO grid
    // TODO
  })

  // Set some defaults for the color mapping.
  api.color.policy('sequential')
    .color.palette(['transparent', '#000'])
    .color.on(d => d)

  return api
}
