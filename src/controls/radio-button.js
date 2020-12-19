import compose from '../core/compose'
import Widget from '../components/widget'
import Font from '../components/font'
import extend from '../core/extend'
import StyleInjector from '../utils/style-injector'
import { lighter } from '../utils/color'

// Classes.
const TAG = 'dalian-radio-button-'
const CLASSES = {
  entry: TAG + 'entry',
  label: TAG + 'label',
  marker: TAG + 'marker'
}
// TODO Highlight checkbox if hovered.

/**
 * The radio button control widget. Inherits all API from the [Widget]{@link ../components/widget.html} component. All the radio buttons are constrained to a rectangle defined by the width/height and the margins. The labels are bounded by the available space (widget width minus the side margins).
 *
 * @function RadioButton
 * @param {string} name Name of the widget. Should be a unique identifier.
 * @param {string} [parent = body] See [Widget]{@link ../components/widget.html} for description.
 */
export default (name, parent = 'body') => {
  // TODO Inject relevant style.
  // TODO Remove container style?
  StyleInjector.addClass(CLASSES.entry, {
    position: 'absolute',
    display: 'block'
  }).addClass(CLASSES.marker, {
    position: 'relative',
    float: 'left',
    display: 'inline-block',
    width: '.5em',
    height: '.5em',
    border: '.4em solid transparent',
    'border-radius': '50%',
    background: '#fff'
  }).addClass(CLASSES.label, {
    display: 'inline-block',
    float: 'right',
    width: 'calc(100% - 1.75em)',
    height: '100%',
    'line-height': '1.35em'
  })

  // Default values.
  const DEFAULTS = {
    checked: false,
    color: 'grey',
    columns: 1,
    disabled: false,
    hSep: null,
    vSep: 2
  }

  // Build widget from components.
  let { self, api } = compose(
    Widget('checkbox', name, parent, 'div'),
    Font
  )

  function onSelect (d) {
    // If selected the same option, do nothing.
    if (_.internal.selected === d) {
      return
    }

    // Update selected status.
    _.internal.selected = d

    _.dom.container.selectAll('.' + CLASSES.entry)
      .select('.' + CLASSES.marker)
      .style('border-color', d => d === _.internal.selected ? _.internal.color : 'transparent')
      .style('background', d => d === _.internal.selected ? '#fff' : lighter(_.internal.color, 0.6))

    // Trigger callback.
    _.internal.callback && _.internal.callback(_.internal.selected)
  }

  // Private members.
  const _ = {
    // Internal variables.
    internal: Object.assign({
      entries: [],
      rows: 1
    }, DEFAULTS),

    // DOM.
    dom: (() => {
      // Container.
      const container = self._widget.content.append('div')

      return {
        container
      }
    })(),

    entryWidth () {
      if (_.internal.hSep === null || _.internal.columns === 1)  {
        return parseFloat(self._widget.size.innerWidth) / _.internal.columns + 'px'
      } else {
        return parseFloat(self._font.size) * _.internal.hSep + 'px'
      }
    },

    entryHeight () {
      return parseFloat(self._font.size) * _.internal.vSep + 'px'
    },

    entryLeft (d, i) {
      const xi = i % _.internal.columns
      if (_.internal.hSep === null) {
        return `${parseFloat(self._widget.margins.left) + xi * parseFloat(self._widget.size.innerWidth) / _.internal.columns}px`
      }
      return `${parseFloat(self._widget.margins.left) + xi * parseFloat(self._font.size) * _.internal.hSep}px`
    },

    entryTop (d, i) {
      return `${parseFloat(self._widget.margins.top) + Math.floor(i / _.internal.columns)  * parseFloat(self._font.size) * _.internal.vSep}px`
    },

    update (duration) {
      // Adjust container.
      self._widget.getElem(_.dom.container, duration)
        .style('width', self._widget.size.width)
        .style('height', self._widget.size.height)

      // Widget transitions.
      const t = _.dom.container.transition().duration(duration)

      _.dom.container.selectAll('.' + CLASSES.entry)
        .data(_.internal.entries, d => d)
        .join(
          // Entering entries.
          enter => {
            const entry = enter.append('div')
              .attr('class', CLASSES.entry)
              .style('width', _.entryWidth)
              .style('height', _.entryHeight)
              .style('left', _.entryLeft)
              .style('top', _.entryTop)
              .style('cursor', _.internal.disabled ? 'default' : 'pointer')
              .style('pointer-events', _.internal.disabled ? 'none' : 'all')
              .style('opacity', _.internal.disabled ? 0.4 : 1)
              .on('click', onSelect)

            // Marker
            entry.append('div')
              .attr('class', CLASSES.marker)
              .style('border-color', d => d === _.internal.selected ? _.internal.color : 'transparent')
              .style('background', d => d === _.internal.selected ? '#fff' : lighter(_.internal.color, 0.6))

            // Label.
            entry.append('div')
              .attr('class', CLASSES.label)
              .text(d => d)

            return entry
          },

          // Updated entries.
          update => {
            // Update entry
            update.style('cursor', _.internal.disabled ? 'default' : 'pointer')
              .style('pointer-events', _.internal.disabled ? 'none' : 'all')
              .style('opacity', _.internal.disabled ? 0.4 : 1)
              .call(elem => elem.transition(t)
                .style('width', _.entryWidth)
                .style('height', _.entryHeight)
                .style('left', _.entryLeft)
                .style('top', _.entryTop)
              )

            // Update marker.
            update.transition(t)
              .select('.' + CLASSES.marker)
              .style('border-color', d => d === _.internal.selected ? _.internal.color : 'transparent')
              .style('background', d => d === _.internal.selected ? '#fff' : lighter(_.internal.color, 0.6))

            return update
          },

          // Exiting entries.
          exit => exit.transition(t)
            .style('opacity', 0)
            .remove()
        )
    }
  }

  self._widget.update = extend(self._widget.update, _.update, true)

  api = Object.assign(api, {
    /**
     * Binds a callback to the radio buttons.
     *
     * @method callback
     * @methodOf RadioButton
     * @param {Function} callback Function to call when a radio button is selected. The label of the radio button is passed to the method as parameter.
     * @returns {RadioButton} Reference to the RadioButton API.
     * @example
     *
     * // Bind method to the buttons.
     * const radio = dalian.RadioButton('my-control')
     *   .callback(console.log)
     *   .render()
     *
     * // Remove callback.
     * radio.callback()
     *   .render()
     */
    callback (callback) {
      _.internal.callback = callback
      return api
    },

    /**
     * Sets the radio button color.
     *
     * @method color
     * @methodOf RadioButton
     * @param {string} [color = grey] Color to set.
     * @returns {RadioButton} Reference to the RadioButton API.
     * @example
     *
     * // Set color.
     * const radio = dalian.RadioButton('my-control')
     *   .color('yellowgreen')
     *   .render()
     *
     * // Reset color.
     * radio.color()
     *   .render()
     */
    color (color = DEFAULTS.color) {
      _.internal.color = color
      return api
    },

    /**
     * Sets the number of columns for the radio buttons.
     *
     * @method columns
     * @methodOf RadioButton
     * @param {number} [columns = 1] Number of columns to set.
     * @returns {RadioButton} Reference to the RadioButton API.
     * @example
     *
     * // Set columns to 2.
     * const radio = dalian.RadioButton('my-control')
     *   .columns(2)
     *   .render()
     *
     * // Reset to single column.
     * radio.columns()
     *   .render()
     */
    columns (columns = DEFAULTS.columns) {
      _.internal.columns = columns
      _.internal.rows = Math.ceil(_.internal.entries.length / columns)
      return api
    },

    /**
     * Disables/enables the radio buttons. If disabled, the buttons cannot be interacted with.
     *
     * @method disable
     * @methodOf RadioButton
     * @param {boolean} [on = false] Whether to disable the buttons or not.
     * @returns {RadioButton} Reference to the RadioButton API.
     * @example
     *
     * // Disable buttons.
     * const radio = dalian.RadioButton('my-control')
     *   .disable(true)
     *   .render()
     *
     * // Enable buttons.
     * radio.disable()
     *   .render()
     */
    disable (on = DEFAULTS.disabled) {
      _.internal.disabled = on
      return api
    },

    /**
     * Sets the entries for the radio buttons. Note that the entry values are used as the labels as well.
     *
     * @method entries
     * @methodOf RadioButton
     * @param {string[]} [labels = []] Array of entries representing the radio buttons.
     * @returns {RadioButton} Reference to the RadioButton API.
     * @example
     *
     * // Set entries.
     * const radio = dalian.RadioButton('my-control')
     *   .entries(['A', 'B', 'C'])
     *   .render()
     *
     * // Update entries.
     * radio.entries(['D', 'E'])
     *   .render()
     */
    entries (labels = []) {
      _.internal.entries = labels
      _.internal.rows = Math.ceil(labels.length / _.internal.columns)
      return api
    },

    /**
     * Sets the horizontal separation between the buttons. The separation is measured between the center of the radio markers and the labels fill the available space defined by the widget width and the margins. If it  is set to null or undefined, the columns are positioned uniformly horizontally.
     *
     * @method hSep
     * @methodOf RadioButton
     * @param {(number|null)} [length = 0] Size of the horizontal separation in units of the current font size.
     * @returns {RadioButton} Reference to the RadioButton API.
     * @example
     *
     * // Set horizontal separation to 2 em.
     * const radio = dalian.RadioButton('my-control')
     *   .hSep(2)
     *   .render()
     *
     * // Reset horizontal separation to 0.
     * radio.hSep()
     *   .render()
     */
    hSep (length = DEFAULTS.hSep) {
      _.internal.hSep = typeof length === 'number' ? length : null
      return api
    },

    /**
     * Selects a radio button or removes selection from all buttons. Note that this method does not trigger the callback, only updates the buttons.
     *
     * @method select
     * @methodOf RadioButton
     * @param {string} entry Radio button to select. If an invalid entry is passed, none of the buttons are selected.
     * @returns {RadioButton} Reference to the RadioButton API.
     * @example
     *
     * // Select the second button.
     * const radio = dalian.RadioButton('my-control')
     *   .entries(['25%', '50%', '75%', '100%'])
     *   .select('50%')
     *   .render()
     *
     * // Remove selection.
     * radio.select()
     *   .render()
     */
    select (entry) {
      // Make selection and update buttons if entry is a valid one.
      if (_.internal.entries.indexOf(entry) > -1) {
        _.internal.selected = entry
      } else {
        // If it is invalid, unset all radio buttons.
        _.internal.selected = undefined
      }
      return api
    },

    /**
     * Sets the vertical separation between the buttons. The separation is measured between the center of the ratio markers. Note that the entries fill in the space defined by the widget height and the margins.
     *
     * @method vSep
     * @methodOf RadioButton
     * @param {number} [length = 0] Size of the vertical separation in units of the current font size.
     * @returns {RadioButton} Reference to the RadioButton API.
     * @example
     *
     * // Set vertical separation to 2 em.
     * const radio = dalian.RadioButton('my-control')
     *   .vSep(2)
     *   .render()
     *
     * // Reset vertical separation to 0.
     * radio.vSep()
     *   .render()
     */
    vSep (length = DEFAULTS.vSep) {
      _.internal.vSep = length
      return api
    }
  })

  return api
}