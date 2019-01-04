import { Scale, Axes, Chart } from '../../chart/src/index';
import { line } from 'd3-shape';
import { Widget } from '@dalian/widget';

export class LineChart extends Chart {
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

        // Initialize widget state variables
        this._state = {
            transition: false
        };

        // Build scale and axes
        this._dom.scales = {
            x: new Scale('linear'),
            y: new Scale('linear')
        };
        this._dom.axes = new Axes(this._dom);
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

        // Update scales
        this._dom.scales.x.update(flatData.map(d => d.x), [0, parseInt(this._attr.size.innerWidth)]);
        this._dom.scales.y.update(flatData.map(d => d.y), [parseInt(this._attr.size.innerHeight), 0]);

        // Update axes
        this._dom.axes.update(this._attr, this._dom.scales);
        return;

        /// DEBUG ///
        const lineFn = line()
            .x(d => this._dom.scales.x.scale(d.x) + 2)
            .y(d => this._dom.scales.y.scale(d.y));
        /*
        this._dom.lines = this._dom.plots.selectAll(".line")
            .data(this._data, d => d.name);
        this._dom.lines.exit()
            .transition().duration(700)
            .style("opacity", 0)
            .remove();
        this._dom.lines.enter()
            .append("path")
            .attr("class", d => "line " + Widget.encode(d.name))
            .style("shape-rendering", "geometricPrecision")
            .style("opacity", 0)
            .style("fill", "none")
            .merge(this._dom.lines)
            .each(() => {
                this._state.transition = true;
            })
            .on("mouseover", d => {
                this._attr.mouse.enter && this._attr.mouse.enter(d.name);
            })
            .on("mouseleave", d => {
                this._attr.mouse.leave && this._attr.mouse.leave(d.name);
            })
            .on("click", d => {
                this._attr.mouse.click && this._attr.mouse.click(d.name);
            })
            .transition().duration(700)
            .style("opacity", 1)
            .attr("d", d => lineFn(d.values))
            .style("stroke-width", "2px")
            .style("stroke-dasharray", d => this._attr.lineStyles.mapping(d.name))
            .style("stroke", d => this._attr.colors.mapping(d.name))
            .on("end", () => {
                this._state.transition = false;
            });*/
        this._dom.lines = this._plotGroups(this._dom.plots, {
            enter: g => g.append('path')
                .attr('class', d => 'line ' + Widget.encode(d.name))
                .attr('d', d => lineFn(d.values))
                .style('fill', 'none')
        });
    }
}
