import { axisBottom, axisLeft } from 'd3-axis';
import 'd3-transition';

/**
 * Class implementing a standard chart axis.
 *
 * @class Axes
 * @param {Object} dom Object containing the chart's DOM elements.
 */
export default class Axes {
    constructor(dom) {
        this._dom = dom.container.append('g')
            .attr('class', 'axis-container');

        this._fn = {
            x: axisBottom().ticks(5),
            y: axisLeft().ticks(5)
        };

        this._axes = {
            x: this._dom.append('g')
                .attr('class', 'x axis'),
            y: this._dom.append('g')
                .attr('class', 'y axis')
        };

        this._labels = {
            x: this._dom.append('text')
                .attr('class', 'x axis-label')
                .attr('text-anchor', 'end')
                .attr('stroke-width', 0),
            y: this._dom.append('text')
                .attr('class', 'y axis-label')
                .attr('text-anchor', 'begin')
                .attr('stroke-width', 0)
        };
    }

    /**
     * Updates axes.
     *
     * @method update
     * @memberOf Axes
     * @param {Object} attr Object containing the widget attributes.
     * @param {Object} scales Object containing the scales for both axes.
     * @param {number} [duration = 700] Duration of animation in ms.
     */
    update(attr, scales, duration = 700) {
        // Container
        this._dom
          .transition().duration(duration)
            .attr('transform', 'translate(' + attr.margins.left + ',' + attr.margins.top + ')')
            .style('width', attr.size.innerWidth)
            .style('height', attr.size.innerHeight)
            .style('pointer-events', 'all');

        // Axes
        // X
        this._fn.x.tickFormat(attr.ticks.format.x);
        this._axes.x.transition().duration(duration)
            .call(this._fn.x.scale(scales.x.scale));
        this._axes.x.attr('transform', 'translate(0,' + parseFloat(attr.size.innerHeight) + ')');
        this._axes.x
            .selectAll('path')
            .style('fill', 'none')
            .style('stroke', attr.font.color)
            .style('stroke-width', '1px')
            .style('shape-rendering', 'crispEdges');

        // Y
        this._fn.y.tickFormat(attr.ticks.format.y);
        this._axes.y.transition().duration(duration)
            .call(this._fn.y.scale(scales.y.scale));
        this._axes.y.attr('transform', 'translate(0,' + 1 + ')');
        this._axes.y
            .selectAll('path')
            .style('fill', 'none')
            .style('stroke', attr.font.color)
            .style('stroke-width', '1px')
            .style('shape-rendering', 'crispEdges');

        // Labels
        this._labels.x.text(attr.labels.x)
            .transition().duration(duration)
            .attr('x', attr.size.innerWidth)
            .attr('y', (parseFloat(attr.size.innerHeight) + 2.2 * parseInt(attr.font.size)) + 'px')
            .attr('fill', attr.font.color)
            .style('font-size', attr.font.size);
        this._labels.y.text(attr.labels.y)
            .transition().duration(duration)
            .attr('x', 5 + 'px')
            .attr('y', (-5) + 'px')
            .attr('fill', attr.font.color)
            .style('font-size', attr.font.size);
    }
}