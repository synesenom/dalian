import extend from '../core/extend'
import compose from '../core/compose'
import BottomAxis from '../components/axis/bottom-axis'
import Scale from '../components/scale'
import Widget from '../components/widget'
import Description from '../components/description'
import Placeholder from '../components/placeholder'
import Font from '../components/font'


export default (name, parent = 'body') => {
  // Default values.
  const DEFAULTS = {
    thickness: 30,
    valueColor: 'royalblue',
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
      min: 0,
      max: 100,
      ranges: [50, 80],
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
        .attr('color', DEFAULTS.rangeColor)
      const value = plot.append('g')
        .attr('class', 'bullet-value')
        .attr('color', DEFAULTS.valueColor)

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
            .attr('fill-opacity', 0.5)
            .attr('fill', 'currentColor')
        },
        value: {
          g: value,
          target: value.append('line')
            .attr('stroke', 'currentColor')
            .attr('stroke-width', '3px'),
          forecast: value.append('rect')
            .attr('stroke', 'none')
            .attr('fill', 'currentColor')
            .attr('fill-opacity', 0.5),
          bar: value.append('rect')
            .attr('stroke', 'none')
            .attr('fill', 'currentColor')
        }
      }
    })(),

    update (duration) {
      // Update scale.
      _.scale.range(0, parseInt(self._widget.size.innerWidth))
        .domain([_.data.min, _.data.max])

      // Adjust plot.
      self._widget.getElem(_.dom.plot, duration)
        .attr('transform', `translate(${self._widget.margins.left}, ${100 + self._widget.margins.top})`)

      // Transition.
      const t = _.dom.plot.transition().duration(duration)

      // Update colors.
      _.dom.range.g.transition(t)
        .attr('color', _.ui.rangeColor)
      _.dom.value.g.transition(t)
        .attr('color', _.ui.valueColor)

      // Update DOM elements.
      _.dom.range.high.transition(t)
        .attr('x', _.scale.scale(_.data.min))
        .attr('y', 0)
        .attr('width', _.scale.scale(_.data.max))
        .attr('height', _.ui.thickness)
      _.dom.range.mid.transition(t)
        .attr('x', _.scale.scale(_.data.min))
        .attr('y', 0)
        .attr('width', _.scale.scale(_.data.ranges[1]))
        .attr('height', _.ui.thickness)
      _.dom.range.low.transition(t)
        .attr('x', _.scale.scale(_.data.min))
        .attr('y', 0)
        .attr('width', _.scale.scale(_.data.ranges[0]))
        .attr('height', _.ui.thickness)
      _.dom.value.bar.transition(t)
        .attr('x', _.scale.scale(_.data.min))
        .attr('y', _.ui.thickness / 3)
        .attr('width', _.scale.scale(_.data.value))
        .attr('height', _.ui.thickness / 3)
      _.dom.value.forecast.transition(t)
        .attr('x', _.scale.scale(_.data.min))
        .attr('y', _.ui.thickness / 3)
        .attr('width', _.scale.scale(Math.min(_.data.value * (1 + _.data.forecast), _.data.max)))
        .attr('height', _.ui.thickness / 3)
      _.dom.value.target.transition(t)
        .attr('x1', _.scale.scale(_.data.target))
        .attr('y1', _.ui.thickness / 6)
        .attr('x2', _.scale.scale(_.data.target))
        .attr('y2', 5 * _.ui.thickness / 6)
    }
  }

  // Extend widget update
  self._widget.update = extend(self._widget.update, _.update, true)

  // Public API.
  api = Object.assign(api, {
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
    }

    // TODO ADD min/max.
  })

  // Adjust axis.
  self._bottomAxis.hideAxisLine(true)

  return api

  /**
   * Set/updates the data that is shown in the box plot. Each box is a plot group in itself, so all methods that operate
   * on plot groups are applied on the box level.
   *
   * @method data
   * @methodOf BulletChart
   * @param {number} data Number representing the bar of the bullet chart.
   * @returns {BulletChart} Reference to the BulletChart API.
   */
}