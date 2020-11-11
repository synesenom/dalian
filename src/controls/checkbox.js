import compose from '../core/compose'
import Widget from '../components/widget'
import Font from '../components/font'
import extend from '../core/extend'
import {lighter} from '../utils/color'
import StyleInjector from '../utils/style-injector'

// Classes.
const TAG = 'dalian-checkbox-'
const CLASSES = {
  container: TAG + 'container',
  wrapper: TAG + 'wrapper',
  label: TAG + 'label',
  box: TAG + 'box',
  mark: TAG + 'mark'
}

// TODO Move style to head.
/**
 * The checkbox control widget. Inherits all API from the [Widget]{@link ../components/widget.html} component. The checkbox is constrained to a rectangle defined by the width/height and the margins. It is vertically centered.
 *
 * @function Checkbox
 * @param {string} name Name of the widget. Should be a unique identifier.
 * @param {string} [parent = body] See [Widget]{@link ../components/widget.html} for description.
 */
export default (name, parent = 'body') => {
  // Inject relevant style.
  StyleInjector.addClass(CLASSES.container, {
    display: 'table-cell',
    'vertical-align': 'middle'
  }).addClass(CLASSES.wrapper, {
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
    _.internal.checked = !_.internal.checked

    // TODO Make separate method to update checkbox.
    _.dom.box.style('background', _.internal.checked ? _.internal.color : lighter(_.internal.color, 0.6))
    _.dom.mark.style('display', _.internal.checked ? null : 'none')

    // Trigger callback.
    _.internal.callback && _.internal.callback(_.internal.checked)
  }

  // Private members.
  const _ = {
    // Internal variables.
    internal: Object.assign({}, DEFAULTS),

    // DOM.
    dom: (() => {
      // Container.
      const container = self._widget.content.append('div')
        .attr('class', CLASSES.container)

      // Label.
      const wrapper = container.append('div')
        .attr('class', CLASSES.wrapper)

      // Label text.
      const label = wrapper.append('div')
        .attr('class', CLASSES.label)
        .on('click', onClick)

      // Checkmark.
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

      // Adjust label.
      self._widget.getElem(_.dom.wrapper, duration)
        .style('margin-left', self._widget.margins.left + 'px')
        .style('width', self._widget.size.innerWidth)
        .style('opacity', _.internal.disabled ? 0.4 : 1)

      // Adjust text.
      _.dom.label.text(_.internal.label)
        .style('cursor', _.internal.disabled ? 'default' : 'pointer')
        .style('pointer-events', _.internal.disabled ? 'none' : 'all')

      // Adjust box.
      self._widget.getElem(_.dom.box, duration)
        .style('background', _.internal.checked ? _.internal.color : lighter(_.internal.color, 0.6))
        .style('cursor', _.internal.disabled ? 'default' : 'pointer')
        .style('pointer-events', _.internal.disabled ? 'none' : 'all')

      // Adjust mark.
      _.dom.mark.style('display', _.internal.checked ? null : 'none')
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
      _.internal.callback = callback
      return api
    },

    /**
     * Checks/unchecks the checkbox.
     *
     * @method checked
     * @methodOf Checkbox
     * @param {boolean} on Whether to check the box.
     * @returns {Checkbox} Reference to the Checkbox API.
     * @example
     *
     * // Set the box checked.
     * const checkbox = dalian.Checkbox('my-control')
     *   .checked(true)
     *   .render()
     *
     * // Uncheck the box.
     * checkbox.checked(false)
     *   .render()
     */
    checked (on = DEFAULTS.checked) {
      _.internal.checked = on
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
      _.internal.color = color
      return api
    },

    /**
     * Disables/enables the checkbox. If disabled, the checkbox cannot be interacted with.
     *
     * @method disabled
     * @methodOf Checkbox
     * @param {boolean} [on = false] Whether to disable the checkbox or not.
     * @returns {Checkbox} Reference to the Checkbox API.
     * @example
     *
     * // Disable checkbox.
     * const checkbox = dalian.Checkbox('my-control')
     *   .disabled(true)
     *   .render()
     *
     * // Enable checkbox.
     * checkbox.disabled()
     *   .render()
     */
    disabled (on = DEFAULTS.disabled) {
      _.internal.disabled = on
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
      _.internal.label = text
      return api
    }
  })

  return api
}
