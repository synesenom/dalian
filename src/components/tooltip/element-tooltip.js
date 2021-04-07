import { select } from 'd3'
import {injectClass} from '../../utils/style-injector'
import BaseTooltip from './tooltip'

// Classes.
const TAG = 'dalian-element-tooltip-'
const CLASSES = {
  content: TAG + 'content',
  title: TAG + 'title',
  entry: TAG + 'entry',
  label: TAG + 'label',
  value: TAG + 'value'
}

// Default values.
const DEFAULTS = {
  titleFormat: d => d,
  labelFormat: d => (d + ':'),
  valueFormat: d => d
}

/**
 * Component implementing the element tooltip feature. The element tooltip is a pre-formatted tooltip that takes a
 * data point and displays its attributes in the tooltip with a colored left border. The name of the plot group the
 * element belongs to is used as the tooltip title and the various attributes are displayed in a column of entries. Each
 * entry is a label-value pair.
 * The element tooltip can be used in charts where the tooltip displays info for a specific element in the widget
 * (hence the name), such as bar charts or pie charts. It inherits all methods from the
 * <a href="../components/tooltip.html">Tooltip</a> component.
 *
 * @function ElementTooltip
 */
// TODO API method to specify the entries in the tooltip.
export default (self, api) => {
  // Inject relevant style.
  injectClass(CLASSES.content, {
    'border-radius': '2px',
    'font-family': 'inherit',
    padding: '0.7em'
  })
  injectClass(CLASSES.title, {
    position: 'relative',
    margin: '2px',
    'margin-bottom': '10px',
    'line-height': '1em'
  })
  injectClass(CLASSES.entry, {
    position: 'relative',
    margin: '2px',
    height: '1em',
    'padding-right': '10px',
    'line-height': '1em'
  })
  injectClass(CLASSES.label, {
    position: 'relative',
    float: 'left',
    'margin-right': '10px'
  })
  injectClass(CLASSES.value, {
    position: 'relative',
    float: 'right'
  })

  // Inherit from base tooltip.
  let base = BaseTooltip(self, api)

  // Private members.
  let _ = {
    titleFormat: DEFAULTS.titleFormat,
    labelFormat: DEFAULTS.labelFormat,
    valueFormat: DEFAULTS.valueFormat
  }

  // Protected members.
  self._tooltip = Object.assign(base.self._tooltip, {
    // Override methods.
    // TODO Docstring.
    builder: content => {
      if (typeof content === 'undefined') {
        self._tooltip.content()
        return undefined
      }

      // Create content node
      let contentNode = select(document.createElement('div'))
        .attr('class', CLASSES.content)
        .style('border-left', content.stripe ? 'solid 4px ' + content.stripe : null)

      // Add title
      contentNode.append('div')
        .attr('class', CLASSES.title)
        .html(_.titleFormat(content.title))

      // Add content
      content.content.data.forEach(item => {
          let entry = contentNode.append('div')
            .attr('class', CLASSES.entry)
          entry.append('div')
            .attr('class', CLASSES.label)
            .html(_.labelFormat(item.name))
          entry.append('span')
            .attr('class', CLASSES.value)
            .html(_.valueFormat(item.value, item.name))
        })

      return contentNode.node().outerHTML
    }
  })

  api.tooltip = Object.assign(api.tooltip || {}, {
    /**
     * Sets the format for the tooltip title.
     *
     * @method titleFormat
     * @memberOf ElementTooltip
     * @param {Function} [format = d => d] Function to use as the formatter. May take one parameter which is the title
     * of the tooltip. Can be HTML formatted.
     * @returns {Widget} Reference to the Widget API.
     */
    titleFormat: (format = DEFAULTS.titleFormat) => {
      _.titleFormat = format
      return api
    },

    /**
     * Sets the format for the tooltip entry labels.
     *
     * @method labelFormat
     * @memberOf ElementTooltip
     * @param {Function} [format = d => d + :] Function to use as the formatter. May take one parameter which is the
     * entry label. Can be HTML formatted.
     * @returns {Widget} Reference to the Widget API.
     */
    labelFormat: (format = DEFAULTS.labelFormat) => {
      _.labelFormat = format
      return api
    },

    /**
     * Sets the format for the tooltip entry values.
     *
     * @method valueFormat
     * @memberOf ElementTooltip
     * @param {Function} [format = d => d] Function to use as the formatter. May take two parameters: the value for the entry and the entry name (label before the value). Can be HTML formatted.
     * @returns {Widget} Reference to the Widget API.
     */
    valueFormat: (format = DEFAULTS.valueFormat) => {
      _.valueFormat = format
      return api
    }
  })

  return {self, api}
}
