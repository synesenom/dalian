import { event, mouse, select } from 'd3'
import extend from '../../core/extend'

// TODO Add more liberty in setting tooltipTitle based on current data point or element
// TODO Add more liberty in setting tooltipContent based on current data point or element

// TODO Tooltip not working when mouse events are not attached. Attach tooltip to mousemove
/**
 * Component implementing the tooltip feature. When this component is available for a widget, its API is exposed via the
 * {.tooltip} namespace.
 *
 * @function Tooltip
 */
export default (self, api) => {
  // Private members
  let _ = {
    // Variables
    container: {
      id: 'dalian-tooltip-container'
    },
    id: `${self._widget.id}-tooltip`,
    on: false,

    // Methods
    getContainer: () => {
      // Get or create container.
      let container = select('#' + _.container.id)
      if (container.empty()) {
        container = select('body').append('div')
          .attr('id', _.container.id)
      }

      // Update relevant style.
      container.style('color', self._font.color)

      // Return container.
      return container
    },

    getTooltip: (bbox, scroll) => {
      if (typeof _.elem !== 'undefined' && !_.elem.empty()) {
        return _.elem
      } else {
        return _.container.elem.append('div')
          .attr('id', _.id)
          .style('position', 'absolute')
          .style('background-color', 'rgba(255, 255, 255, 0.95)')
          .style('border-radius', '2px')
          .style('box-shadow', '0 0 2px #aaa')
          .style('font-size', '0.85em')
          .style('color', 'currentColor')
          .style('pointer-events', 'none')
          .style('font-family', 'inherit')
          .style('width', 'auto')
          .style('line-height', '1')
          .style('left', ((bbox.left + bbox.right) / 2 + scroll.left) + 'px')
          .style('top', ((bbox.top + bbox.bottom) / 2 + scroll.top) + 'px')
      }
    },

    hideTooltip: () => {
      if (typeof _.elem !== 'undefined') {
        _.elem.style('opacity', 0)
      }
    },

    showTooltip: () => {

      let mx = event.pageX

      let my = event.pageY

      let boundingBox = self._widget.container.node().getBoundingClientRect()

      // Get scroll position
      let scroll = {
        left: window.pageXOffset || document.documentElement.scrollLeft,
        top: window.pageYOffset || document.documentElement.scrollTop
      }

      // If we are outside the charting area just remove tooltip
      if (mx < boundingBox.left + self._widget.margins.left - scroll.left
        || mx > boundingBox.right - self._widget.margins.right + scroll.left
        || my < boundingBox.top + self._widget.margins.top - scroll.top
        || my > boundingBox.bottom - self._widget.margins.bottom + scroll.top) {
        self._tooltip.builder()
        _.hideTooltip()
        return
      }

      // Get or create container
      _.container.elem = _.getContainer()

      // Get or create tooltip
      _.elem = _.getTooltip(boundingBox, scroll)

      // Create content
      let m = mouse(self._widget.container.node())
      let content = self._tooltip.builder(
        self._tooltip.content([m[0] - self._widget.margins.left, m[1] - self._widget.margins.top])
      )
      if (typeof content === 'undefined') {
        if (typeof _.elem !== 'undefined') {
          // If content is invalid, remove tooltip
          _.hideTooltip()
          return
        }
      } else {
        // Otherwise, set content
        _.elem.html(content)
      }

      // Calculate position
      let elem = _.elem.node().getBoundingClientRect()

      let tw = elem.width

      let th = elem.height

      let tx = mx + 20

      let ty = my + 20

      // TODO Make tooltip contained within the widget (left side)
      // Correct for edges
      let buffer = 10
      if (tx + tw > boundingBox.right - self._widget.margins.right + scroll.left - buffer) {
        tx -= tw + scroll.left + 40
      }
      if (ty + th > boundingBox.bottom - self._widget.margins.bottom + scroll.top - buffer) {
        ty = boundingBox.bottom - self._widget.margins.bottom + scroll.top - buffer - th
      }

      // Set position
      _.elem
        .style('left', tx + 'px')
        .style('top', ty + 'px')
        .style('opacity', 1)
    }
  }

  // Extend update method
  self._widget.update = extend(self._widget.update, () => {
    self._widget.container
      .style('pointer-events', _.on ? 'all' : null)
      .on('mousemove', () => _.on && !self._widget.disabled && _.showTooltip())
      .on('mouseout', _.hideTooltip)
  })

  // Protected members
  self = Object.assign(self || {}, {
    _tooltip: {
      isOn: () => _.on,
      content: () => console.warn('content(mouse) is not implemented'),
      builder: () => console.warn('builder(mouse) is not implemented'),
      titleFormat: x => x,
      rowFormat: x => x,
      xFormat: x => x,
      yFormat: x => x,
      ignore: []
    }
  })

  // Public API
  api.tooltip = {
    /**
     * Enables/disables tooltip.
     *
     * @method on
     * @methodOf Tooltip
     * @param {boolean} [on = false] Whether tooltip should be enabled or not.
     * @returns {Widget} Reference to the Widget API.
     */
    on: (on = false) => {
      _.on = on
      return api
    },

    /**
     * Sets the array of keys that are ignored by the tooltip. Ignored keys are not shown in the tooltip and they don't
     * have plot markers.
     *
     * @method ignore
     * @methodOf Tooltip
     * @param {string[]} keys Keys of plots to ignore in the tooltip.
     * @returns {Widget} Reference to the Widget API.
     */
    ignore: keys => {
      self._tooltip.ignore = keys
      return api
    },

    /**
     * Sets the format for the tooltip title.
     *
     * @method titleFormat
     * @methodOf Tooltip
     * @param {Function} [format = x => x] Function to use as the formatter. May take one parameter which is the title
     * of the tooltip.
     * @returns {Widget} Reference to the Widget API.
     */
    titleFormat: (format = x => x) => {
      self._tooltip.titleFormat = format
      return api
    },

    /**
     * Sets the format for the tooltip rows when the content does not specify the coordinate. An example is the content
     * of the ElementTooltip.
     *
     * @method rowFormat
     * @methodOf Tooltip
     * @param {Function} [format = x => x] Function to use as the formatter. May take one parameter which is the row
     * value of the tooltip.
     * @returns {Widget} Reference to the Widget API.
     */
    rowFormat: (format = x => x) => {
      self._tooltip.rowFormat = format
      return api
    },

    /**
     * Sets the format of the X component's value in the tooltip.
     *
     * @method xFormat
     * @methodOf Tooltip
     * @param {Function} [format = x => x] Function to use as the formatter. May take one parameter which is the X value
     * and must return a string. The return value can be HTML formatted.
     * @returns {Widget} Reference to the Widget API.
     */
    xFormat: (format = x => x) => {
      self._tooltip.xFormat = format
      return api
    },

    /**
     * Sets the format of the Y component's value in the tooltip.
     *
     * @method yFormat
     * @methodOf Tooltip
     * @param {Function} [format = x => x] Function to use as the formatter. May take one parameter which is the Y value
     * and must return a string. The return value can be HTML formatted.
     * @returns {Widget} Reference to the Widget API.
     */
    yFormat: (format = x => x) => {
      self._tooltip.yFormat = format
      return api
    }
  }

  return { self, api }
}
