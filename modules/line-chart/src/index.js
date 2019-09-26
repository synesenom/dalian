import { Axes, Chart, Scale } from '@dalian/chart';
import { select } from 'd3-selection';
import { line, area, curveMonotoneX, curveLinear } from 'd3-shape';
import { bisector } from 'd3-array';
import Widget from '@dalian/widget';

// TODO pin
// TODO Add duration properly to render and all animations

export default class LineChart extends Chart {
    constructor(name, parent) {
        super('line', name, parent);

        // Line chart specific attributes
        this._attr.lineStyles = {
            policy: null,
            mapping: () => null
        };
        this._attr.smooth = false;

        // Build scale and axes
        this._dom.scales = {
            x: new Scale('linear'),
            y: new Scale('linear')
        };
        this._dom.axes = new Axes(this._dom);

        // Paths for finding the tooltip markers
        this._dom.paths = new Map();

        // Markers
        this._dom.markers = new Map();
    }

    /**
     * Sets the line style policy for the plots in a similar fashion as {Widget.colors}. Supported policies:
     * <ul>
     *     <li>Default line style policy (no arguments): the default line style is used which is solid.</li>
     *     <li>Single line style (passing {string}): The specified style is used for all plots. Possible values: solid, dashed, dotted.</li>
     *     <li>Custom line style mapping (passing an {object}): each plot has the line style specified as the value for the
     *     property with the same name as the plot's key.</li>
     * </ul>
     *
     * @method lineStyle
     * @methodOf LineChart
     * @param {(string | Object)} [policy = null] Line style policy to set.
     * @returns {LineChart} Reference to the line chart.
     */
    lineStyles(policy = null) {
        // Update line style policy
        this._attr.lineStyles.policy = policy;

        // Update line style mapping
        if (policy === null) {
            this._attr.lineStyles.mapping = () => null;
        } else if (typeof policy === 'string') {
            this._attr.lineStyles.mapping = () => {
                switch (policy) {
                    default:
                    case 'solid':
                        return null;
                    case 'dashed':
                        return '4 4';
                    case 'dotted':
                        return '2 5';
                }
            };
        } else {
            this._attr.lineStyles.mapping = key => {
                switch (policy[key]) {
                    default:
                    case 'solid':
                        return null;
                    case 'dashed':
                        return '4 4';
                    case 'dotted':
                        return '2 5';
                }
            };
        }
        return this;
    }

    /**
     * Adds smoothing to the curves and error bands. Smoothing is done by using Catmull-Rom splines for each curve.
     *
     * @method smooth
     * @methodOf LineChart
     * @param {boolean} [on = false] Whether to add smoothing to the curves.
     * @returns {LineChart} Reference to the line chart.
     */
    smooth(on = false) {
        this._attr.smooth = on;
        return this;
    }

    /**
     * Highlights a line plot along with its markers.
     *
     * @method highlight
     * @methodOf LineChart
     * @param {(string | string[]|null)} [key] String or array of strings denoting the line to highlight. If null is
     * passed, the highlight is removed.
     * @param {number} [duration = 400] Duration of the rendering animation in ms.
     * @returns {LineChart} Reference to the line chart.
     */
    highlight(key, duration = 400) {
        this._highlight('.line', key, duration);
        this._highlight('.error', key, duration);
        this._highlight('.tooltip-marker', key, duration);
        this._highlight('.marker', key, duration);
        return this;
    }

    /**
     * Adjusts marker position.
     *
     * @method _adjustMarker
     * @methodOf LineChart
     * @param {string} key Identifier of the marker.
     * @param {(number | string)} start Start X position of the marker.
     * @param {(number | string)} end End X position of the marker.
     * @returns {?Object} New marker descriptor if marker exists and could be adjusted, null otherwise.
     * @private
     */
    _adjustMarker(key, start, end) {
        // TODO Clean up code to make it es6
        // Get data
        let data = this._data.filter(d => d.name === key)[0];
        if (!data) {
            return null;
        }

        // Get marker data point indices
        let bisect = bisector(d => d.x).left;
        let i1 = bisect(data.values, start);
        let i2 = bisect(data.values, end);
        if (i1 === null || i2 === null) {
            return null;
        }

        // Get coordinates and color
        let x1 = data.values[i1].x,
          y1 = data.values[i1].y,
          x2 = data.values[i2].x,
          y2 = data.values[i2].y;
        let xCorner = y1 < y2 ? x1 : x2;
        let yCorner = y1 < y2 ? y2 : y1;

        return {
            start: {
                x: x1,
                y: y1
            },
            end: {
                x: x2,
                y: y2
            },
            corner: {
                x: xCorner,
                y: yCorner
            }
        };
    }

    /**
     * Adds a marker to the specified line. A marker is a text along with a 90-degree angle connecting two points of a
     * line. If a marker with the specified identifier already exists, the marker is ignored.
     *
     * @method addMarker
     * @methodOf LineChart
     * @param {string} id Marker identifier.
     * @param {string} key Key of the line to mark.
     * @param {(number | string)} start Start X position of the marker.
     * @param {(number | string)} end End X position of the marker.
     * @param {string} label Label of the marker.
     * @returns {?Object} D3 selection of the marker if it could be added, null otherwise.
     */
    addMarker (id, key, start, end, label) {
        // TODO Clean up code to make it es6
        // Check if marker exists
        if (this._dom.markers.has(id)) {
            return null;
        }

        let pos = this._adjustMarker(key, start, end);
        let g = this._dom.plots.append('g')
          .attr('class', 'marker ' + Widget.encode(key));
        g.append('line')
          .attr('class', 'horizontal')
          .attr('x1', this._dom.scales.x.scale(Math.max(pos.start.x, pos.start.x)) + 2)
          .attr('y1', this._dom.scales.y.scale(pos.corner.y))
          .attr('x2', this._dom.scales.x.scale(Math.min(pos.end.x, pos.end.x)) + 2)
          .attr('y2', this._dom.scales.y.scale(pos.corner.y))
          .style('stroke', this._attr.colors.mapping(key))
          .style('stroke-dasharray', '3 3')
          .style('stroke-width', 1);
        g.append('line')
          .attr('class', 'vertical')
          .attr('x1', this._dom.scales.x.scale(pos.corner.x) + 2)
          .attr('y1', this._dom.scales.y.scale(pos.start.y))
          .attr('x2', this._dom.scales.x.scale(pos.corner.x) + 2)
          .attr('y2', this._dom.scales.y.scale(pos.end.y))
          .style('stroke', this._attr.colors.mapping(key))
          .style('stroke-dasharray', '3 3')
          .style('stroke-width', 1);
        g.append('circle')
          .attr('class', 'start')
          .attr('cx', this._dom.scales.x.scale(pos.start.x) + 2)
          .attr('cy', this._dom.scales.y.scale(pos.start.y))
          .attr('r', 4)
          .style('stroke', 'none')
          .style('fill', this._attr.colors.mapping(key));
        g.append('circle')
          .attr('class', 'end')
          .attr('cx', this._dom.scales.x.scale(pos.end.x) + 2)
          .attr('cy', this._dom.scales.y.scale(pos.end.y))
          .attr('r', 4)
          .style('stroke', 'none')
          .style('fill', this._attr.colors.mapping(key));
        g.append('text')
          .attr('x', this._dom.scales.x.scale(pos.corner.x) + 2)
          .attr('y', this._dom.scales.y.scale(pos.corner.y))
          .attr('dy', -5)
          .attr('text-anchor', pos.start.y < pos.end.y ? 'start' : 'end')
          .style('fill', this._attr.font.color)
          .style('font-family', 'inherit')
          .style('font-size', '0.9em')
          .text(label);

        let marker = {
            key: key,
            g: g,
            update: duration => {
                let pos = this._adjustMarker(key, start, end);
                g.select('.horizontal')
                  .transition().duration(duration)
                  .attr('x1', this._dom.scales.x.scale(Math.max(pos.start.x, pos.start.x)) + 2)
                  .attr('y1', this._dom.scales.y.scale(pos.corner.y))
                  .attr('x2', this._dom.scales.x.scale(Math.min(pos.end.x, pos.end.x)) + 2)
                  .attr('y2', this._dom.scales.y.scale(pos.corner.y))
                  .style('stroke', this._attr.colors.mapping(key));
                g.select('.vertical')
                  .transition().duration(duration)
                  .attr('x1', this._dom.scales.x.scale(pos.corner.x) + 2)
                  .attr('y1', this._dom.scales.y.scale(pos.start.y))
                  .attr('x2', this._dom.scales.x.scale(pos.corner.x) + 2)
                  .attr('y2', this._dom.scales.y.scale(pos.end.y))
                  .style('stroke', this._attr.colors.mapping(key));
                g.select('.start')
                  .transition().duration(duration)
                  .attr('cx', this._dom.scales.x.scale(pos.start.x) + 2)
                  .attr('cy', this._dom.scales.y.scale(pos.start.y))
                  .style('fill', this._attr.colors.mapping(key));
                g.select('.end')
                  .transition().duration(duration)
                  .attr('cx', this._dom.scales.x.scale(pos.end.x) + 2)
                  .attr('cy', this._dom.scales.y.scale(pos.end.y))
                  .style('fill', this._attr.colors.mapping(key));
                g.select('text')
                  .transition().duration(duration)
                  .attr('x', this._dom.scales.x.scale(pos.corner.x) + 2)
                  .attr('y', this._dom.scales.y.scale(pos.corner.y))
                  .attr('text-anchor', pos.start.y < pos.end.y ? 'start' : 'end')
                  .style('fill', this._attr.font.color);
            }
        };

        // Add to markers
        this._dom.markers.set(id, marker);

        // Return marker
        return marker;
    };

    /**
     * Removes a marker from the plot.
     *
     * @method removeMarker
     * @memberOf LineChart
     * @param {string} id Identifier of the marker to remove.
     * @returns {boolean} True if marker exists and could be removed, false otherwise.
     */
    removeMarker (id) {
        // TODO Clean up code to make it es6
        if (this._dom.markers.has(id)) {
            this._dom.markers.get(id).g.remove();
            delete this._dom.markers.delete(id);
            return true;
        }
        return false;
    };

    /**
     * Transforms the data that is bound to the chart.
     *
     * @method _transformData
     * @methodOf LineChart
     * @param {Object[]} data Array of objects representing the data to plot.
     * @returns {Object[]} The data properly converted to a format that is used internally.
     * @private
     */
    _transformData(data) {
        return data.map(function (d) {
            return {
                name: d.name,
                values: d.values.sort(function (a, b) {
                    return a.x - b.x;
                }).map(function (dd) {
                    return {
                        x: dd.x,
                        y: dd.y,
                        lo: dd.lo || 0,
                        hi: dd.hi || 0
                    };
                })
            };
        });
    }

    _chartUpdate() {
        // Collect all data points
        let flatData = this._data.reduce((acc, d) => acc.concat(d.values), []);
        let yData = flatData.map(d => d.y);
        let yMin = Math.min(...yData);
        let yMax = Math.max(...yData);

        // Update scales
        this._dom.scales.x.update(flatData.map(d => d.x), [0, parseInt(this._attr.size.innerWidth)]);
        this._dom.scales.y.update(flatData.map(d => d.y), [parseInt(this._attr.size.innerHeight), 0]);

        // Update axes
        this._dom.axes.update(this._attr, this._dom.scales);

        // Create line and error path functions
        const lineFn = line()
          .x(d => this._dom.scales.x.scale(d.x) + 2)
          .y(d => this._dom.scales.y.scale(d.y))
          .curve(this._attr.smooth ? curveMonotoneX : curveLinear);
        const errorFn = area()
          .x(d => this._dom.scales.x.scale(d.x) + 2)
          .y0(d => this._dom.scales.y.scale(Math.max(yMin, d.y - d.lo)))
          .y1(d => this._dom.scales.y.scale(Math.min(yMax, d.y + d.hi)))
          .curve(this._attr.smooth ? curveMonotoneX : curveLinear);

        // Add/update groups
        this._plotGroups(this._dom.plots, {
            enter: g => {
                // Add error bands
                g.append('path')
                  .attr('class', d => `error ${Widget.encode(d.name)}`)
                  .attr('d', d => errorFn(d.values))
                  .style('stroke', 'none')
                  .style('fill-opacity', 0.2);

                // Add lines
                g.append('path')
                  .attr('class', d => `line ${Widget.encode(d.name)}`)
                  .attr('d', d => lineFn(d.values))
                  .style('stroke-width', '2px')
                  .style('stroke-dasharray', d => {
                      return this._attr.lineStyles.mapping(d.name);
                  })
                  .style('fill', 'none')
                  .each(d => {
                      // Take paths for tooltip marker
                      this._dom.paths.set(d.name, select(`.line.${Widget.encode(d.name)}`).node());
                  });
                return g;
            },
            union: {
                after: g => {
                    // Update lines
                    g.select('.line')
                      .attr('d', d => lineFn(d.values));

                    // Update error bands
                    g.select('.error')
                      .attr('d', d => errorFn(d.values));
                    return g;
                }
            }
        });

        // Update markers
        this._dom.markers.forEach(marker => {
            marker.update(700);
        });
    }

    /**
     * Finds the Y coordinate of a point on a path given its X coordinate.
     * Source: https://stackoverflow.com/questions/15578146/get-y-coordinate-of-point-along-svg-path-with-given-an-x-coordinate
     *
     * @method findY
     * @memberOf LineChart
     * @param {Object} path SVG path element.
     * @param {number} x The X coordinate of the point.
     * @returns {(undefined | number)} The corresponding Y coordinate of the point on the path.
     * @static
     */
    static findY(path, x) {
        if (typeof path === 'undefined') {
            return undefined;
        }
        let pathLength = path.getTotalLength();
        let start = 0;
        let end = pathLength;
        let target = (start + end) / 2;

        x = Math.max(x, path.getPointAtLength(0).x);
        x = Math.min(x, path.getPointAtLength(pathLength).x);

        while (target >= start && target <= pathLength) {
            let pos = path.getPointAtLength(target);

            if (Math.abs(pos.x - x) < 0.01) {
                return pos.y;
            } else if (pos.x > x) {
                end = target;
            } else {
                start = target;
            }
            target = (start + end) / 2;
        }
    }

    _createTooltipContent(mouse) {
        // TODO Clean up code to make it es6
        // Get bisection
        let bisect = bisector(d => {
            return this._dom.scales.x.scale(d.x);
        }).left;
        let index = mouse ? this._data.map(d => {
            return bisect(d.values, mouse[0]);
        }) : null;

        // If no data point is found, just remove tooltip elements
        let tt;
        if (index === null) {
            for (let t in this.tt) {
                if (this.tt.hasOwnProperty(t))
                    this.tt[t].remove();
            }
            this.tt = null;
            return;
        } else {
            this.tt = this.tt || {};
            tt = this.tt;
        }

        // Get plots
        let x = this._dom.scales.x.scale.invert(mouse[0]);
        let plots = this._data.map((d, i) => {
            // Data point
            let j = index[i],
              data = d.values,
              left = data[j - 1] ? data[j - 1] : data[j],
              right = data[j] ? data[j] : data[j - 1],
              point = x - left.x > right.x - x ? right : left;
            x = point.x;

            // Marker
            let y = LineChart.findY(this._dom.paths.get(d.name), mouse[0]);
            if (typeof y === 'number') {
                tt[d.name] = tt[d.name] || this._dom.plots.append('circle');
                tt[d.name]
                  .attr('class', `tooltip-marker ${Widget.encode(d.name)}`)
                  .attr('cx', mouse[0])
                  .attr('cy', y)
                  .attr('r', 4)
                  .style('fill', this._attr.colors.mapping(d.name))
                  .style('pointer-events', 'none');
            }

            // TODO Add tooltip format
            return {
                name: d.name,
                color: this._attr.colors.mapping(d.name),
                dashed: this._attr.lineStyles.mapping(d.name) ? true : undefined,
                value: point.y
            };
        });

        return {
            title: x,
            content: {
                type: 'plots',
                data: plots
            }
        };
    }

    /**
     * Sets the X coordinate of the line chart. If negative, the chart's right side is measured from the right side of
     * the parent, otherwise it is measured from the left side.
     *
     * @method x
     * @method LineChart
     * @param {number} [value = 0] Value of the X coordinate in pixels.
     * @returns {LineChart} Reference to the line chart.
     */
    // x(value)

    /**
     * Sets the Y coordinate of the line chart. If negative, the chart's bottom side is measured from the bottom of the
     * parent, otherwise the top side is measured from the top.
     *
     * @method y
     * @method LineChart
     * @param {number} [value = 0] Value of the Y coordinate in pixels.
     * @returns {LineChart} Reference to the line chart.
     */
    // y(value)

    /**
     * Sets the width of the line chart (including it's margins). Also updates the inner width of the chart.
     *
     * @method width
     * @method LineChart
     * @param {number} [value = 300] Width value in pixels.
     * @returns {LineChart} Reference to the line chart.
     */
    // width(value)

    /**
     * Sets the height of the line chart (including it's margins). Also updates the inner height of the chart.
     *
     * @method height
     * @method LineChart
     * @param {number} [value = 200] Height value in pixels.
     * @returns {LineChart} Reference to the line chart.
     */
    // height(value)

    /**
     * Sets line chart's margins in pixels. Note that margins are included in width and thus height and effectively
     * shrink the plotting area.
     *
     * @method margins
     * @method LineChart
     * @param {(number | Object)} [margins = 0] A single number to set all sides to or an object specifying some of the
     * sides.
     * @returns {LineChart} Reference to the line chart.
     */
    // margins(margins)

    /**
     * Sets the main font size. All text elements in the chart are rescaled according to this value.
     *
     * @method fontSize
     * @method LineChart
     * @param {number} [size = 14] Size of the main font in pixels.
     * @returns {LineChart} Reference to the line chart.
     */
    // fontSize(size)

    /**
     * Sets the font color. Axis and other non-plot related elements also use this color.
     *
     * @method fontColor
     * @method LineChart
     * @param {string} [color = black] Font color to set.
     * @returns {LineChart} Reference to the line chart.
     */
    // fontColor(color)

    /**
     * Sets the color policy for the lines. Supported policies:
     * <ul>
     *     <li>Default color policy (no arguments): the default color scheme is used which is a combination of the
     *     qualitative color schemes Set 1 and Set 3 from Color Brewer.</li>
     *     <li>Single color (passing {string}): The specified color is used for all plots.</li>
     *     <li>Custom color mapping (passing an {object}): each plot has the color specified as the value for the
     *     property with the same name as the plot's key.</li>
     * </ul>
     * Defaults to {null}, which creates the default color scheme.
     *
     * @method colors
     * @method LineChart
     * @param {(string | Object)} [policy = null] Color policy to set.
     * @returns {LineChart} Reference to the line chart.
     */
    // colors(policy)

    /**
     * Binds a callback to the event of hovering a line.
     *
     * @method mouseover
     * @method LineChart
     * @param {Function} [callback = null] Callback to trigger on mouse over. May accept the line plot data as a
     * parameter. The plot data is an object having the {name} and {values} of the line.
     * @returns {LineChart} Reference to the line chart.
     */
    // mouseover(callback)

    /**
     * Binds a callback to the event of the mouse leaving a line.
     *
     * @method mouseleave
     * @method LineChart
     * @param {Function} [callback = null] Callback to trigger on mouse leave. May accept the line plot data as a
     * parameter. The plot data is an object having the {name} and {values} of the line.
     * @returns {LineChart} Reference to the line chart.
     */
    // mouseleave(callback)

    /**
     * Binds a callback to the event of clicking on a line.
     *
     * @method click
     * @method LineChart
     * @param {Function} [callback = null] Callback to trigger on mouse leave. May accept the line plot data as a
     * parameter. The plot data is an object having the {name} and {values} of the line.
     * @returns {LineChart} Reference to the line chart.
     */
    // click(callback)

    /**
     * Enables/disables tooltip.
     *
     * @method tooltip
     * @method LineChart
     * @param {boolean} [on = false] Whether tooltip should be enabled or not.
     * @returns {LineChart} Reference to the line chart.
     */
    // tooltip(on)

    /**
     * Renders the line chart. If called for the first time, the chart is built, otherwise this method updates the chart
     * with the attributes that have been changed since the last rendering.
     *
     * @method render
     * @methodOf LineChart
     * @param {number} [duration = 700] Duration of the rendering animation in ms.
     * @returns {LineChart} Reference to the line chart.
     */
    // render(duration)

    /**
     * Updates the data for the line chart.
     *
     * @method data
     * @methodOf LineChart
     * @param {Object[]} plots Array of objects with the following properties:
     * <ul>
     *   <li>{string} name: Name of the line.</li>
     *   <li>{Object[]} values: Array of objects representing the data to plot. Each item has an {x} and an {y} property.
     *   Optionally they can have properties {lo} and {hi} denoting the error band of the line.</li>
     * </ul>
     * @returns {LineChart} Reference to the line chart.
     */
    // data(plots)

    /**
     * Sets the X (horizontal) label of the plot.
     *
     * @method xLabel
     * @methodOf LineChart
     * @param {string} text Text to set X label to.
     * @returns {LineChart} Reference to the line chart.
     */
    // xLabel(text)

    /**
     * Sets the Y (vertical) label of the plot.
     *
     * @method yLabel
     * @methodOf LineChart
     * @param {string} text Text to set Y label to.
     * @returns {LineChart} Reference to the line chart.
     */
    // yLabel(text)

    /**
     * Sets the format function for the horizontal ticks.
     * Default is an SI prefixed number for values above 1 and the number itself below.
     *
     * @method xTickFormat
     * @memberOf Chart
     * @param {Function} format Format function to set.
     * @returns {LineChart} Reference to the line chart.
     */
    // xTickFormat

    /**
     * Sets the format function for the vertical ticks.
     * Default is an SI prefixed number for values above 1 and the number itself below.
     *
     * @method yTickFormat
     * @memberOf LineChart
     * @param {Function} format Format function to set.
     * @returns {LineChart} Reference to the line chart.
     */
    // yTickFormat(format)

    /**
     * Enables/disables description for the line chart. A description is a small tooltip that is bound to the
     * context menu (also disables default event handler). The description disappears once the mouse leaves the chart.
     * If called without argument, the description is disabled.
     *
     * @method description
     * @methodOf LineChart
     * @param {string} [content] Content of the description. Can be HTML formatted. If not provided, description is
     * disabled.
     * @returns {LineChart} Reference to the line chart.
     */
    // description(content)

    /**
     * Replaces the widget with a placeholder message positioned in the center of the original widget. If no placeholder
     * content is provided, the widget is recovered. Note: placeholder is shown even if the widget is not yet rendered.
     *
     * @method placeholder
     * @methodOf LineChart
     * @param {string} [content] Content of the placeholder. Can be HTML formatted. If omitted, the widget is shown.
     * @param {number} [duration = 700] Duration of the placeholder animation in ms.
     * @returns {LineChart} Reference to the line chart.
     */
    // placeholder(content, duration)
}
