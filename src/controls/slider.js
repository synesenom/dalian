import { drag, event } from 'd3'
import extend from '../core/extend'
import compose from '../core/compose'
import BottomAxis from '../components/axis/bottom-axis'
import Description from '../components/description'
import Font from '../components/font'
import Placeholder from '../components/placeholder'
import Scale from '../components/scale'
import Widget from '../components/widget'

// TODO Make it touch compatible.
/**
 * The slider control widget.
 *
 * @function Slider
 * @param {string} name Name of the widget. Should be a unique identifier.
 * @param {string} [parent = body] See [Widget]{@link ../components/widget.html} for description.
 */
export default (name, parent = 'body') => {
  // Default values.
  const DEFAULTS = {
    color: 'grey',
    max: 1,
    min: 0,
    step: 0,
    thickness: 8,
    trackColor: '#ccc',
    value: 0
  }

  // Scale.
  const scale = Scale('linear')

  // Build widget from components.
  let { self, api } = compose(
    Widget('slider', name, parent, 'svg'),
    BottomAxis(scale),
    Description,
    Placeholder,
    Font
  )

  // Private members.
  const _ = {
    scale,

    // UI elements.
    ui: {
      color: DEFAULTS.color,
      max: DEFAULTS.max,
      min: DEFAULTS.min,
      step: DEFAULTS.step,
      thickness: DEFAULTS.thickness,
      trackColor: DEFAULTS.trackColor
    },

    internal: {
      domain: [],
      value: DEFAULTS.value
    },

    // DOM.
    dom: (() => {
      // Container.
      const container = self._widget.content.append('g')
        .attr('class', 'dalian-slider-container')

      // Track.
      const track = container.append('line')
        .attr('class', 'slider-track')
        .attr('y1', 0)
        .attr('y2', 0)
        .attr('stroke-linecap', 'round')

      // Value track.
      const value = container.append('line')
        .attr('class', 'slider-track')
        .attr('y1', 0)
        .attr('y2', 0)
        .attr('stroke-linecap', 'round')

      // Overlay: to catch clicks on the track itself.
      const overlay = container.append('line')
        .attr('class', 'slider-overlay')
        .attr('y1', 0)
        .attr('y2', 0)
        .attr('stroke', 'none')
        .style('cursor', 'pointer')
        .style('pointer-events', 'all')
        .call(drag()
          .on('start drag', () => {
            handle.attr('fill', _.ui.color)
              .attr('stroke', '#fff')
              .attr('stroke-width', 2)

            // Calculate value.
            _.updateValue()

            // Update handle position.
            _.dom.handle.attr('cx', _.scale.scale(_.internal.value) + 0.5)
            _.dom.value.attr('x2', _.scale.scale(_.internal.value) + 0.5)
            _.internal.callback && _.internal.callback(_.internal.value)
          })
          .on('end', () => {
            handle.attr('fill', '#fff')
              .attr('stroke', _.ui.trackColor)
              .attr('stroke-width', 1)
          })
        )

      // Handle.
      const handle = container.append('circle')
        .attr('class', 'slider-handle')
        .attr('cy', 0)
        .attr('fill', '#fff')

      return {
        container,
        track,
        value,
        overlay,
        handle
      }
    })(),

    updateDomain () {
      if (_.ui.step === 0) {
        return []
      }

      _.internal.domain = []
      for (let i = _.ui.min; i <= _.ui.max; i += _.ui.step) {
        _.internal.domain.push(i)
      }
    },

    updateValue (initialValue) {
      const x = typeof initialValue === 'undefined' ? event.x : _.scale.scale(initialValue)
      if (_.ui.step > 0) {
        _.internal.value = _.internal.domain.reduce((prev, curr) => (Math.abs(_.scale.scale(curr) - x) < Math.abs(_.scale.scale(prev) - x) ? curr : prev))
      } else {
        _.internal.value = Math.max(_.ui.min, Math.min(_.ui.max, _.scale.scale.invert(x)))
      }
    },

    update (duration) {
      _.scale.range(0, parseFloat(self._widget.size.innerWidth))
        .domain([_.ui.min, _.ui.max])

      // Update internals.
      _.updateDomain()
      _.updateValue(_.internal.value)

      // Adjust margin.
      const marginTop = parseFloat(self._widget.size.height) / 2

      // Adjust container.
      self._widget.getElem(_.dom.container,  duration)
        .attr('transform', `translate(${self._widget.margins.left}, ${marginTop})`)

      // Adjust track and overlay.
      self._widget.getElem(_.dom.track, duration)
        .attr('x2', self._widget.size.innerWidth)
        .attr('stroke', _.ui.trackColor)
        .attr('stroke-width', _.ui.thickness)
      self._widget.getElem(_.dom.overlay, duration)
        .attr('x1', -_.ui.thickness)
        .attr('x2', parseFloat(self._widget.size.innerWidth) + _.ui.thickness)
        .attr('stroke-width', 2  * _.ui.thickness)

      // Adjust value and handle.
      self._widget.getElem(_.dom.value, duration)
        .attr('x2', _.scale.scale(_.internal.value) + 0.5)
        .attr('stroke', _.ui.color)
        .attr('stroke-width', _.ui.thickness)
      self._widget.getElem(_.dom.handle, duration)
        .attr('cx', _.scale.scale(_.internal.value) + 0.5)
        .attr('r', 1.1 * _.ui.thickness)
        .attr('stroke', _.ui.trackColor)

      // Adjust axis.
      self._bottomAxis.margin({ bottom: marginTop - self._widget.margins.bottom - _.ui.thickness / 2 })
    }
  }

  // Extend widget update.
  self._widget.update = extend(self._widget.update, _.update, true)

  // Public API.
  api = Object.assign(api, {
    /**
     * Binds a callback to the slider. Note that this  is called every time the handle is dragged (you may want to debounce it).
     *
     * @method callback
     * @methodOf Slider
     * @param {Function} callback Callback to bind when the handle is dragged. The current value is passed as parameter.
     * @returns {Slider} Reference to the Slider API.
     * @example
     *
     * // Print current value to console.
     * const slider = dalian.Slider('my-control')
     *   .callback(console.log)
     *   .render()
     *
     * // Remove callback.
     * slider.callback()
     *   .render()
     */
    callback (callback) {
      _.internal.callback = callback
      return api
    },

    /**
     * Sets the color of the active handle and value track of the slider.
     *
     * @method color
     * @methodOf Slider
     * @param {string} [color = grey] Color to set.
     * @returns {Slider} Reference to the Slider API.
     * @example
     *
     * // Set slider color.
     * const slider = dalian.Slider('my-control')
     *   .color('royalblue')
     *   .render()
     *
     * // Reset color to default.
     * slider.color()
     *   .render()
     */
    color (color = DEFAULTS.color) {
      _.ui.color = color
      return api
    },

    /**
     * Sets the format of the slider ticks.
     *
     * @method format
     * @methodOf Slider
     * @param {Function} format Format to set. The tick value is passed as parameter.
     * @returns {Slider} Reference to the Slider API.
     * @example
     *
     * // Set format to percentages.
     * const slider = dalian.Slider('my-control')
     *   .format(x => x + '%')
     *
     * // Reset format to raw tick value.
     * slider.format()
     *   .render()
     */
    format (format) {
      self._bottomAxis.format(format)
      return api
    },

    /**
     * Sets the maximum of the slider.
     *
     * @method max
     * @methodOf Slider
     * @param {number} [value = 1] Maximum value to set.
     * @returns {Slider} Reference to the Slider API.
     * @example
     *
     * // Set the maximum value.
     * const slider = dalian.Slider('my-control')
     *   .max(2)
     *   .render()
     *
     * // Reset max to 1.
     * slider.max()
     *   .render()
     */
    max (value = DEFAULTS.max) {
      _.ui.max = value
      return api
    },

    /**
     * Sets the minimum value of the slider.
     *
     * @method min
     * @methodOf Slider
     * @param {number} [value = 0] Minimum value to set.
     * @returns {Slider} Reference to the Slider API.
     * @example
     *
     * // Set the minimum value.
     * const slider = dalian.Slider('my-control')
     *   .min(-3)
     *   .render()
     *
     * // Reset min to 0.
     * slider.min()
     *   .render()
     */
    min (value = DEFAULTS.min) {
      _.ui.min = value
      return api
    },

    /**
     * Sets the step size for the slider. If it is set to 0, the slider can take continuous values.
     *
     * @method step
     * @methodOf Slider
     * @param {number} [value = 0] Step size to set. Only the absolute value of the provided number is considered.
     * @returns {Slider} Reference to the Slider API.
     * @example
     *
     * // Set step size to 0.1.
     * const slider = dalian.Slider('my-control')
     *   .step(0.1)
     *   .render()
     *
     * // Reset step size to 0.
     * slider.step()
     *   .render()
     */
    step (value = DEFAULTS.step) {
      _.ui.step = Math.abs(value)
      return api
    },

    /**
     * Sets the slider thickness in pixels.
     *
     * @method thickness
     * @methodOf Slider
     * @param {number} [thickness = 8] Thickness to set.
     * @returns {Slider} Reference to the Slider API.
     * @example
     *
     * // Set thickness to 10px.
     * const slider = dalian.Slider('my-control')
     *   .thickness(10)
     *   .render()
     *
     * // Reset thickness to default.
     * slider.thickness()
     *   .render()
     */
    thickness (thickness = DEFAULTS.thickness) {
      _.ui.thickness = thickness
      return api
    },

    /**
     * Sets the slider's track color.
     *
     * @method trackColor
     * @methodOf Slider
     * @param {string} [color = #ddd] Color to set.
     * @returns {Slider} Reference to the Slider API.
     * @example
     *
     * // Set track color to white.
     * const slider = dalian.Slider('my-control')
     *   .trackColor('#fff')
     *   .render()
     *
     * // Reset track color.
     * slider.trackColor()
     *   .render()
     */
    trackColor (color = DEFAULTS.trackColor) {
      _.ui.trackColor = color
      return api
    },

    /**
     * Sets the slider's value. Note that this method does not invoke the callback, merely positions the handle.
     *
     * @method value
     * @methodOf Slider
     * @param {number} [value = 0] Value to set handle to. If it is not specified, no change is taking place.
     * @returns {Slider} Reference to the Slider API.
     * @example
     *
     * // Set value to 0.7.
     * const slider = dalian.Slider('my-control')
     *   .value(0.7)
     *   .render()
     */
    value (value) {
      if (typeof value !== 'undefined') {
        _.internal.value = value
      }
      return api
    }
  })

  // Adjust axis.
  self._bottomAxis.hideAxisLine(true)
    .hideTicks(true)

  return api
}
