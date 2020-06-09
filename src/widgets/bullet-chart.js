import { hsl } from 'd3'
import extend from '../core/extend'
import compose from '../core/compose'
import BottomAxis from '../components/axis/bottom-axis'
import Scale from '../components/scale'
import Widget from '../components/widget'
import Description from '../components/description'
import Placeholder from '../components/placeholder'
import Font from '../components/font'

/**
 * The <a href="http://www.perceptualedge.com/articles/misc/Bullet_Graph_Design_Spec.pdf">bullet chart</a> widget.
 * The chart extends the following components:
 * <ul>
 *   <li><a href="./components/bottom-axis.html">BottomAxis</a></li>
 *   <li><a href="./components/description.html">Description</a></li>
 *   <li><a href="./components/font.html">Font</a></li>
 *   <li><a href="./components/placeholder.html">Placeholder</a></li>
 *   <li><a href="./components/widget.html">Widget</a></li>
 * </ul>
 *
 * @function BulletChart
 * @param {string} name Name of the chart. Should be a unique identifier.
 * @param {string} [parent = body] Query selector of the parent element to append widget to.
 */
export default (name, parent = 'body') => {
  // Default values.
  const DEFAULTS = {
    thickness: 30,
    valueColor: '#000',
    rangeColor: '#888'
  }

  const scale = Scale('linear')

  // Build widget from components.
  let { self, api } = compose(
    Widget('bullet-chart', name, parent, 'svg'),
    BottomAxis(scale),
    Description,
    Placeholder,
    Font
  )

  const forecastColor = color => {
    const c = hsl(color)
    c.l += 0.4 * (1 - c.l)
    return c
  }

  const _ = {
    scale,

    // UI elements.
    ui: {
      thickness: DEFAULTS.thickness,
      valueColor: DEFAULTS.valueColor,
      rangeColor: DEFAULTS.rangeColor
    },

    // Data.
    data: {
      label: '',
      unit: '',
      min: 0,
      max: 100,
      ranges: [0, 50, 80, 100],
      target: 95,
      value: 0,
      forecast: 0
    },

    // DOM.
    dom: (() => {
      const plot = self._widget.content.append('g')
        .attr('class', 'dalian-plot-container')
      const range = plot.append('g')
        .attr('class', 'bullet-range')
      const value = plot.append('g')
        .attr('class', 'bullet-value')
      const title = plot.append('g')
        .attr('class', 'bullet-title')

      return {
        plot,
        range: {
          g: range,
          high: range.append('rect')
            .attr('stroke', 'none')
            .attr('fill-opacity', 0.2)
            .attr('fill', 'currentColor'),
          mid: range.append('rect')
            .attr('stroke', 'none')
            .attr('fill-opacity', 0.4)
            .attr('fill', 'currentColor'),
          low: range.append('rect')
            .attr('stroke', 'none')
            .attr('fill-opacity', 0.6)
            .attr('fill', 'currentColor')
        },
        value: {
          g: value,
          forecast: value.append('rect')
            .attr('stroke', 'none'),
          bar: value.append('rect')
            .attr('stroke', 'none')
            .attr('fill', 'currentColor'),
          target: value.append('line')
            .attr('stroke', 'currentColor')
            .attr('stroke-width', '3px')
        },
        title: {
          label: title.append('text')
            .attr('dx', -10)
            .attr('dy', -2)
            .attr('font-weight', 'bold')
            .attr('text-anchor', 'end')
            .attr('dominant-baseline', 'baseline'),
          unit: title.append('text')
            .attr('dx', -10)
            .attr('dy', 2)
            .attr('font-size', 0.9 * parseFloat(self._font.size) + 'px')
            .attr('text-anchor', 'end')
            .attr('dominant-baseline', 'hanging')
        }
      }
    })(),

    update (duration) {
      // Update scale.
      _.scale.range(0, parseInt(self._widget.size.innerWidth))
        .domain([_.data.ranges[0], _.data.ranges[3]])

      // Adjust plot.
      const marginTop = (parseFloat(self._widget.size.innerHeight) - _.ui.thickness) / 2
      self._widget.getElem(_.dom.plot, duration)
        .attr('transform', `translate(${self._widget.margins.left}, ${marginTop + self._widget.margins.top})`)

        // Adjust axis.
      self._bottomAxis.margin({ bottom: marginTop })
        .tickColor(_.ui.rangeColor)

      // Update colors.
      const t = self._widget.container.transition().duration(duration)
      _.dom.range.g.transition(t)
        .attr('color', _.ui.rangeColor)
      _.dom.value.g.transition(t)
        .attr('color', _.ui.valueColor)

      // Update range
      _.dom.range.high.transition(t)
        .attr('x', _.scale.scale(_.data.ranges[0]))
        .attr('y', 0)
        .attr('width', _.scale.scale(_.data.ranges[3]) + 1)
        .attr('height', _.ui.thickness)
      _.dom.range.mid.transition(t)
        .attr('x', _.scale.scale(_.data.ranges[0]))
        .attr('y', 0)
        .attr('width', _.scale.scale(_.data.ranges[2]) + 1)
        .attr('height', _.ui.thickness)
      _.dom.range.low.transition(t)
        .attr('x', _.scale.scale(_.data.ranges[0]))
        .attr('y', 0)
        .attr('width', _.scale.scale(_.data.ranges[1]) + 1)
        .attr('height', _.ui.thickness)

      // Update value.
      _.dom.value.bar.transition(t)
        .attr('x', _.scale.scale(_.data.ranges[0]))
        .attr('y', _.ui.thickness / 3)
        .attr('width', _.scale.scale(_.data.value))
        .attr('height', _.ui.thickness / 3)
      _.dom.value.forecast.transition(t)
        .attr('x', _.scale.scale(_.data.ranges[0]))
        .attr('y', _.ui.thickness / 3)
        .attr('width', _.scale.scale(Math.min(_.data.value * (1 + _.data.forecast), _.data.ranges[3])))
        .attr('height', _.ui.thickness / 3)
        .attr('fill', forecastColor(_.ui.valueColor))
      _.dom.value.target.transition(t)
        .attr('x1', _.scale.scale(_.data.target))
        .attr('y1', _.ui.thickness / 6)
        .attr('x2', _.scale.scale(_.data.target))
        .attr('y2', 5 * _.ui.thickness / 6)

      // Update title.
      _.dom.title.label.transition(t)
        .attr('y', _.ui.thickness / 2)
        .text(_.data.label)
      _.dom.title.unit.transition(t)
        .attr('y', _.ui.thickness / 2)
        .text(_.data.unit)
    }
  }

  // Extend widget update
  self._widget.update = extend(self._widget.update, _.update, true)

  // Public API.
  api = Object.assign(api, {
    /**
     * Sets the bar's value of the chart.
     *
     * @method value
     * @methodOf BulletChart
     * @param {number} value Value to set the bar to.
     * @returns {BulletChart} Reference to the BulletChart API.
     */
    value: value => {
      _.data.value = value
      return api
    },

    forecast: forecast => {
      _.data.forecast = forecast
      return api
    },

    target: target => {
      _.data.target = target
      return api
    },

    ranges: ranges => {
      _.data.ranges = ranges
      return api
    },

    thickness: (thickness = DEFAULTS.thickness) => {
      _.ui.thickness = thickness
      return api
    },

    valueColor: (color = DEFAULTS.valueColor) => {
      _.ui.valueColor = color
      return api
    },

    rangeColor: (color = DEFAULTS.rangeColor) => {
      _.ui.rangeColor = color
      return api
    },

    label: label => {
      _.data.label = label
      return api
    },

    unit: unit => {
      _.data.unit = unit
      return api
    }

    // TODO Add label.
    // TODO Add sub label.
  })

  // Adjust axis.
  self._bottomAxis.hideAxisLine(true)

  return api
}