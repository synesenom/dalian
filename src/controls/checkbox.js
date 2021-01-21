import compose from '../core/compose'
import Widget from '../components/widget'
import Font from '../components/font'
import extend from '../core/extend'
import {lighter} from '../utils/color'
import StyleInjector from '../utils/style-injector'

// Classes.
const TAG = 'dalian-checkbox-'
const CLASSES = {
  wrapper: TAG + 'wrapper',
  label: TAG + 'label',
  box: TAG + 'box',
  mark: TAG + 'mark'
}

// TODO Highlight checkbox if hovered.

/**
 * The checkbox control widget. Inherits all API from the [Widget]{@link ../components/widget.html} component. The checkbox is constrained to a rectangle defined by the width/height and the margins. By default the checkbox is positioned on the top left corner of its bounding box and can be adjusted by the margins. The label is bounded by the inner width (widget width minus the side margins).
 *
 * @function Checkbox
 * @param {string} name Name of the widget. Should be a unique identifier.
 * @param {string} [parent = body] See [Widget]{@link ../components/widget.html} for description.
 */
export default (name, parent = 'body') => {
  // Inject relevant style.
  StyleInjector.addClass(CLASSES.wrapper, {
    display: 'inline-block',
    position: 'relative',
    'user-select': 'none'
  }).addClass(CLASSES.label, {
    position: 'absolute',
    top: '0.1em',
    'margin-left': '2em',
    'line-height': '1.35em'
  }).addClass(CLASSES.box, {
    width: '1.35em',
    height: '1.35em'
  }).addClass(CLASSES.mark, {
    position: 'absolute',
    left: '.45em',
    top: '.15em',
    width: '.3em',
    height: '.7em',
    border: 'solid white',
    transform: 'rotate(45deg)',
    'border-width': '0 .15em .15em 0'
  })

  // Default values.
  const DEFAULTS = {
    checked: false,
    color: 'grey',
    disabled: false,
    label: ''
  }

  // Build widget from components.
  let { self, api } = compose(
    Widget('checkbox', name, parent, 'div'),
    Font
  )

  function onClick () {
    // Update checked status.
    _.i.checked = !_.i.checked

    // TODO Make separate method to update checkbox.
    _.dom.box.style('background', _.i.checked ? _.i.color
      : lighter(_.i.color, 0.6))
    _.dom.mark.style('display', _.i.checked ? null : 'none')

    // Trigger callback.
    _.i.callback && _.i.callback(_.i.checked)
  }

  // Private members.
  const _ = {
    // Internal variables.
    i: Object.assign({}, DEFAULTS),

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
        .on('click', onClick)

      // Box and mark.
      const box = wrapper.append('div')
        .attr('class', CLASSES.box)
        .on('click', onClick)
      const mark = box.append('div')
        .attr('class', CLASSES.mark)

      return {
        container,
        wrapper,
        label,
        box,
        mark
      }
    })(),

    update (duration) {
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

      // Adjust box.
      self._widget.getElem(_.dom.box, duration)
        .style('background', _.i.checked ? _.i.color : lighter(_.i.color, 0.6))

      // Adjust mark.
      _.dom.mark.style('display', _.i.checked ? null : 'none')
    }
  }

  // Extend widget update.
  self._widget.update = extend(self._widget.update, _.update, true)

  api = Object.assign(api, {
    /**
     * Binds a callback to the checkbox.
     *
     * @method callback
     * @methodOf Checkbox
     * @param {Function} callback Function to call when the checkbox is checked/unchecked. The checked status is passed to the method as parameter.
     * @returns {Checkbox} Reference to the Checkbox API.
     * @example
     *
     * // Bind method to checkbox.
     * const checkbox = dalian.Checkbox('my-control')
     *   .callback(console.log)
     *   .render()
     *
     * // Remove callback.
     * checkbox.callback()
     *   .render()
     */
    callback (callback) {
      _.i.callback = callback
      return api
    },

    /**
     * Checks/unchecks the checkbox.
     *
     * @method check
     * @methodOf Checkbox
     * @param {boolean} on Whether to check the box.
     * @returns {Checkbox} Reference to the Checkbox API.
     * @example
     *
     * // Set the box checked.
     * const checkbox = dalian.Checkbox('my-control')
     *   .check(true)
     *   .render()
     *
     * // Uncheck the box.
     * checkbox.check(false)
     *   .render()
     */
    check (on = DEFAULTS.checked) {
      _.i.checked = on
      return api
    },

    /**
     * Sets the checkbox color.
     *
     * @method color
     * @methodOf Checkbox
     * @param {string} [color = grey] Color to set.
     * @returns {Checkbox} Reference to the Checkbox API.
     * @example
     *
     * // Set color.
     * const checkbox = dalian.Checkbox('my-control')
     *   .color('yellowgreen')
     *   .render()
     *
     * // Reset color.
     * checkbox.color()
     *   .render()
     */
    color (color = DEFAULTS.color) {
      _.i.color = color
      return api
    },

    /**
     * Disables/enables the checkbox. If disabled, the checkbox cannot be interacted with.
     *
     * @method disable
     * @methodOf Checkbox
     * @param {boolean} [on = false] Whether to disable the checkbox or not.
     * @returns {Checkbox} Reference to the Checkbox API.
     * @example
     *
     * // Disable checkbox.
     * const checkbox = dalian.Checkbox('my-control')
     *   .disable(true)
     *   .render()
     *
     * // Enable checkbox.
     * checkbox.disable()
     *   .render()
     */
    disable (on = DEFAULTS.disabled) {
      _.i.disabled = on
      return api
    },

    /**
     * Sets the checkbox label.
     *
     * @method label
     * @methodOf Checkbox
     * @param {string} [text = ''] Label text.
     * @returns {Checkbox} Reference to the Checkbox API.
     * @example
     *
     * // Set checkbox label.
     * const checkbox = dalian.Checkbox('my-control')
     *   .label('Check me!')
     *   .render()
     *
     * // Reset label.
     * checkbox.label()
     *   .render()
     */
    label (text = DEFAULTS.label) {
      _.i.label = text
      return api
    }
  })

  return api
}
