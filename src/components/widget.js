import { select } from 'd3'

/**
 * The widget factory, implementing a generic widget.
 *
 * @function Widget
 * @param {string} type Widget type. This should be set by the child widget class.
 * @param {string} name The name of the current widget object. This is used as a unique identifier for the widget.
 * @param {string} [parent = body] The parent DOM element that this widget will be added.
 * @param {string} [elem = svg] The HTML tag of the topmost level container for the widget. This should be set by the
 * child widget class.
 * @example
 *
 * // Create an SVG widget and append it to the body as an SVG
 * let chart1 = Widget('fancy-chart-type', 'chart-1')
 *
 * // Create an SVG widget and append it to a div selected by it's id
 * let chart2 = Widget('fancy-chart-type', 'chart-2', '#container')
 *
 * // Create a DIV widget an append it to the first div selected by class
 * let chart3 = Widget('fancy-chart-type', 'chart-3', '.container', 'div')
 *
 */
export default (type, name, parent, elem) => {
  // Private members
  let _ = {
    parent: select(parent),
    pos: {
      x: {
        attr: 'left',
        ignore: 'right',
        value: '0px'
      },
      y: {
        attr: 'top',
        ignore: 'bottom',
        value: '0px'
      }
    }
  }

  // Protected members
  let self = {}
  self._widget = {
    // Variables
    id: `dalian-widget-${type}-${name}`,
    container: undefined,
    size: {
      width: '300px',
      height: '200px',
      innerWidth: '300px',
      innerHeight: '200px'
    },
    margins: {
      left: 0,
      right: 0,
      top: 0,
      bottom: 0
    },
    transition: false,
    disabled: false,

    // Methods
    update: duration => {
      // Update container and content
      self._widget.container
        .transition().duration(duration)
        .style(_.pos.x.ignore, null)
        .style(_.pos.x.attr, _.pos.x.value)
        .style(_.pos.y.ignore, null)
        .style(_.pos.y.attr, _.pos.y.value)
        .style('width', self._widget.size.width)
        .style('height', self._widget.size.height)
        .on('end', () => self._widget.container.style('display', 'block'))
    },

    disable: on => self._widget.disabled = on
  }
  try {
    // Add widget container
    self._widget.container = _.parent
      .append('div')
      .attr('id', self._widget.id)
      .attr('class', `dalian-widget dalian-widget-${type}`)
      .style('display', 'none')
      .style('position', 'absolute')
      .style('width', self._widget.size.width)
      .style('height', self._widget.size.height)
      .style('left', _.pos.x + 'px')
      .style('top', _.pos.y + 'px')
      .style('font-family', 'inherit')
      .style('font-size', 'inherit')
      .style('font-color', 'inherit')

    // Add widget content element
    self._widget.content = self._widget.container.append(elem)
      .attr('id', `${self._widget.id}-content`)
      .attr('class', `dalian-widget-content`)
      .style('position', 'absolute')
      .style('width', '100%')
      .style('height', '100%')
      .style('left', 0)
      .style('top', 0)
      .style('font-family', 'inherit')
      .style('font-size', 'inherit')
      .style('font-color', 'inherit')
      .style('pointer-events', 'none')
  } catch (e) {
    throw Error('MissingDOMException: DOM is not present.')
  }

  // Public API
  let api = {
    /**
     * Sets the X coordinate of the widget. If negative, the widget's right side is measured from the right side of the
     * parent, otherwise it is measured from the left side.
     *
     * @method x
     * @methodOf Widget
     * @param {number} [value = 0] Value of the X coordinate in pixels.
     * @returns {Object} Reference to the Widget API.
     */
    x: (value = 0) => {
      _.pos.x.attr = value >= 0 ? 'left' : 'right'
      _.pos.x.ignore = value >= 0 ? 'right' : 'left'
      _.pos.x.value = Math.abs(value) + 'px'
      return api
    },

    /**
     * Sets the Y coordinate of the widget. If negative, the widget's bottom side is measured from the bottom of the
     * parent, otherwise the top side is measured from the top.
     *
     * @method y
     * @methodOf Widget
     * @param {number} [value = 0] Value of the Y coordinate in pixels.
     * @returns {Object} Reference to the Widget API.
     */
    y: (value = 0) => {
      _.pos.y.attr = value >= 0 ? 'top' : 'bottom'
      _.pos.y.ignore = value >= 0 ? 'bottom' : 'top'
      _.pos.y.value = Math.abs(value) + 'px'
      return api
    },

    /**
     * Sets the width of the widget (including it's margins). Also updates the inner width of the widget.
     *
     * @method width
     * @methodOf Widget
     * @param {number} [value = 300] Width value in pixels.
     * @returns {Object} Reference to the Widget API.
     */
    width: (value = 300) => {
      self._widget.size.width = value + 'px'
      self._widget.size.innerWidth = (value - self._widget.margins.left - self._widget.margins.right) + 'px'
      return api
    },

    /**
     * Sets the height of the widget (including it's margins). Also updates the inner height of the widget.
     *
     * @method height
     * @methodOf Widget
     * @param {number} [value = 200] Height value in pixels.
     * @returns {Object} Reference to the Widget API.
     */
    height: (value = 200) => {
      self._widget.size.height = value + 'px'
      self._widget.size.innerHeight = (value - self._widget.margins.top - self._widget.margins.bottom) + 'px'
      return api
    },

    /**
     * Sets widget margins in pixels. Margins are included in width and height and thus effectively shrink the
     * plotting area.
     *
     * @method margins
     * @methodOf Widget
     * @param {(number | Object)} [margins = 0] A single number to set all sides to or an object specifying some of the
     * sides.
     * @returns {Object} Reference to the Widget API.
     */
    margins: margins => {
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
     * @param {number} [duration = 400] Duration of the rendering animation in ms.
     * @returns {Object} Reference to the Widget API.
     */
    render: duration => {
      self._widget.update(duration)
      return api
    }
  }

  return { self, api }
}
