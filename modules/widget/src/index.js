import { select } from 'd3-selection'

/**
 * The widget class, implementing a generic widget.
 *
 * @class Widget
 * @constructor
 * @param {string} type Widget type. This should be set by the child widget class.
 * @param {string} name The name of the current widget object. This is used as a unique identifier for the widget.
 * @param {string} [parent = body] The parent DOM element that this widget will be added.
 * @param {string} [elem = svg] The HTML tag of the topmost level container for the widget. This should be set by the
 * child widget class.
 * @constructor
 * @example
 *
 * // Create an SVG widget and append it to the body as an SVG
 * let chart1 = new Widget('fancy-chart-type', 'chart-1')
 *
 * // Create an SVG widget and append it to a div selected by it's id
 * let chart2 = new Widget('fancy-chart-type', 'chart-2', '#container')
 *
 * // Create a DIV widget an append it to the first div selected by class
 * let chart3 = new Widget('fancy-chart-type', 'chart-3', '.container', 'div')
 *
 */
export default (type, name, parent, elem) => {
  // Init internal variables
  let self = {}
  self._widget = {
    parent: select(parent),
    id: `dalian-widget-${type}-${name}`,
    container: undefined,
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
    },
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
    }
  }
  try {
    self._widget.container = self._widget.parent
      .append(elem)
      .attr('id', self._widget.id)
      .attr('class', `dalian-widget dalian-widget-${type}`)
      .style('display', 'none')
      .style('position', 'absolute')
      .style('width', self._widget.size.width)
      .style('height', self._widget.size.height)
      .style('left', self._widget.pos.x + 'px')
      .style('top', self._widget.pos.y + 'px')
  } catch (e) {
    throw Error('MissingDOMException: DOM is not present.')
  }

  // Protected methods
  self._widget.update = () => {}

  // Public API
  let api = {}

  /**
   * Sets the X coordinate of the widget. If negative, the widget's right side is measured from the right side of the
   * parent, otherwise it is measured from the left side.
   *
   * @method x
   * @method Widget
   * @param {number} [value = 0] Value of the X coordinate in pixels.
   * @returns {Widget} Reference to the widget.
   */
  api.x = (value = 0) => {
    self._widget.pos.x.attr = value >= 0 ? 'left' : 'right'
    self._widget.pos.x.ignore = value >= 0 ? 'right' : 'left'
    self._widget.pos.x.value = Math.abs(value) + 'px'
    return api
  }

  /**
   * Sets the Y coordinate of the widget. If negative, the widget's bottom side is measured from the bottom of the
   * parent, otherwise the top side is measured from the top.
   *
   * @method y
   * @method Widget
   * @param {number} [value = 0] Value of the Y coordinate in pixels.
   * @returns {Widget} Reference to the widget.
   */
  api.y = (value = 0) => {
    self._widget.pos.y.attr = value >= 0 ? 'top' : 'bottom'
    self._widget.pos.y.ignore = value >= 0 ? 'bottom' : 'top'
    self._widget.pos.y.value = Math.abs(value) + 'px'
    return api
  }

  /**
   * Sets the width of the widget (including it's margins). Also updates the inner width of the widget.
   *
   * @method width
   * @method Widget
   * @param {number} [value = 300] Width value in pixels.
   * @returns {Widget} Reference to the widget.
   */
  api.width = (value = 300) => {
    self._widget.size.width = value + 'px'
    self._widget.size.innerWidth = (value - self._widget.margins.left - self._widget.margins.right) + 'px'
    return api
  }

  /**
   * Sets the height of the widget (including it's margins). Also updates the inner height of the widget.
   *
   * @method height
   * @methodOf Widget
   * @param {number} [value = 200] Height value in pixels.
   * @returns {Widget} Reference to the widget.
   */
  api.height = (value = 200) => {
    self._widget.size.height = value + 'px'
    self._widget.size.innerHeight = (value - self._widget.margins.top - self._widget.margins.bottom) + 'px'
    return api
  }

  /**
   * Sets widget margins in pixels. Note that margins are included in width and thus height and effectively shrink the
   * plotting area.
   *
   * @method margins
   * @methodOf Widget
   * @param {(number | Object)} [margins = 0] A single number to set all sides to or an object specifying some of the
   * sides.
   * @returns {Widget} Reference to the widget.
   */
  api.margins = margins => {
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
  }

  /**
   * Renders and updates the widget. After any change to the widget, the render method should be called.
   *
   * @method render
   * @methodOf Widget
   * @param {number} [duration = 700] Duration of the rendering animation in ms.
   * @returns {Widget} Reference to the widget.
   */
  api.render = duration => {
    // Update widget first
    self._widget.update(duration)

    // Update container position and size
    self._widget.container
      .style(self._widget.pos.x.ignore, null)
      .style(self._widget.pos.x.attr, self._widget.pos.x.value)
      .style(self._widget.pos.y.ignore, null)
      .style(self._widget.pos.y.attr, self._widget.pos.y.value)
      .style('width', self._widget.size.width)
      .style('height', self._widget.size.height)

    // Show widget
    self._widget.container
      .style('display', 'block')

    return api
  }

  return { self, api }
}
