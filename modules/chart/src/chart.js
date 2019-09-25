import { select } from 'd3-selection';
import { scaleLinear, scaleBand, scalePoint } from 'd3-scale';
import { axisBottom, axisLeft } from 'd3-axis';
import { Widget } from '@dalian/widget';

export default class Chart extends Widget {
    /**
     * Class implementing a generic chart widget.
     *
     * @class Chart
     * @constructor
     * @param {string} type Chart type. Should be set by the child class.
     * @param {string} name The name of the current chart widget. Must be a unique identifier.
     * @param {string} [parent = body] The parent DOM element that this widget will be added.
     * @returns {Chart} Reference to the chart.
     */
    constructor(type, name, parent) {
        // Call Widget constructor
        super('chart-' + type, name, parent);

        // Add chart specific attributes
        this._attr.labels = {
            x: '',
            y: ''
        };
        this._attr.ticks = {
            format: {
                single: Widget.defaultFormat(),
                x: Widget.defaultFormat(),
                y: Widget.defaultFormat()
            }
        };

        // Chart state
        this._state = {
            transition: false
        };

        // Add chart specific dom elements
        this._dom.plots = this._dom.container.append('g')
            .attr('class', 'plots-container');

        // Data to plot
        this._data = [];
    }

    /**
     * Builds a single scale object.
     * @param type
     * @return {{g: (function()), update: (function(*=, *=))}}
     */
    static scaleFactory(type) {
        let _scale;

        // Set type and domain
        switch (type) {
            default:
            case 'linear':
                _scale = scaleLinear();
                break;
            case 'band':
                _scale = scaleBand()
                    .padding(0.1);
                break;
            case 'point':
                _scale = scalePoint()
                    .padding(0.5);
        }

        // Return scale and an update method
        return {
            g: () => {
                return _scale;
            },
            update: (values, range) => {
                switch (type) {
                    default:
                    case 'linear':
                        _scale.domain([Math.min(...values), Math.max(...values)]);
                        break;
                    case 'band':
                    case 'point':
                        _scale.domain(values);
                        break;
                }

                range && _scale.range(range);
            }
        };
    }

    /**
     * Builds a standard axis for charts with two axes.
     *
     * @method _axis
     * @memberOf Chart
     * @returns {Object} Object containing the axis functions, axes and labels as well as an update method to
     * conveniently update the axes.
     * @static
     */
    static axisFactory(dom) {
        let g = dom.container
            .append('g')
            .attr('class', 'axis-container');

        let axisFn = {
            x: axisBottom(null)
                .ticks(5),
            y: axisLeft(null)
                .ticks(5)
        };

        let axes = {
            x: g.append('g')
                .attr('class', 'x axis'),
            y: g.append('g')
                .attr('class', 'y axis')
        };

        let labels = {
            x: g.append('text')
                .attr('class', 'x axis-label')
                .attr('text-anchor', 'end')
                .attr('stroke-width', 0),
            y: g.append('text')
                .attr('class', 'y axis-label')
                .attr('text-anchor', 'begin')
                .attr('stroke-width', 0)
        };

        return {
            g: () => {
                return g;
            },
            update: (attr, scales) => {
                // Container
                g.attr('transform', 'translate(' + attr.margins.left + ',' + attr.margins.top + ')')
                    .style('width', attr.size.innerWidth)
                    .style('height', attr.size.innerHeight)
                    .style('pointer-events', 'all');

                // Axes
                axes.x.transition().duration(700)
                    .call(axisFn.x.scale(scales.x.g()));
                axes.y.transition().duration(700)
                    .call(axisFn.y.scale(scales.y.g()));

                axisFn.x.tickFormat(attr.ticks.format.x);
                axes.x.attr('transform', 'translate(0,' + parseFloat(attr.size.innerHeight) + ')');
                axisFn.y.tickFormat(attr.ticks.format.y);
                axes.y.attr('transform', 'translate(0,' + 1 + ')');

                // Labels
                labels.x.attr('x', attr.size.innerWidth)
                    .attr('y', (parseFloat(attr.size.innerHeight) + 2.2 * parseInt(attr.font.size)) + 'px')
                    .attr('fill', attr.font.color)
                    .style('font-size', attr.font.size)
                    .text(attr.labels.x);
                labels.y.attr('x', 5 + 'px')
                    .attr('y', (-5) + 'px')
                    .attr('fill', attr.font.color)
                    .style('font-size', attr.font.size)
                    .text(attr.labels.y);
            }
        };
    }

    /**
     * Sets the format function for the ticks.
     * Default is an SI prefixed number for values above 1 and the number itself below.
     *
     * @method tickFormat
     * @memberOf Chart
     * @param {Function} format Format function to set.
     * @returns {Chart} Reference to the current chart.
     */
    tickFormat(format) {
        this._attr.ticks.format.single = format !== null && format !== undefined ? format : Widget.defaultFormat();
        return this;
    }

    /**
     * Sets the format function for the horizontal ticks.
     * Default is an SI prefixed number for values above 1 and the number itself below.
     *
     * @method xTickFormat
     * @memberOf Chart
     * @param {Function} format Format function to set.
     * @returns {Chart} Reference to the current chart.
     */
    xTickFormat(format) {
        this._attr.ticks.format.x = format !== null && format !== undefined ? format : Widget.defaultFormat();
        return this;
    }

    /**
     * Sets the format function for the vertical ticks.
     * Default is an SI prefixed number for values above 1 and the number itself below.
     *
     * @method yTickFormat
     * @memberOf Chart
     * @param {Function} format Format function to set.
     * @returns {Chart} Reference to the current chart.
     */
    yTickFormat(format) {
        this._attr.ticks.format.y = format !== null && format !== undefined ? format : Widget.defaultFormat();
        return this;
    }

    /**
     * Binds data to the chart.
     *
     * @method data
     * @memberOf Chart
     * @param {Array} values Data as an array of objects.
     * @returns {Chart} Reference to the current chart.
     * @ignore
     */
    data(values) {
        // Transform data to the standard internal structure
        this._data = this._transformData(values);

        // Reset color mapping if it is set to default
        if (this._attr.colors.policy === null || this._attr.colors.policy === undefined) {
            this._attr.colors.mapping = Widget.defaultColors();
        }

        // Switch render flag
        return this;
    }

    /**
     * Converts arbitrary data array in the internal data structure. Must be overridden.
     *
     * @method _transformData
     * @memberOf Chart
     * @param {Array} values Array of values.
     * @returns {Array} Array containing the converted data in the internal structure.
     */
    _transformData(values) {
        throw Error('_transformData is not implemented');
    }

    _chartUpdate() {
        throw Error('_chartUpdate is not implemented');
    }

    _chartTooltipContent(mouse) {
    }

    /**
     * Generates plot groups from the internal data.
     *
     * @method _plotGroups
     * @memberOf Chart
     * @param {Object} g The widget container's DOM selection.
     * @param {Object} attr Attributes/style settings for the groups in different stages. Each property is a function
     * that has one parameter (the selection) and returns the same selection after attribute/style modifications.
     * Supported properties
     * <ul>
     *     <li>{Function} enter Attributes/styles on the entering groups.</li>
     *     <li>{Function} exit Attributes/styles on the exiting groups.</li>
     *     <li>{Function} union.before Attributes/styles on the union of groups before transition.</li>
     *     <li>{Function} union.after Attributes/styles on the union of groups after transition.</li>
     * </ul>
     * @returns {Object} Object containing four selections of groups: enter, exit, union before transition and union after transition.
     * @protected
     */
    _plotGroups(g, attr) {
        // Select groups
        let groups = g.selectAll('.plot-group')
          .data(this._data, d => d.name);

        // Exiting groups: simply fade out
        let exit = groups.exit()
          .transition().duration(700)
          .style('opacity', 0)
          .remove();

        // Entering groups: starting transparent
        let enter = groups.enter().append('g')
          .attr('class', d => `plot-group ${Widget.encode(d.name)}`)
          .style('shape-rendering', 'geometricPrecision')
          .style('opacity', 0)
          .style('fill', 'transparent')
          .style('stroke', 'transparent');
        if (attr && attr.enter) {
            enter = attr.enter(enter);
        }

        // Union: attach mouse events
        let that = this;
        let union = enter.merge(groups)
          .each(() => {
              // Disable pointer events before transition
              g.style('pointer-events', 'none');
              this._state.transition = true;
          })
          .on('mouseover', d => {
              that._attr.mouse.enter && that._attr.mouse.enter(d);
          })
          .on('mouseleave', d => {
              that._attr.mouse.leave && that._attr.mouse.leave(d);
          })
          .on('click', d => {
              that._attr.mouse.click && that._attr.mouse.click(d);
          });
        if (attr && attr.union && attr.union.before) {
            union = attr.union.before(union);
        }

        // Animate new state
        let unionAnimated = union.transition().duration(700)
          .style('opacity', 1)
          .style('fill', d => that._attr.colors.mapping(d.name))
          .style('stroke', d => that._attr.colors.mapping(d.name));
        if (attr && attr.union && attr.union.after) {
            unionAnimated = attr.union.after(unionAnimated);
        }
        unionAnimated.on('end', () => {
            // Re-enable pointer events
            g.style('pointer-events', 'all');
            this._state.transition = false;
        });

        return {
            groups: groups,
            enter: enter,
            exit: exit,
            union: {
                before: union,
                after: unionAnimated
            }
        };
    }

    /**
     * Highlight one or more elements in the chart.
     *
     * @method highlight
     * @memberOf Chart
     * @param {string} selector Selector of the widget elements.
     * @param {(string|string[])} key Single key or an array of keys of the element(s) to highlight.
     * @param {number} duration Duration of the highlight animation.
     * @returns {Chart} Reference to the current chart.
     * @protected
     */
    _highlight(selector, key, duration) {
        // If currently animated, don't highlight
        if (this._state.transition) {
            return this;
        }

        // Stop current transitions
        let elems = this._dom.plots.selectAll(selector);
        elems.transition();

        // Perform highlight
        if (typeof key === 'string') {
            // Single key
            elems.transition().duration(duration ? duration : 0)
              .style('opacity', function () {
                  return select(this).classed(Widget.encode(key)) ? 1 : 0.1;
              });
        } else if (Array.isArray(key)) {
            // Multiple keys
            let keys = key.map(function (d) {
                return Widget.encode(d);
            });
            elems.transition().duration(duration ? duration : 0)
              .style('opacity', function () {
                  let elem = select(this);
                  return keys.reduce(function (s, d) {
                      return s || elem.classed(d);
                  }, false) ? 1 : 0.1;
              });
        } else {
            // Remove highlight
            elems.transition().duration(duration ? duration : 0)
              .style('opacity', 1);
        }
        return this;
    }

    _update() {
        // Chart specific update
        this._chartUpdate();

        // Adjust plots container
        this._dom.plots.attr('width', this._attr.size.innerWidth + 'px')
          .attr('height', this._attr.size.innerHeight + 'px')
          .attr('transform', 'translate(' + this._attr.margins.left + ',' + this._attr.margins.top + ')');
    }

    _tooltip(mouse) {
        let content = this._chartTooltipContent(mouse);
        if (content === null) {
            return null;
        }
        console.log(content);

        // Erase tooltip content and add title
        let contentNode = select(document.createElement('div'));
        contentNode
          .style('border-r', '2px')
          .style('padding', '5px')
          .append('div')
          .style('position', 'relative')
          .style('width', 'calc(100% - 10px)')
          .style('line-height', '11px')
          .style('margin', '5px')
          .style('margin-bottom', '10px')
          .text(content.title);

        // Add color
        contentNode.style('border-left', content.stripe ? 'solid 2px ' + content.stripe : null);

        // Add content
        switch (content.content.type) {
            case 'metrics':
                // List of metrics
                content.content.data.forEach(function (row) {
                    let entry = contentNode.append('div')
                      .style('position', 'relative')
                      .style('display', 'block')
                      .style('width', 'auto')
                      .style('height', '10px')
                      .style('margin', '5px');
                    entry.append('div')
                      .style('position', 'relative')
                      .style('float', 'left')
                      .style('color', '#888')
                      .html(row.label);
                    entry.append('div')
                      .style('position', 'relative')
                      .style('float', 'right')
                      .style('margin-left', '10px')
                      .html(row.value);
                });
                break;
            case 'plots':
                // List of plots
                content.content.data.sort(function (a, b) {
                    return a.name.localeCompare(b.name);
                }).forEach(function (plot) {
                    let entry = contentNode.append('div')
                      .style('position', 'relative')
                      .style('max-width', '150px')
                      .style('height', '10px')
                      .style('margin', '5px')
                      .style('padding-right', '10px');
                    entry.append('div')
                      .style('position', 'relative')
                      .style('width', '9px')
                      .style('height', '9px')
                      .style('float', 'left')
                      .style('background-color', plot.color);
                    entry.append('span')
                      .style('position', 'relative')
                      .style('width', 'calc(100% - 20px)')
                      .style('height', '10px')
                      .style('float', 'right')
                      .style('line-height', '11px')
                      .html(plot.value);
                });
                break;
        }

        return contentNode.node().outerHTML;
    }
}