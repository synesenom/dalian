import { easeLinear } from 'd3-ease'
import { event, mouse, select } from 'd3-selection'

// TODO Remove dependency on Widget
export default (_self, _api) => {
  // Set default values
  let self = _self || {}
  self.tooltip = {
    containerId: 'dalian-tooltip-container',
    containerElem: undefined,
    id: `${self.widget.id}-tooltip`,
    elem: undefined,
    on: false
  }

  const _getContainer = () => {
    let container = select('#' + self.tooltip.containerId)
    if (container.empty()) {
      return select('body').append('div')
        .attr('id', self.tooltip.containerId)
    }
  }

  const _getTooltip = (bbox, scroll) => {
    if (typeof self.tooltip.elem !== 'undefined' && !self.tooltip.elem.empty()) {
      return self.tooltip.elem
    } else {
      return self.tooltip.containerElem.append('div')
        .attr('id', self.tooltip.id)
        .style('position', 'absolute')
        .style('background-color', 'rgba(255, 255, 255, 0.9)')
        .style('border-r', '2px')
        .style('box-shadow', '0 0 3px grey')
        .style('font-family', '"Courier", monospace')
        .style('font-size', '0.7em')
        .style('color', 'black')
        .style('pointer-events', 'none')
        .style('left', ((bbox.left + bbox.right) / 2 + scroll.left) + 'px')
        .style('top', ((bbox.top + bbox.bottom) / 2 + scroll.top) + 'px')
    }
  }

  self.tooltip.createContent = () => {
    console.warn('createTooltip(mouse) is not implemented')
  }

  // Private methods
  self.tooltip.show = () => {
    // Create container and tooltip ID
    let m = mouse(self.widget.dom.container.node())

    let mx = event.pageX

    let my = event.pageY

    let boundingBox = self.widget.dom.container.node().getBoundingClientRect()

    // Get scroll position
    let scroll = {
      left: window.pageXOffset || document.documentElement.scrollLeft,
      top: window.pageYOffset || document.documentElement.scrollTop
    }
    // If we are outside the charting area just remove tooltip

    if (mx < boundingBox.left + self.widget.margins.left - scroll.left ||
      mx > boundingBox.right - self.widget.margins.right + scroll.left ||
      my < boundingBox.top + self.widget.margins.top - scroll.top ||
      my > boundingBox.bottom - self.widget.margins.bottom + scroll.top) {
      select('#' + self.tooltip.id)
        .transition().duration(200)
        .style('opacity', 0)
        .on('end', function () {
          select(this)
            .style('display', 'none')
        })
      return
    }

    // Get or create container
    self.tooltip.containerElem = _getContainer()

    // Get or create tooltip
    self.tooltip.elem = _getTooltip(boundingBox, scroll)

    // Create content
    let content = self.tooltip.createContent([m[0] - self.widget.margins.left, m[1] - self.widget.margins.top])
    if (typeof content === 'undefined') {
      if (typeof self.tooltip.elem !== 'undefined') {
        // If content is invalid, remove tooltip
        self.tooltip.elem
          .transition().duration(200)
          .style('opacity', 0)
          .on('end', function () {
            select(this)
              .style('display', 'none')
          })
        return
      }
    } else {
      // Otherwise, set content
      self.tooltip.elem.html(content)
    }

    // Calculate position
    let elem = self.tooltip.elem.node().getBoundingClientRect()

    let tw = elem.width

    let th = elem.height

    let tx = mx + 20

    let ty = my + 20

    // TODO Make tooltip contained within the widget (left side)
    // Correct for edges
    if (tx + tw > boundingBox.right - self.widget.margins.right + scroll.left - 5) {
      tx -= tw + scroll.left + 40
    }
    if (ty + th > boundingBox.bottom - self.widget.margins.bottom + scroll.top - 5) {
      ty = boundingBox.bottom - self.widget.margins.bottom + scroll.top - 10 - th
    }

    // Set position
    self.tooltip.elem
      .style('display', 'block')
      .transition().duration(0)
      .style('opacity', 1)
      .transition()
    self.tooltip.elem
      .transition().duration(200).ease(easeLinear)
      .style('left', tx + 'px')
      .style('top', ty + 'px')
  }

  // Public API
  let api = _api || {}
  api.tooltip = on => {
    self.tooltip.on = on
    return api
  }

  return { self, api }
}
