import { select, mouse, event } from 'd3-selection';
import { color } from 'd3-color';
import { format } from 'd3-format';
import { easeLinear } from 'd3-ease';

/**
 * Converts a name (a string containing spaces) to a valid ID.
 *
 * @method encode
 * @param {(string|number)} name Name to convert.
 * @returns {string} Converted valid ID.
 * @static
 */
export function encode(name) {
    return ('' + name).replace(/ /g, '__');
}

/**
 * The class widget, the base class of all widget elements.
 *
 * @class Widget
 * @constructor
 * @param {string} type Widget type. This should be set by the child widget class.
 * @param {string} name The name of the current widget object. This is used as a unique identifier for the
 * widget.
 * @param {string} [parent = body] The parent DOM element that this widget will be added.
 * @param {string} [elem = svg] The HTML tag of the topmost level container for the widget. This should be set by
 * the child widget class.
 * @returns {Widget} Reference to the widget.
 */
export class Widget {
    constructor(type, name, parent = 'body', elem = 'svg') {
        /**
         * The unique ID of the widget.
         *
         * @var {string} _id
         * @memberOf Widget
         * @private
         */
        this._id = `dalian-widget-${type}-${name}`;

        /**
         * The widget DOM elements.
         *
         * @var {Object} _dom
         * @memberOf Widget
         * @private
         */
        this._dom = {};
        try {
            this._dom.container = select(parent)
                .append(elem)
                .attr('id', this._id)
                .attr('class', `dalian-widget dalian-widget-${type}`)
                .style('display', 'none')
                .style('position', 'absolute');
        } catch (e) {
            throw Error('MissingDOMException: DOM is not present.');
        }

        /**
         * Widget attributes. All modifiable properties are included in this property.
         *
         * @var {Object} _attr
         * @memberOf Widget
         * @private
         */
        this._attr = {
            pos: {
                x: {
                    attr: 'left',
                    value: '0px'
                },
                y: {
                    attr: 'top',
                    value: '0px'
                }
            },
            size: {
                width: '300px',
                height: '200px',
                innerWidth: '300px',
                innerHeight: '200px'
            },
            font: {
                size: '14px',
                color: 'black'
            },
            colors: {
                policy: null,
                mapping: () => 'black'
            },
            margins: {
                left: 0,
                right: 0,
                top: 0,
                bottom: 0
            },
            mouse: {
                enter: null,
                leave: null,
                click: null
            },
            flags: {
                tooltip: false
            }
        };

        // Return this widget
        return this;
    }

    /**
     * Generator of the default color function.
     *
     * @method defaultColors
     * @memberOf Widget
     * @returns {Function} The default color generator.
     * @static
     */
    static defaultColors() {
        let keys = [];
        return function (key) {
            let i = keys.indexOf(key);
            return [
                '#e41a1c',
                '#377eb8',
                '#4daf4a',
                '#984ea3',
                '#ff7f00',
                '#ffff33',
                '#a65628',
                '#f781bf',
                '#999999',
                '#8dd3c7',
                '#ffffb3',
                '#bebada',
                '#fb8072',
                '#80b1d3',
                '#fdb462',
                '#b3de69',
                '#fccde5',
                '#d9d9d9'
            ][i > -1 ? i : keys.push(key) - 1];
        };
    }

    /**
     * Generator for the default formatter.
     *
     * @method defaultFormat
     * @methodOf Widget
     * @returns {Function} The default formatter.
     * @static
     */
    static defaultFormat() {
        return function (v) {
            return v > 1 ? format('.2s')(v) : v + '';
        };
    }

    /**
     * Updater method that is called at each rendering. May be overridden by the child class.
     *
     * @method _update
     * @memberOf Widget
     * @param {number=} duration Duration of the update animation on data change.
     * @private
     */
    _update(duration) {
    }

    /**
     * Creates the content of the tooltip. My be overridden.
     *
     * @method _tooltip
     * @memberOf Widget
     * @param {number[]=} mouse Mouse position.
     * @returns {string} The tooltip content.
     * @private
     */
    _tooltip(mouse) {
        return '';
    }

    /**
     * Shows the tooltip.
     *
     * @method _showTooltip
     * @memberOf Widget
     * @private
     */
    _showTooltip() {
        let tooltipId = 'dalian-widgets-tooltip',
            m = mouse(this._dom.container.node()),
            mx = event.pageX,
            my = event.pageY,
            boundingBox = this._dom.container.node().getBoundingClientRect();

        // If we are outside the charting area just remove tooltip
        if (mx < boundingBox.left + this._attr.margins.left || mx > boundingBox.right - this._attr.margins.right
            || my < boundingBox.top + this._attr.margins.top || my > boundingBox.bottom - this._attr.margins.bottom) {
            select('#' + tooltipId)
                .style('opacity', 0)
                .remove();
            this._tooltip();
            return;
        }

        // Create tooltip if needed
        let tooltip = select('#' + tooltipId);
        if (select('#' + tooltipId).empty()) {
            let shadowColor = color(this._attr.font.color);
            shadowColor.opacity = 0.3;
            tooltip = select('body').append('div')
                .attr('id', tooltipId)
                .style('position', 'absolute')
                .style('background-color', 'rgba(255, 255, 255, 0.9)')
                .style('border-radius', '2px')
                .style('box-shadow', '0 0 3px ' + shadowColor)
                .style('font-family', '"Courier", monospace')
                .style('font-size', '0.7em')
                .style('color', this._attr.font.color)
                .style('pointer-events', 'none')
                .style('left', (boundingBox.left + boundingBox.right) / 2 + 'px')
                .style('top', (boundingBox.top + boundingBox.bottom) / 2 + 'px');
        }

        // Get content
        // If content is invalid, remove tooltip
        let content = this._tooltip([m[0] - this._attr.margins.left, m[1] - this._attr.margins.top]);
        if (!content) {
            select('#' + tooltipId)
                .style('opacity', 0)
                .html('');
            this._tooltip();
            return;
        } else {
            tooltip.html(content);
        }

        // Calculate position
        let elem = tooltip.node().getBoundingClientRect(),
            tw = elem.width,
            th = elem.height,
            tx = mx + 20,
            ty = my + 20;

        // Correct for edges
        if (tx + tw > boundingBox.right - this._attr.margins.right - 5) {
            tx -= tw + 40;
        }
        if (ty + th > boundingBox.bottom - this._attr.margins.bottom - 5) {
            ty = boundingBox.bottom - this._attr.margins.bottom - 10 - th;
        }

        // Set position
        tooltip
            .style('opacity', 1)
            .transition();
        tooltip
            .transition().duration(200).ease(easeLinear)
            .style('left', tx + 'px')
            .style('top', ty + 'px');
    }

    /**
     * Renders the widget. If called for the first time, the widget is built, otherwise this method updates the
     * widget with attributes that have been changed since the last rendering.
     *
     * @method render
     * @memberOf Widget
     * @param {number} duration Duration of the rendering animation in ms. Default is 700 ms.
     * @returns {Widget} Reference to the widget.
     */
    render(duration = 700) {
        // Update widget first
        this._update(duration);

        // Update position and size
        this._dom.container
            .style(this._attr.pos.x.attr, this._attr.pos.x.value)
            .style(this._attr.pos.y.attr, this._attr.pos.y.value)
            .style('width', this._attr.size.width)
            .style('height', this._attr.size.height);

        // Propagate font to all text
        this._dom.container
            .selectAll('.tick > text')
            .attr('stroke-width', 0)
            .attr('font-family', 'inherit')
            .style('font-size', this._attr.font.size)
            .style('fill', this._attr.font.color);
        this._dom.container
            .style('font-family', 'inherit');
        this._dom.container
            .selectAll('g')
            .attr('font-family', 'inherit');

        // Update tooltip behavior
        this._dom.container
            .style('pointer-events', this._attr.flags.tooltip ? 'all' : null)
            .on('mousemove', () => {
                this._attr.flags.tooltip && this._showTooltip();
            });

        // Show widget
        this._dom.container
            .style('display', 'block');
        return this;
    }

    /**
     * Enables/disables description for the current widget. A description is a small tooltip that is bound to the
     * context menu (also disables default event handler). The description disappears once the mouse leaves the
     * widget. If called without argument, description is disabled.
     *
     * @method description
     * @memberOf Widget
     * @param {string=} content Content of the description. Can be HTML formatted. If not provided, description is
     * disabled.
     * @returns {Widget} Reference to the widget.
     */
    description(content) {
        // If content is empty, disable description
        if (!content) {
            this._dom.container.on('contextmenu', null);
        } else {
            // Otherwise bind description event to context menu
            let descriptionId = this._id + '-description';

            this._dom.container.on('contextmenu', () => {
                event.preventDefault();

                // Create description if does not exist
                if (select('#' + descriptionId).empty()) {
                    select('body').append('div')
                        .attr('id', descriptionId)
                        .style('position', 'absolute')
                        .style('left', (event.pageX + 20) + 'px')
                        .style('top', (event.pageY - 20) + 'px')
                        .style('width', 'auto')
                        .style('max-width', '500px')
                        .style('padding', '10px')
                        .style('background', 'white')
                        .style('box-shadow', '0 0 1px black')
                        .style('border-radius', '3px')
                        .style('color', 'black')
                        .style('font-size', '0.8em')
                        .style('font-family', 'inherit')
                        .style('line-height', '1.35em')
                        .style('pointer-events', 'none')
                        .html(content);
                }
            }).on('mouseleave', () => {
                // Remove description if mouse leaves widget
                let description = select('#' + descriptionId);
                if (!description.empty()) {
                    description.remove();
                }
            });
        }
        return this;
    }

    /**
     * Replaces the widget with a placeholder message positioned in the center of the original widget. If no
     * placeholder content is provided, the widget is recovered. Note: placeholder is shown even if the widget is
     * not yet rendered.
     *
     * @method placeholder
     * @memberOf Widget
     * @param {string=} content Content of the placeholder. Can be HTML formatted. If omitted, the widget is shown.
     * @returns {Widget} Reference to the widget.
     */
    placeholder(content) {
        let placeholderId = this._id + '-placeholder';

        // If no content provided, remove placeholder and show widget
        if (!content) {
            this._dom.container
                .transition().duration(700)
                .style('opacity', 1);
            let placeholder = select('#' + placeholderId);
            if (!placeholder.empty()) {
                placeholder.remove();
            }
        } else {
            // Otherwise hide widget and add placeholder
            this._dom.container
                .transition().duration(700)
                .style('opacity', 0);

            // Otherwise fade out widget and add placeholder
            if (select('#' + placeholderId).empty()) {
                select('body').append('div')
                    .attr('id', placeholderId)
                    .style('position', 'absolute')
                    .style('width', this._attr.size.width)
                    .style('height', this._attr.size.height)
                    .style('line-height', this._attr.size.height)
                    .style(this._attr.pos.x.attr, this._attr.pos.x.value)
                    .style(this._attr.pos.y.attr, this._attr.pos.y.value)
                    .style('text-align', 'center')
                    .style('pointer-events', 'none')
                    .append('span')
                    .style('display', 'inline-block')
                    .style('vertical-align', 'middle')
                    .style('line-height', 'normal')
                    .style('font-size', this._attr.font.size)
                    .style('color', this._attr.font.color)
                    .style('opacity', 0)
                    .html(content)
                    .transition().duration(700)
                    .style('opacity', 1);
            }
        }
        return this;
    }

    /**
     * Sets the X coordinate of the widget. If negative, the widget's right side is measured from the right side of
     * the parent, otherwise it is measured from the left side. Default is 0.
     *
     * @method x
     * @memberOf Widget
     * @param {number} value Value of the X coordinate. Default value is 0.
     * @returns {Widget} Reference to the widget.
     */
    x(value = 0) {
        this._attr.pos.x.attr = value >= 0 ? 'left' : 'right';
        this._attr.pos.x.value = Math.abs(value) + 'px';
        return this;
    }

    /**
     * Sets the Y coordinate of the widget. If negative, the widget's bottom side is measured from the bottom of the
     * parent, otherwise the top side is measured from the top. Default is 0.
     *
     * @method y
     * @memberOf Widget
     * @param {number} value Value of the Y coordinate. Default value is 0.
     * @returns {Widget} Reference to the widget.
     */
    y(value = 0) {
        this._attr.pos.y.attr = value >= 0 ? 'top' : 'bottom';
        this._attr.pos.y.value = Math.abs(value) + 'px';
        return this;
    }

    /**
     * Sets the width of the widget (including it's margins). Default is 300.
     *
     * @method width
     * @memberOf Widget
     * @param {number} value Width value. Default is 300.
     * @returns {Widget} Reference to the widget.
     */
    width(value = 300) {
        this._attr.size.width = value + 'px';
        this._attr.size.innerWidth = (value - this._attr.margins.left - this._attr.margins.right) + 'px';
        return this;
    }

    /**
     * Sets the height of the widget (including it's margins). Default is 200.
     *
     * @method height
     * @memberOf Widget
     * @param {number} value Height value. Default is 200.
     * @returns {Widget} Reference to the widget.
     */
    height(value = 200) {
        this._attr.size.height = value + 'px';
        this._attr.size.innerHeight = (value - this._attr.margins.top - this._attr.margins.bottom) + 'px';
        return this;
    }

    /**
     * Sets widget margins in pixels. Note that margins are included in width and thus height and effectively shrink
     * the plotting area. Default is 0.
     *
     * @method margins
     * @memberOf Widget
     * @param {(number | object)} [margins = 0] A single number to set all sides or an object specifying some of the sides.
     * @returns {Widget} Reference to the widget.
     */
    margins(margins = 0) {
        if (typeof margins === 'number') {
            // Single value for each side
            this._attr.margins = {
                left: margins,
                right: margins,
                top: margins,
                bottom: margins
            };
        } else {
            for (let side in this._attr.margins) {
                if (this._attr.margins.hasOwnProperty(side) && side in margins) {
                    this._attr.margins[side] = margins[side];
                }
            }
        }
        this._attr.size.innerWidth = (parseInt(this._attr.size.width)
            - this._attr.margins.left - this._attr.margins.right) + 'px';
        this._attr.size.innerHeight = (parseInt(this._attr.size.height)
            - this._attr.margins.top - this._attr.margins.bottom) + 'px';
        return this;
    }

    /**
     * Sets the main font size. All text elements in the widget are rescaled according to this value. Default is 14px.
     *
     * @method fontSize
     * @memberOf Widget
     * @param {number} size Size of the main font in pixels.
     * @returns {Widget} Reference to the  widget.
     */
    fontSize(size) {
        this._attr.font.size = size + 'px';
        return this;
    }

    /**
     * Sets the font color. Axis and other non-plot related elements also use this color. Default is black.
     *
     * @method fontColor
     * @memberOf Widget
     * @param {string} color Font color to set.
     * @returns {Widget} Reference to the widget.
     */
    fontColor(color) {
        this._attr.font.color = color;
        return this;
    }

    /**
     * Sets the color policy for the plots. Supported policies:
     * <ul>
     *     <li>Default color policy (no arguments): the default color scheme is used which is a combination of
     *     the qualitative color schemes Set 1 and Set 3 from Color Brewer.</li>
     *     <li>Single color (passing {string}): The specified color is used for all plots.</li>
     *     <li>Custom color mapping (passing an {object}): each plot has the color specified as the value for the
     *     property with the same name as the plot's key.</li>
     * </ul>
     * Default is null, that is the default color scheme.
     *
     * @method colors
     * @memberOf Widget
     * @param {?(string | object)} [policy = null] Color policy to set.
     * @returns {Widget} Reference to the widget.
     */
    colors(policy = null) {
        // Update color policy
        this._attr.colors.policy = policy;

        // Update color mapping
        if (policy === null) {
            // No color policy, using default
            this._attr.colors.mapping = Widget.defaultColors();
        } else if (typeof policy === 'string') {
            // Single color policy, using the specified color
            this._attr.colors.mapping = () => policy;
        } else {
            // Color mapping given
            this._attr.colors.mapping = (key) => policy[key];
        }
        return this;
    }

    /**
     * Binds a callback to the event of hovering a widget element. The behavior of this method is specific to the
     * widget type: for charts, it is bound to the plot elements and the plot's name is passed to the
     * specified callback as argument. This can be used as a selector for e.g, highlighting elements in the widget.
     * For the map it is bound to countries and the name of the country is passed as parameter. For standalone
     * widgets such as a label, it is bound to the widget itself. Default is {null} (no mouseover callback). Default
     * is null, that is, no callback.
     *
     * @method mouseover
     * @memberOf Widget
     * @param {?function} [callback = null] Callback to trigger on mouse over.
     * @returns {Widget} Reference to the widget.
     */
    mouseover(callback = null) {
        this._attr.mouse.enter = callback;
        return this;
    }

    /**
     * Binds a callback to the event of the mouse leaving various widget elements. The behavior of this method is
     * specific to the widget type: for charts, it is bound to the plot elements and the plot's name is
     * passed to the specified callback as argument. This can be used as a selector for e.g, highlighting elements
     * in the widget. For the map it is bound to countries and the name of the country is passed as parameter. For
     * standalone widgets such as a label, it is bound to the widget itself. Default is {null} (no mouseleave
     * callback). Default is null, that is, no callback.
     *
     * @method mouseleave
     * @memberOf Widget
     * @param {?function} [callback = null] Callback to trigger on mouse leave.
     * @returns {Widget} Reference to the widget.
     */
    mouseleave(callback = null) {
        this._attr.mouse.leave = callback;
        return this;
    }

    /**
     * Binds a callback to the event of clicking on a widget element. The behavior of this method is specific to the
     * widget type: for charts, it is bound to the plot elements and the plot's name is passed to the
     * specified callback as argument. This can be used as a selector for e.g, highlighting elements in the widget.
     * For the map it is bound to countries and the name of the country is passed as parameter. For standalone
     * widgets such as a label, it is bound to the widget itself. Default is {null} (no click callback). Default is
     * null, that is, no callback.
     *
     * @method click
     * @memberOf Widget
     * @param {?function} [callback = null] Callback to trigger on click.
     * @returns {Widget} Reference to the widget.
     */
    click(callback = null) {
        this._attr.mouse.click = callback;
        return this;
    }

    /**
     * Enables/disables tooltip for the widgets that support this function. Default is false.
     *
     * @method tooltip
     * @memberOf Widget
     * @param {boolean} [on = false] Whether tooltip should be enabled or not.
     * @returns {Widget} Reference to the widget.
     */
    tooltip(on = false) {
        this._attr.flags.tooltip = on;
        return this;
    }
}
