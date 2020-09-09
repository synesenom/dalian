import { event } from 'd3'
import extend from '../../core/extend'
import StyleInjector from '../../utils/style-injector'

// TODO Add more liberty in setting tooltipTitle based on closest data point or element
// TODO Add more liberty in setting tooltipContent based on closest data point or element

// Classes.
const CLASSES = {
  tooltip: 'dalian-tooltip'
}

/**
 * Component implementing the tooltip feature. When this component is available for a widget, its API is exposed via the
 * {.tooltip} namespace.
 *
 * @function Tooltip
 */
export default (self, api) => {
  // Inject relevant style.
  StyleInjector.addClass(CLASSES.tooltip, {
    position: 'fixed',
    'background-color': 'rgba(255, 255, 255, 0.95)',
    'border-radius': '2px',
    'box-shadow': '1px 1px 2px #888, 0 0 1px #aaa',
    color: 'currentColor',
    'pointer-events': 'none',
    'font-family': 'inherit',
    'font-size': '0.8em',
    width: 'auto',
    'min-width': '80px',
    'line-height': '1',
    'z-index': 9999
  })

  // Default values.
  const DEFAULTS = {
    on: false
  }

  // Private members.
  let _ = {
    // Variables.
    container: self._widget.container.append('div')
      .attr('class', 'dalian-tooltip-container'),
    id: `${self._widget.id}-tooltip`,
    on: DEFAULTS.on,

    // Methods.
    getTooltip: (bbox, scroll) => {
      if (typeof _.elem !== 'undefined' && !_.elem.empty()) {
        return _.elem.style('font-size', 0.85 * parseFloat(self._font.size) + 'px')
      } else {
        return _.container.append('div')
          .attr('id', _.id)
          .attr('class', CLASSES.tooltip)
          .style('font-size', 0.85 * parseFloat(self._font.size) + 'px')
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

      // Get or create tooltip
      _.elem = _.getTooltip(boundingBox, scroll)

      // Create content
      let content = self._tooltip.builder(self._tooltip.content(self._widget.getMouse()))
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
    // Update relevant mouse events.
    self._widget.container
      .style('pointer-events', _.on ? 'all' : null)
      .on('mousemove.tooltip', () => _.on && !self._widget.disabled && _.showTooltip())
      .on('mouseout.tooltip', _.hideTooltip)
  })

  // Protected members
  self = Object.assign(self || {}, {
    _tooltip: {
      isOn: () => _.on,
      content: () => console.warn('content(mouse) is not implemented'),
      builder: () => console.warn('builder(mouse) is not implemented')
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
    on: (on = DEFAULTS.on) => {
      _.on = on
      return api
    }
  }

  return { self, api }
}
