import { select } from 'd3-selection'
import encode from '../../utils/src/encode'

export default (type, name, parent, elem, self, api) => {
  // Init internal variables
  self = self || {}
  self.widget = {
    id: `dalian-widget-${type}-${name}`,
    dom: {}
  }
  self.widget.pos = {
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
  self.widget.size = {
    width: '300px',
    height: '200px',
    innerWidth: '300px',
    innerHeight: '200px'
  }
  self.widget.margins = {
    left: 0,
    right: 0,
    top: 0,
    bottom: 0
  }
  try {
    self.widget.dom.container = select(parent)
      .append(elem)
      .attr('id', self.widget.id)
      .attr('class', `dalian-widget dalian-widget-${type}`)
      .style('display', 'none')
      .style('position', 'absolute')
      .style('width', self.widget.size.width)
      .style('height', self.widget.size.height)
      .style('left', self.widget.pos.x + 'px')
      .style('top', self.widget.pos.y + 'px')
  } catch (e) {
    throw Error('MissingDOMException: DOM is not present.')
  }

  // Private methods
  self.widget.update = () => {
    console.warn('Widget.update(duration) is not implemented')
  }

  // Public API
  api = api || {}
  api.x = (value = 0) => {
    self.widget.pos.x.attr = value >= 0 ? 'left' : 'right'
    self.widget.pos.x.ignore = value >= 0 ? 'right' : 'left'
    self.widget.pos.x.value = Math.abs(value) + 'px'
    return api
  }

  api.y = (value = 0) => {
    self.widget.pos.y.attr = value >= 0 ? 'top' : 'bottom'
    self.widget.pos.y.ignore = value >= 0 ? 'bottom' : 'top'
    self.widget.pos.y.value = Math.abs(value) + 'px'
    return api
  }

  api.width = (value = 300) => {
    self.widget.size.width = value + 'px'
    self.widget.size.innerWidth = (value - self.widget.margins.left - self.widget.margins.right) + 'px'
    return api
  }

  api.height = (value = 200) => {
    self.widget.size.height = value + 'px'
    self.widget.size.innerHeight = (value - self.widget.margins.top - self.widget.margins.bottom) + 'px'
    return api
  }

  api.margins = margins => {
    switch (typeof margins) {
      case 'undefined':
      default:
        self.widget.margins = {
          left: 0,
          right: 0,
          top: 0,
          bottom: 0
        }
        break
      case 'number':
        // Single value for each side
        self.widget.margins = {
          left: margins,
          right: margins,
          top: margins,
          bottom: margins
        }
        break
      case 'object':
        // Update specified values
        self.widget.margins = Object.assign(self.widget.margins, margins)
        break
    }

    // Update inner size
    self.widget.size.innerWidth = (parseInt(self.widget.size.width) -
      self.widget.margins.left - self.widget.margins.right) + 'px'
    self.widget.size.innerHeight = (parseInt(self.widget.size.height) -
      self.widget.margins.top - self.widget.margins.bottom) + 'px'
    return api
  }

  api.render = duration => {
    // Update widget first
    self.widget.update(duration);

    // Update container position and size
    self.widget.dom.container
      .style(self.widget.pos.x.ignore, null)
      .style(self.widget.pos.x.attr, self.widget.pos.x.value)
      .style(self.widget.pos.y.ignore, null)
      .style(self.widget.pos.y.attr, self.widget.pos.y.value)
      .style('width', self.widget.size.width)
      .style('height', self.widget.size.height);

    // Show widget
    self.widget.dom.container
      .style('display', 'block');

    return api;
  }

  return { self, api }
}
