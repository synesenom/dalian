import { select } from 'd3'
import Tooltip from './tooltip'


/**
 * Component implementing the point tooltip feature. The point tooltip is a pre-formatted tooltip that takes an array of
 * plot data and displays it in the tooltip as a list of plots with colored square markers. Can be used in charts where
 * the tooltip displays info at a specific point of the widget (hence the name), such as line charts or heat maps.
 * It inherits all methods from the [Tooltip]{@link ../components/tooltip.html} component. Relevant API methods:
 * [on]{@link ../components/tooltip.html#on}, [xFormat]{@link ../components/tooltip.html#xFormat},
 * [yFormat]{@link ../components/tooltip.html#yFormat}.
 *
 * @function PointTooltip
 */
export default (self, api) => {
  // Inherit from base tooltip
  let base = Tooltip(self, api)

  // Protected members
  self._tooltip = Object.assign(base.self._tooltip, {
    // Override methods
    builder: content => {
      if (typeof content === 'undefined') {
        self._tooltip.content()
        return undefined
      }

      // Create content node
      let contentNode = select(document.createElement('div'))
        .style('width', 'min-content')
        .style('padding', '10px')

      // Add title
      contentNode.append('div')
        .style('display', 'inline-block')
        .style('position', 'relative')
        .style('width', 'max-content')
        .style('margin-bottom', '4px')
        .text(self._tooltip.xFormat(content.title))

      // TODO Remove this: add to ElementTooltip

      // Add content
      content.content.data.sort((a, b) => a.name.localeCompare(b.name))
        .forEach(plot => {
          let entry = contentNode.append('div')
            .style('display', 'inline-block')
            .style('position', 'relative')
            .style('width', 'max-content')
            .style('margin-top', '3px')
          entry.append('div')
            .style('display', 'inline-block')
            .style('position', 'relative')
            .style('width', '9px')
            .style('height', '9px')
            .style('top', '1px')
            .style('float', 'left')
            .style('margin-right', '10px')
            .style('background', plot.background)
          entry.append('div')
            .style('display', 'inline-block')
            .style('position', 'relative')
            .style('width', 'max-content')
            .style('max-width', '120px')
            .style('float', 'left')
            .html(self._tooltip.yFormat(plot.value))
        })

      return contentNode.node().outerHTML
    }
  })

  return {self, api}
}
