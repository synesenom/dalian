import { mouse, select } from 'd3'
import styles from '../utils/styles'
import fontMetrics from '../utils/font-metrics'

/**
 * Component implementing a generic widget. A widget is the most abstract element of the library and most of the charts
 * or control elements are inherited from this component.
 *
 * @function Widget
 */
export default (type, name, parent, elem) => {
  // Default values.
  const DEFAULTS = {
    pos: {
      x: 0,
      y: 0
    },

    size: {
      width: 300,
      height: 200
    },

    margins: 0
  }

  // Private members
  const _ = {
    parent: select(parent),
    initialized: false,
    pos: {
      x: {
        attr: 'left',
        ignore: 'right',
        value: DEFAULTS.pos.x + 'px'
      },
      y: {
        attr: 'top',
        ignore: 'bottom',
        value: DEFAULTS.pos.y + 'px'
      }
    }
  }

  // Protected members
  const self = {}
  self._widget = {
    // Variables
    id: `dalian-widget-${type}-${name}`,
    container: undefined,
    size: {
      width: DEFAULTS.size.width + 'px',
      height: DEFAULTS.size.height + 'px',
      innerWidth: DEFAULTS.size.width + 'px',
      innerHeight: DEFAULTS.size.height + 'px'
    },
    margins: {
      left: DEFAULTS.margins,
      right: DEFAULTS.margins,
      top: DEFAULTS.margins,
      bottom: DEFAULTS.margins
    },
    transition: false,
    disabled: false,

    // Methods
    getMouse: () => {
      const m = mouse(self._widget.container.node())
      return [m[0] - self._widget.margins.left, m[1] - self._widget.margins.top]
    },

    getElem: (elem, duration) => {
      if (_.initialized) {
        return elem.transition().duration(duration)
      } else {
        setTimeout(() => {
          _.initialized = true
        }, duration)
        return elem
      }
    },

    getDefs() {
      if (typeof _.defs === 'undefined') {
        _.defs = self._widget.content.append('defs')
      }
      return _.defs
    },

    /**
     * @deprecated Use {@link getFontMetrics}
     */
    getStyle: () => window.getComputedStyle(self._widget.container.node()),

    getFontMetrics: () => fontMetrics(window.getComputedStyle(self._widget.container.node()).fontFamily),

    update: duration => {
      // Update container and content.
      self._widget.getElem(self._widget.container, duration)
        .style(_.pos.x.ignore, null)
        .style(_.pos.x.attr, _.pos.x.value)
        .style(_.pos.y.ignore, null)
        .style(_.pos.y.attr, _.pos.y.value)
        .style('width', self._widget.size.width)
        .style('height', self._widget.size.height)
    },

    disable: on => {
      self._widget.disabled = on
    }
  }

  try {
    // Add widget container
    self._widget.container = _.parent.append('div')
      .attr('id', self._widget.id)
      .attr('class', `dalian-widget dalian-widget-${type}`)
    styles(self._widget.container, {
      position: 'absolute',
      width: self._widget.size.width,
      height: self._widget.size.height,
      left: _.pos.x + 'px',
      top: _.pos.y + 'px',
      'font-family': 'inherit',
      'font-size': 'inherit',
      'font-color': 'inherit'
    })

    // Add widget content element
    self._widget.content = self._widget.container.append(elem)
      .attr('class', 'dalian-widget-content')
    styles(self._widget.content, {
      position: 'absolute',
      width: '100%',
      height: '100%',
      left: 0,
      top: 0,
      'font-family': 'inherit',
      'font-size': 'inherit',
      'font-color': 'inherit',
      'pointer-events': 'none'
    })
  } catch (e) {
    throw Error('MissingDOMException: DOM is not present.')
  }

  // Public API
  const api = {
    /**
     * Sets the X coordinate of the widget in pixels relative to its parent. If negative, the widget's right side is
     * measured from the right side of the parent, otherwise its left side is measured from the parent's left side.
     *
     * @method x
     * @methodOf Widget
     * @param {number} [value = 0] Value of the X coordinate in pixels.
     * @returns {Widget} Reference to the Widget's API.
     */
    x: (value = DEFAULTS.pos.x) => {
      _.pos.x.attr = value >= 0 ? 'left' : 'right'
      _.pos.x.ignore = value >= 0 ? 'right' : 'left'
      _.pos.x.value = Math.abs(value) + 'px'
      return api
    },

    /**
     * Sets the Y coordinate of the widget in pixels relative to its parent, with a top-down direction. If negative, the
     * widget's bottom side is measured from the bottom of the parent, otherwise the top side is measured from the
     * parent's top.
     *
     * @method y
     * @methodOf Widget
     * @param {number} [value = 0] Value of the Y coordinate in pixels.
     * @returns {Widget} Reference to the Widget's API.
     */
    y: (value = DEFAULTS.pos.y) => {
      _.pos.y.attr = value >= 0 ? 'top' : 'bottom'
      _.pos.y.ignore = value >= 0 ? 'bottom' : 'top'
      _.pos.y.value = Math.abs(value) + 'px'
      return api
    },

    /**
     * Sets the width of the widget in pixels (including it's margins).
     *
     * @method width
     * @methodOf Widget
     * @param {number} [value = 300] Width value in pixels.
     * @returns {Widget} Reference to the Widget's API.
     */
    width: (value = DEFAULTS.size.width) => {
      self._widget.size.width = value + 'px'
      self._widget.size.innerWidth = (value - self._widget.margins.left - self._widget.margins.right) + 'px'
      return api
    },

    /**
     * Sets the height of the widget in pixels (including it's margins).
     *
     * @method height
     * @methodOf Widget
     * @param {number} [value = 200] Height value in pixels.
     * @returns {Widget} Reference to the Widget's API.
     */
    height: (value = DEFAULTS.size.height) => {
      self._widget.size.height = value + 'px'
      self._widget.size.innerHeight = (value - self._widget.margins.top - self._widget.margins.bottom) + 'px'
      return api
    },

    /**
     * Sets widget margins in pixels. Margins are included in width and height and thus effectively shrink the plotting
     * area.
     *
     * @method margins
     * @methodOf Widget
     * @param {(number | Object)} [margins = 0] A single number to set all sides to or an object specifying some of the
     * sides.
     * @returns {Widget} Reference to the Widget's API.
     */
    margins: (margins = DEFAULTS.margins) => {
      switch (typeof margins) {
        case 'undefined':
        default:
          self._widget.margins = {
            left: 0,
            right: 0,
            top: 0,
            bottom: 0
          }
          break
        case 'number':
          // Single value for each side
          self._widget.margins = {
            left: margins,
            right: margins,
            top: margins,
            bottom: margins
          }
          break
        case 'object':
          // Update specified values
          self._widget.margins = Object.assign(self._widget.margins, margins)
          break
      }

      // Update inner size
      self._widget.size.innerWidth = (parseInt(self._widget.size.width) -
        self._widget.margins.left - self._widget.margins.right) + 'px'
      self._widget.size.innerHeight = (parseInt(self._widget.size.height) -
        self._widget.margins.top - self._widget.margins.bottom) + 'px'
      return api
    },

    /**
     * Renders and updates the widget. After any change to the widget, the render method should be called.
     *
     * @method render
     * @methodOf Widget
     * @param {number?} duration Duration of the rendering animation in ms. If not specified, the rendering does not
     * involve animations.
     * @returns {Widget} Reference to the Widget's API.
     */
    render: duration => {
      self._widget.update(duration)
      return api
    }
  }

  return { self, api }
}
