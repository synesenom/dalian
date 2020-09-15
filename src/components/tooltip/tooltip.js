import { event, mouse } from 'd3'
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
    position: 'absolute',
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
    getTooltip () {
      if (typeof _.elem !== 'undefined' && !_.elem.empty()) {
        return _.elem.style('font-size', 0.85 * parseFloat(self._font.size) + 'px')
      } else {
        return _.container.append('div')
          .attr('id', _.id)
          .attr('class', CLASSES.tooltip)
          .style('font-size', 0.85 * parseFloat(self._font.size) + 'px')
      }
    },

    hideTooltip () {
      if (typeof _.elem !== 'undefined') {
        _.elem.style('opacity', 0)
      }
    },

    showTooltip () {

      const [mx, my] = mouse(self._widget.container.node())

      // If we are outside the charting area just remove tooltip.
      const xMax = parseFloat(self._widget.size.width) - self._widget.margins.right
      const yMax = parseFloat(self._widget.size.height) - self._widget.margins.bottom
      if (mx < self._widget.margins.left || mx > xMax || my < self._widget.margins.top || my > yMax) {
        self._tooltip.builder()
        _.hideTooltip()
        return
      }

      // Get or create tooltip.
      _.elem = _.getTooltip()

      // Create content.
      let content = self._tooltip.builder(self._tooltip.content(self._widget.getMouse()))
      if (typeof content === 'undefined') {
        if (typeof _.elem !== 'undefined') {
          // If content is invalid, remove tooltip.
          _.hideTooltip()
          return
        }
      } else {
        // Otherwise, set content.
        _.elem.html(content)
      }

      // Calculate position.
      const elem = _.elem.node().getBoundingClientRect()

      const tw = elem.width

      const th = elem.height

      let tx = mx + 20

      let ty = my + 20

      // Correct for edges.
      const buffer = 10
      if (tx + tw > xMax - buffer) {
        tx -= tw + 30
      }
      if (ty + th > yMax - buffer) {
        ty = yMax - buffer - th
      }

      // Set position.
      _.elem
        .style('left', tx + 'px')
        .style('top', ty + 'px')
        .style('opacity', 1)
    }
  }

  // Extend update method.
  self._widget.update = extend(self._widget.update, () => {
    // Update relevant mouse events.
    self._widget.container
      .style('pointer-events', _.on ? 'all' : null)
      .on('mousemove.tooltip', () => _.on && !self._widget.disabled && _.showTooltip())
      .on('touchmove.tooltip', () => _.on && !self._widget.disabled && _.showTooltip())
      .on('mouseout.tooltip', _.hideTooltip)
  })

  // Protected members.
  self = Object.assign(self || {}, {
    _tooltip: {
      isOn: () => _.on,
      content: () => console.warn('content(mouse) is not implemented'),
      builder: () => console.warn('builder(mouse) is not implemented')
    }
  })

  // Public API.
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
