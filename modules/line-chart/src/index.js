import { Axes, Chart, Scale } from '@dalian/chart';
import { select } from 'd3-selection';
import { line, area } from 'd3-shape';
import { bisector } from 'd3-array';
import Widget from '@dalian/widget';

export default class LineChart extends Chart {
    constructor(name, parent) {
        super('line', name, parent);

        // Chart specific attributes
        this._attr.range = {
            x: {
                min: null,
                max: null
            }
        };
        this._attr.labels = {
            x: '',
            y: ''
        };
        this._attr.lineStyles = {
            policy: null,
            mapping: () => null
        };

        // Build scale and axes
        this._dom.scales = {
            x: new Scale('linear'),
            y: new Scale('linear')
        };
        this._dom.axes = new Axes(this._dom);
        this._dom.paths = new Map();
    }

    xLabel(text) {
        this._attr.labels.x = text;
        return this;
    }

    yLabel(text) {
        this._attr.labels.y = text;
        return this;
    }

    /**
     * Sets the line style policy for the plots in a similar fashion as {Widget.colors}. Supported policies:
     * <ul>
     *     <li>Default line style policy (no arguments): the default line style is used which is solid.</li>
     *     <li>Single line style (passing {string}): The specified style is used for all plots. Possible values: solid, dashed, dotted.</li>
     *     <li>Custom line style mapping (passing an {object}): each plot has the line style specified as the value for the
     *     property with the same name as the plot's key.</li>
     * </ul>
     * Default is null, that is the default line style.
     *
     * @method lineStyle
     * @memberOf LineChart
     * @param {?(string | object)} [policy = null] Line style policy to set.
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

    highlight(key, duration) {
        this._highlight('.line', key, duration);
        this._highlight('.error', key, duration);
    }

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

        /// DEBUG ///
        const lineFn = line()
            .x(d => this._dom.scales.x.scale(d.x) + 2)
            .y(d => this._dom.scales.y.scale(d.y));
        const errorFn = area()
          .x(d => this._dom.scales.x.scale(d.x) + 2)
          .y0(d => this._dom.scales.y.scale(Math.max(yMin, d.y - d.lo)))
          .y1(d => this._dom.scales.y.scale(Math.min(yMax, d.y + d.hi)));

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
                      this._dom.paths.set(d.name, select(`.${Widget.encode(d.name)}`).node());
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
    }

    /**
     * Finds the Y coordinate of a point on a path given its X coordinate.
     * Source: https://stackoverflow.com/questions/15578146/get-y-coordinate-of-point-along-svg-path-with-given-an-x-coordinate
     *
     * @method findY
     * @memberOf LineChart
     * @param {Object} path SVG path element.
     * @param {number} x The X coordinate of the point.
     * @returns {(undefined|number)} The corresponding Y coordinate of the point on the path.
     * @static
     */
    static findY(path, x) {
        if (typeof path === 'undefined') {
            return undefined;
        }
        console.log(path);
        let pathLength = path.getTotalLength();
        let start = 0;
        let end = pathLength;
        let target = (start + end) / 2;

        x = Math.max(x, path.getPointAtLength(0).x);
        x = Math.min(x, path.getPointAtLength(pathLength).x);

        while (target >= start && target <= pathLength) {
            let pos = path.getPointAtLength(target);

            if (Math.abs(pos.x - x) < 0.0001) {
                return pos.y;
            } else if (pos.x > x) {
                end = target;
            } else {
                start = target;
            }
            target = (start + end) / 2;
        }
    }

    _chartTooltipContent(mouse) {
        // TODO Clean up code
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
            /*et y = LineChart.findY(this._dom.paths.get(d.name), mouse[0]);
            if (typeof y === 'number') {
                tt[d.name] = tt[d.name] || this._dom.plots.append('circle');
                tt[d.name]
                  .attr('cx', mouse[0])
                  .attr('cy', y)
                  .attr('r', 4)
                  .style('fill', this._attr.colors.mapping(d.name));
            }*/

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
}
