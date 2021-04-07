import compose from '../core/compose'
import Widget from '../components/widget'
import Font from '../components/font'
import {lighter} from '../utils/color'
import extend from '../core/extend'
import {injectClass} from '../utils/style-injector'

const TAG = 'dalian-switch-'
const CLASSES = {
  wrapper: TAG + 'wrapper',
  label: TAG + 'label',
  box: TAG + 'box',
  slider: TAG + 'slider'
}

// Default values.
const DEFAULTS = {
  on: false,
  color: 'grey',
  disabled: false,
  label: ''
}

/**
 * The toggle switch control widget. Inherits all API from the [Widget]{@link ../components/widget.html} component. The switch is constrained to a rectangle defined by the width/height and the margins. By default the switch is positioned on the top left corner of its bounding box and can be adjusted by the margins. The label is bounded by the inner width (widget width minus the side margins).
 *
 * @function Switch
 * @param {string} name Name of the widget. Should be a unique identifier.
 * @param {string} [parent = body] See [Widget]{@link ../components/widget.html} for description.
 */
export default (name, parent = 'body') => {
  // Inject classes.
  injectClass(CLASSES.wrapper, {
    display: 'inline-block',
    position: 'relative',
    'user-select': 'none'
  })
  injectClass(CLASSES.label, {
    position: 'absolute',
    top: '.1em',
    'margin-left': '3.2em',
    'line-height': '17px'
  })
  injectClass(CLASSES.box, {
    width: '32px',
    height: '20px',
    'border-radius': '32px'
  })
  injectClass(CLASSES.slider, {
    position: 'absolute',
    width: '16px',
    height: '16px',
    top: '2px',
    left: '2px',
    'border-radius': '50%',
    background: '#fff'
  })

  // Build widget.
  let { self, api } = compose(
    Widget('switch', name, parent, 'div'),
    Font
  )

  // Private members.
  const _ = {
    // Internal variables.
    i: Object.assign({}, DEFAULTS),

    // TODO Move this outside.
    // DOM.
    dom: (() => {
      // Container.
      const container = self._widget.content.append('div')
        .attr('class', 'container')

      // Wrapper.
      const wrapper = container.append('div')
        .attr('class', CLASSES.wrapper)

      // Label.
      const label = wrapper.append('div')
        .attr('class', CLASSES.label)
        .on('click', onSwitch)

      // Box and slider.
      const box = wrapper.append('div')
        .attr('class', CLASSES.box)
        .on('click', onSwitch)
      const slider = box.append('div')
        .attr('class', CLASSES.slider)

      return {
        container,
        wrapper,
        label,
        box,
        slider
      }
    })()
  }

  // Private methods.
  // TODO Docstring.
  function onSwitch () {
    // Update switch status.
    _.i.on = !_.i.on

    // Update box and slider.
    _.dom.box.transition().duration(300)
      .style('background', _.i.on ? _.i.color : lighter(_.i.color, 0.6))
    _.dom.slider.transition().duration(300)
      .style('left', _.i.on ? '14px' : '2px')

    // Trigger callback.
    _.i.callback && _.i.callback(_.i.on)
  }

  // Extend widget update.
  self._widget.update = extend(self._widget.update, duration => {
    // Adjust container.
    self._widget.getElem(_.dom.container, duration)
      .style('width', self._widget.size.width)
      .style('height', self._widget.size.height)

    // Adjust wrapper.
    self._widget.getElem(_.dom.wrapper, duration)
      .style('margin-left', self._widget.margins.left + 'px')
      .style('margin-top', self._widget.margins.top + 'px')
      .style('width', self._widget.size.innerWidth)
      .style('opacity', _.i.disabled ? 0.4 : 1)
      .style('cursor', _.i.disabled ? 'default' : 'pointer')
      .style('pointer-events', _.i.disabled ? 'none' : 'all')

    // Adjust label.
    _.dom.label.text(_.i.label)

    // TODO Resize switch based on font size.
    // Adjust box.
    self._widget.getElem(_.dom.box, duration)
      .style('background', _.i.on ? _.i.color : lighter(_.i.color, 0.6))

    // TODO Move slider.
    self._widget.getElem(_.dom.slider, duration)
      .style('left', _.i.on ? '14px' : '2px')
  }, true)

  api = Object.assign(api, {
    /**
     * Binds a callback to the switch.
     *
     * @method callback
     * @memberOf Switch
     * @param {Function} callback Function to call when the switch is toggled. The switch status is passed to the method as parameter.
     * @returns {Switch} Reference to the Switch API.
     * @example
     *
     * // Bind method to switch.
     * const switchBtn = dalian.Switch('my-control')
     *   .callback(console.log)
     *   .render()
     *
     * // Remove callback.
     * switchBtn.callback()
     *   .render()
     */
    callback (callback) {
      _.i.callback = callback
      return api
    },

    /**
     * Toggles the switch.
     *
     * @method toggle
     * @memberOf Switch
     * @param {boolean} on Whether to toggle the switch on or off.
     * @returns {Switch} Reference to the Switch API.
     * @example
     *
     * // Set the switch on.
     * const switchBtn = dalian.Switch('my-control')
     *   .toggle(true)
     *   .render()
     *
     * // Uncheck the box.
     * switchBtn.toggle(false)
     *   .render()
     */
    toggle (on = DEFAULTS.on) {
      _.i.on = on
      return api
    },

    /**
     * Sets the switch color.
     *
     * @method color
     * @memberOf switchBtn
     * @param {string} [color = grey] Color to set.
     * @returns {Switch} Reference to the Switch API.
     * @example
     *
     * // Set color.
     * const switchBtn = dalian.Checkbox('my-control')
     *   .color('yellowgreen')
     *   .render()
     *
     * // Reset color.
     * switchBtn.color()
     *   .render()
     */
    color (color = DEFAULTS.color) {
      _.i.color = color
      return api
    },

    /**
     * Disables/enables the switch. If disabled, the switch cannot be interacted with.
     *
     * @method disable
     * @memberOf Checkbox
     * @param {boolean} [on = false] Whether to disable the switch or not.
     * @returns {Switch} Reference to the Switch API.
     * @example
     *
     * // Disable switch.
     * const switchBtn = dalian.Switch('my-control')
     *   .disable(true)
     *   .render()
     *
     * // Enable switch.
     * switchBtn.disable()
     *   .render()
     */
    disable (on = DEFAULTS.disabled) {
      _.i.disabled = on
      return api
    },

    /**
     * Sets the switch label.
     *
     * @method label
     * @memberOf Switch
     * @param {string} [text = ''] Label text.
     * @returns {Switch} Reference to the Switch API.
     * @example
     *
     * // Set switch label.
     * const switchBtn = dalian.Switch('my-control')
     *   .label('Check me!')
     *   .render()
     *
     * // Reset label.
     * switchBtn.label()
     *   .render()
     */
    label (text = DEFAULTS.label) {
      _.i.label = text
      return api
    }
  })

  return api
}