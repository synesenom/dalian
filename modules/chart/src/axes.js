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
        this.group = dom.container.append('g')
            .attr('class', 'axis-container');

        this.fn = {
            x: axisBottom().ticks(5),
            y: axisLeft().ticks(5)
        };

        this.axes = {
            x: this.group.append('g')
                .attr('class', 'x axis'),
            y: this.group.append('g')
                .attr('class', 'y axis')
        };

        this.labels = {
            x: this.group.append('text')
                .attr('class', 'x axis-label')
                .attr('text-anchor', 'end')
                .attr('stroke-width', 0),
            y: this.group.append('text')
                .attr('class', 'y axis-label')
                .attr('text-anchor', 'begin')
                .attr('stroke-width', 0)
        };
    }

    /**
     * Returns the axis d3-selection object.
     *
     * @property g
     * @memberOf Axes
     * @return {Object} D3 selection.
     */
    get g() {
        return this.group;
    }

    /**
     * Updates axes.
     *
     * @method update
     * @memberOf Axes
     * @param {Object} attr Object containing the widget attributes.
     * @param {Object} scales Object containing the scales for both axes.
     */
    update(attr, scales) {
        // Container
        this.group.attr('transform', 'translate(' + attr.margins.left + ',' + attr.margins.top + ')')
            .style('width', attr.size.innerWidth)
            .style('height', attr.size.innerHeight)
            .style('pointer-events', 'all');

        // Axes
        this.axes.x.transition().duration(700)
            .call(this.fn.x.scale(scales.x.g));
        this.axes.x.attr('transform', 'translate(0,' + parseFloat(attr.size.innerHeight) + ')');
        this.axes.x
            .selectAll('path')
            .style('fill', 'none')
            .style('stroke', attr.font.color)
            .style('stroke-width', '1px')
            .style('shape-rendering', 'crispEdges');
        this.axes.y.transition().duration(700)
            .call(this.fn.y.scale(scales.y.g));
        this.axes.y.attr('transform', 'translate(0,' + 1 + ')');
        this.axes.y
            .selectAll('path')
            .style('fill', 'none')
            .style('stroke', attr.font.color)
            .style('stroke-width', '1px')
            .style('shape-rendering', 'crispEdges');

        // Ticks
        this.fn.x.tickFormat(attr.ticks.format.x);
        this.fn.y.tickFormat(attr.ticks.format.y);


        // Labels
        this.labels.x.attr('x', attr.size.innerWidth)
            .attr('y', (parseFloat(attr.size.innerHeight) + 2.2 * parseInt(attr.font.size)) + 'px')
            .attr('fill', attr.font.color)
            .style('font-size', attr.font.size)
            .text(attr.labels.x);
        this.labels.y.attr('x', 5 + 'px')
            .attr('y', (-5) + 'px')
            .attr('fill', attr.font.color)
            .style('font-size', attr.font.size)
            .text(attr.labels.y);
    }
}