import compose from '../core/compose'
import Widget from '../components/widget'
import Font from '../components/font'
import extend from '../core/extend'
import {lighter} from '../utils/color'
import {injectClass} from '../utils/style-injector'

// Classes.
const TAG = 'dalian-checkbox-'
const CLASSES = {
  wrapper: TAG + 'wrapper',
  label: TAG + 'label',
  box: TAG + 'box',
  mark: TAG + 'mark'
}

// Default values.
const DEFAULTS = {
  checked: false,
  color: 'grey',
  disabled: false,
  label: ''
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
  injectClass(CLASSES.wrapper, {
    display: 'inline-block',
    position: 'relative',
    'user-select': 'none'
  })
  injectClass(CLASSES.label, {
    position: 'absolute',
    top: '0.1em',
    'margin-left': '2em',
    'line-height': '1.35em'
  })
  injectClass(CLASSES.box, {
    width: '1.35em',
    height: '1.35em'
  })
  injectClass(CLASSES.mark, {
    position: 'absolute',
    left: '.45em',
    top: '.15em',
    width: '.3em',
    height: '.7em',
    border: 'solid white',
    transform: 'rotate(45deg)',
    'border-width': '0 .15em .15em 0'
  })

  // Build widget.
  let { self, api } = compose(
    Widget('checkbox', name, parent, 'div'),
    Font
  )

  // Private members.
  const container = self._widget.content.append('div')
    .attr('class', 'container')
  const wrapper = container.append('div')
    .attr('class', CLASSES.wrapper)
  const label = wrapper.append('div')
    .attr('class', CLASSES.label)
    .on('click', onClick)
  const box = wrapper.append('div')
    .attr('class', CLASSES.box)
    .on('click', onClick)
  const mark = box.append('div')
    .attr('class', CLASSES.mark)

  // Configurable parameters.
  const _ = Object.assign({}, DEFAULTS)

  // Private members.
  /**
   * Updates checkbox UI according to the current checked status.
   *
   * @method updateUi
   * @memberOf Checkbox
   * @private
   */
  function updateUi () {
    box.style('background', _.checked ? _.color
      : lighter(_.color, 0.6))
    mark.style('display', _.checked ? null : 'none')
  }

  /**
   * Calls the current callback when the checkbox is clicked. Also updates the checkbox UI.
   *
   * @method onClick
   * @memberOf Checkbox
   * @private
   */
  function onClick () {
    // Update checked status and UI.
    _.checked = !_.checked
    updateUi()

    // Trigger callback.
    _.callback && _.callback(_.checked)
  }

  // Extend widget update.
  self._widget.update = extend(self._widget.update, duration => {
    // Adjust container.
    self._widget.getElem(container, duration)
      .style('width', self._widget.size.width)
      .style('height', self._widget.size.height)

    // Adjust wrapper.
    self._widget.getElem(wrapper, duration)
      .style('margin-left', self._widget.margins.left + 'px')
      .style('margin-top', self._widget.margins.top + 'px')
      .style('width', self._widget.size.innerWidth)
      .style('opacity', _.disabled ? 0.4 : 1)
      .style('cursor', _.disabled ? 'default' : 'pointer')
      .style('pointer-events', _.disabled ? 'none' : 'all')

    // Adjust label.
    label.text(_.label)

    // Adjust box.
    self._widget.getElem(box, duration)
      .style('background', _.checked ? _.color : lighter(_.color, 0.6))

    // Adjust mark.
    mark.style('display', _.checked ? null : 'none')
  }, true)

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
      _.callback = callback
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
      _.checked = on
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
      _.color = color
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
      _.disabled = on
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
      _.label = text
      return api
    }
  })

  return api
}
