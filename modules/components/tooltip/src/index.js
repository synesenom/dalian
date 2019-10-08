import { easeLinear } from 'd3-ease'
import { event, mouse, select } from 'd3-selection'
import { extend } from '@dalian/core'

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
          .style('background-color', 'rgba(255, 255, 255, 0.9)')
          .style('border-radius', '2px')
          .style('box-shadow', '0 0 3px grey')
          .style('font-size', '0.7em')
          .style('color', 'black')
          .style('pointer-events', 'none')
          .style('left', ((bbox.left + bbox.right) / 2 + scroll.left) + 'px')
          .style('top', ((bbox.top + bbox.bottom) / 2 + scroll.top) + 'px')
      }
    },

    hideTooltip: () => {
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

    updateTooltip: () => {
      self._widget.container
        .style('pointer-events', _.on ? 'all' : null)
        .on('mousemove', () => {
          _.on && _.show()
        })
        .on('mouseout', _.hideTooltip)
    },

    show: () => {

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
        // TODO Remove this, use Detector.outside instead
        self._tooltip.createContent()
        _.hideTooltip()
        return
      }

      // Get or create container
      _.container.elem = _.getContainer()

      // Get or create tooltip
      _.elem = _.getTooltip(boundingBox, scroll)

      // Create content
      let m = mouse(self._widget.container.node())
      let content = self._tooltip.createContent([m[0] - self._widget.margins.left, m[1] - self._widget.margins.top])
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

  // Protected members
  self = Object.assign(self, {
    _tooltip: {
      createContent: () => {
        console.warn('createTooltip(mouse) is not implemented')
      },

      titleFormat: x => x
    }
  })

  // Extend update method
  self._widget.update = extend(self._widget.update, _.updateTooltip)

  // Public API
  api = Object.assign(api, {
    tooltip: on => {
      _.on = on
      return api
    },

    tooltipTitleFormat: format => {
      self._tooltip.titleFormat = format
      return api
    }
  })

  return { self, api }
}
