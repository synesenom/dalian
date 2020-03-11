import { easeLinear, event, mouse, select } from 'd3'
import extend from '../../core/extend'

// TODO Add more liberty in setting tooltipTitle based on current data point or element
// TODO Add more liberty in setting tooltipContent based on current data point or element

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
      let container = select('#' + _.container.id)
      if (container.empty()) {
        return select('body').append('div')
          .attr('id', _.container.id)
      }
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
          .style('font-size', '0.7em')
          .style('color', 'black')
          .style('pointer-events', 'none')
          .style('font-family', 'inherit')
          .style('min-width', '100px')
          .style('max-width', '150px')
          .style('padding', '10px')
          .style('line-height', '1')
          .style('left', ((bbox.left + bbox.right) / 2 + scroll.left) + 'px')
          .style('top', ((bbox.top + bbox.bottom) / 2 + scroll.top) + 'px')
      }
    },

    hideTooltip: () => {
      return
      if (typeof _.elem !== 'undefined') {
        _.elem
          .transition().duration(200)
          .style('opacity', 0)
          .on('end', function () {
            select(this)
              .style('display', 'none')
          })
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
        //return
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
          //return
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
        .style('display', 'block')
        .transition().duration(0)
        .style('opacity', 1)
        .transition()
      _.elem
        .transition().duration(200).ease(easeLinear)
        .style('left', tx + 'px')
        .style('top', ty + 'px')
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
      content: () => console.warn('content(mouse) is not implemented'),
      builder: () => console.warn('builder(mouse) is not implemented'),
      titleFormat: x => x
    }
  })

  // Public API
  api = Object.assign(api || {}, {
    /**
     * Enables/disables tooltip for the line chart.
     *
     * @method tooltip
     * @methodOf BaseTooltip
     * @param {boolean} [on = false] Whether tooltip should be enabled or not.
     * @returns {Object} Reference to the BaseTooltip API.
     */
    tooltip: (on = false) => {
      _.on = on
      return api
    },

    /**
     * Sets the format of the tooltip title.
     *
     * @method tooltipTitleFormat
     * @methodOf PointTooltip
     * @param {Function} [format = x => x] Function to use as the formatter. May take one parameter which is the tooltip title and
     * must return a string. The return value can be HTML formatted.
     * @returns {Object} Reference to the PointTooltip API.
     */
    tooltipTitleFormat: (format = x => x) => {
      self._tooltip.titleFormat = format
      return api
    }
  })

  return { self, api }
}
