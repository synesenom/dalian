import { select } from 'd3'
import {injectClass} from '../../utils/style-injector'
import Tooltip from './tooltip'

// Classes.
const TAG = 'dalian-point-tooltip-'
const CLASSES = {
  content: TAG + 'content',
  entry: TAG + 'entry',
  container: TAG + 'container',
  inner: TAG + 'inner',
  marker: TAG + 'marker',
  label: TAG + 'label'
}

// Default values.
const DEFAULTS = {
  ignore: [],
  titleFormat: d => d,
  valueFormat: d => d.y
}

/**
 * Component implementing the point tooltip feature. The point tooltip is a pre-formatted tooltip that takes an array of
 * plot data and displays it in the tooltip as a list of plots with colored square markers. Can be used in charts where
 * the tooltip displays info at a specific point of the widget (hence the name), such as line charts or heat maps.
 * It inherits all methods from the [Tooltip]{@link ../components/tooltip.html} component. The tooltip consists of the
 * X coordinate of the current data point(s) (which can be formatted using
 * [xFormat]{@link ../components/tooltip.html#titleFormat}) and the list of Y coordinates for the plots (formatted using
 * [yFormat]{@link ../components/tooltip.html#valueFormat}).
 *
 * @function PointTooltip
 */
export default (self, api) => {
  // Inject relevant style.
  injectClass(CLASSES.content, {
    display: 'table',
    padding: '10px',
    'min-width': '60px'
  })
  injectClass(CLASSES.entry, {
    display: 'table-row',
    position: 'relative'
  })
  injectClass(CLASSES.container, {
    display: 'inline-block',
    position: 'relative',
    height: '1em'
  })
  injectClass(CLASSES.inner, {
    display: 'flex',
    position: 'relative',
    height: '1em',
    'justify-content': 'center',
    'align-items': 'center'
  })
  injectClass(CLASSES.marker, {
    display: 'inline-block',
    position: 'relative',
    float: 'left',
    'margin-right': '6px',
    'border-radius': '2px'
  })
  injectClass(CLASSES.label, {
    display: 'table-cell',
    position: 'relative',
    'max-width': '120px',
    float: 'left',
    height: '.9em'
  })

  // Inherit from base tooltip
  let base = Tooltip(self, api)

  // Private members.
  let _ = {
    titleFormat: DEFAULTS.titleFormat,
    valueFormat: DEFAULTS.valueFormat,
  }

  // Protected members
  self._tooltip = Object.assign(base.self._tooltip, {
    // Variables.
    ignore: [],

    // Override methods.
    // TODO Docstring.
    builder: content => {
      if (typeof content === 'undefined') {
        self._tooltip.content()
        return undefined
      }

      // Create content node.
      let contentNode = select(document.createElement('div'))
        .attr('class', CLASSES.content)

      // Add title
      contentNode.append('div')
        .attr('class', CLASSES.entry)
        .text(_.titleFormat(content.title))

      // Add content
      content.content.data.filter(d => _.valueFormat(d) !== null)
        .forEach((plot, i) => {
          let entry = contentNode.append('div')
            .attr('class', CLASSES.entry)
          let container = entry.append('div')
            .attr('class', CLASSES.container)
            .style('margin-top', (i === 0 ? 6 : 3) + 'px')
          let inner = container.append('div')
            .attr('class', CLASSES.inner)
          inner.append('div')
            .attr('class', CLASSES.marker)
            .style('width', '1em')
            .style('height', '1em')
            .style('background', plot.background)
          inner.append('div')
            .attr('class', CLASSES.label)
            .html(_.valueFormat(plot))
        })

      return contentNode.node().outerHTML
    }
  })

  api.tooltip = Object.assign(api.tooltip || {}, {
    /**
     * Sets the format for the tooltip title.
     *
     * @method titleFormat
     * @methodOf PointTooltip
     * @param {Function} [format = d => d] Function to use as the formatter. May take one parameter which is the title
     * of the tooltip. Can be HTML formatted.
     * @returns {Widget} Reference to the Widget API.
     */
    titleFormat: (format = DEFAULTS.titleFormat) => {
      _.titleFormat = format
      return api
    },

    /**
     * Sets the format of the tooltip entry values.
     *
     * @method valueFormat
     * @methodOf PointTooltip
     * @param {Function} [format = d => d.y] Function to use as the formatter. May take one parameter which is the data
     * point for the current plot's entry containing the plot name and the data. Can be HTML formatted. If the return
     * value is null, the value is ignored.
     * @returns {Widget} Reference to the Widget API.
     */
    valueFormat: (format = DEFAULTS.valueFormat) => {
      _.valueFormat = format
      return api
    }
  })

  return {self, api}
}
