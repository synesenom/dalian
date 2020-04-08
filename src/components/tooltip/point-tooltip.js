import { select } from 'd3'
import Tooltip from './tooltip'


/**
 * Component implementing the point tooltip feature. The point tooltip is a pre-formatted tooltip that takes an array of
 * plot data and displays it in the tooltip as a list of plots with colored square markers. Can be used in widgets where
 * the tooltip displays info at a specific point of the widget (hence the name), such as line widgets or heat maps.
 * It inherits all methods from the [Tooltip]{@link ../components/tooltip.html} component. The tooltip consists of the
 * X coordinate of the current data point(s) (which can be formatted using
 * [xFormat]{@link ../components/tooltip.html#xFormat}) and the list of Y coordinates for the plots (formatted using
 * [yFormat]{@link ../components/tooltip.html#yFormat}).
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
        .style('display', 'table')
        .style('padding', '10px')

      // Add title
      contentNode.append('div')
        .style('display', 'table-row')
        .style('position', 'relative')
        .text(self._tooltip.xFormat(content.title))

      // TODO Remove this: add to ElementTooltip

      // Add content
      content.content.data.sort((a, b) => a.name.localeCompare(b.name))
        .forEach((plot, i) => {
          let entry = contentNode.append('div')
            .style('display', 'table-row')
            .style('position', 'relative')
          entry.append('div')
            .style('display', 'table-cell')
            .style('position', 'relative')
            .style('width', '9px')
            .style('height', '9px')
            .style('top', '1px')
            .style('float', 'left')
            .style('margin-top', (i === 0 ? 6 : 3) + 'px')
            .style('margin-right', '10px')
            .style('background', plot.background)
          entry.append('div')
            .style('display', 'table-cell')
            .style('position', 'relative')
            .style('max-width', '120px')
            .style('margin-top', (i === 0 ? 6 : 3) + 'px')
            .style('float', 'left')
            .html(self._tooltip.yFormat(plot.value))
        })

      return contentNode.node().outerHTML
    }
  })

  return {self, api}
}
