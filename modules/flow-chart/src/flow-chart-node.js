import { encode } from '@dalian/widget';
import 'd3-transition';

// TODO add four more connectors
export default class FlowChartNode {
    /**
     * Class implementing a flow chart node.
     *
     * @class FlowChartNode
     * @constructor
     * @param {Object} dom DOM element (d3 selection) to append node to.
     * @param {string} name Name of the node.
     * @param {string} type Node type. Currently supported: rect.
     * @param {Object} attr Node attributes. Supported properties:
     * <ul>
     *     <li>{number[]} pos Position of the node center in pixels. Default is [0, 0].</li>
     *     <li>{number[]} size Size of the node in pixels. Default is [1, 1].</li>
     *     <li>{string} fill Fill color of the node. Default is white.</li>
     *     <li>{string} stroke Stroke color of the node. Default is #ddd.</li>
     *     <li>{string} label Node label. Default is an empty string.</li>
     * </ul>
     */
    constructor(dom, name, type = 'rect', attr = {}) {
        // Set up base properties
        this._type = type;
        this._id = encode(name);

        this._attr = {
            pos: attr.pos || [0, 0],
            size: attr.size || [1, 1],
            fill: attr.fill || 'white',
            stroke: attr.stroke || '#ddd',
            label: attr.label || ''
        };

        // Add DOM element
        let g = dom.append('g')
                .attr('class', `flow-chart-node flow-chart-node-${this._id}`),
            elem = g.append(this._type)
                .attr('class', 'flow-chart-node-elem')
                .style('fill', 'transparent')
                .style('stroke', 'transparent')
                .style('stroke-width', '1px'),
            label = g.append('text')
                .attr('class', 'flow-chart-node-label')
                .style('text-anchor', 'middle')
                .style('pointer-events', 'none')
                .style('fill', 'transparent')
                .attr('font-family', 'inherit')
                .attr('font-size', 'inherit');
        this._dom = {elem, label};
    }

    get id() {
        return this._id;
    }

    update(duration) {
        // Node
        this._dom.elem.transition().duration(duration)
            .attr('x', this._attr.pos[0] - 0.5 * this._attr.size[0])
            .attr('y', this._attr.pos[1] - 0.5 * this._attr.size[1])
            .attr('width', this._attr.size[0])
            .attr('height', this._attr.size[1])
            .style('fill', this._attr.fill)
            .style('stroke', this._attr.stroke);
        if (this._type === 'rect') {
            this._dom.elem.attr('rx', 5)
                .attr('ry', 5);
        }

        // Label
        let dy = 15,
            lines = this._attr.label.split('\n');
        this._dom.label.html('')
            .attr('x', this._attr.pos[0])
            .attr('y', this._attr.pos[1] - dy * lines.length / 2)
            .style('fill', 'transparent');
        lines.forEach(d => {
            this._dom.label.append('tspan')
                .attr('x', this._attr.pos[0])
                .attr('dy', dy)
                .attr('font-family', 'inherit')
                .attr('font-size', 'inherit')
                .text(d);
        });
        this._dom.label.transition().duration(duration)
            .style('fill', 'black');
    }

    /**
     * Computes a connector for the node: these are the locations in the flow chart where edges can be connected to.
     *
     * @method connector
     * @memberOf FlowChartNode
     * @param {string} direction Connector's direction. Supported values are: north, east, south and west.
     * @returns {?number[]} Position of the selected connector.
     */
    connector(direction) {
        switch (direction) {
            case 'north':
                return [this._attr.pos[0], this._attr.pos[1] - 0.5 * this._attr.size[1]];
            case 'east':
                return [this._attr.pos[0] - 0.5 * this._attr.size[0], this._attr.pos[1]];
            case 'south':
                return [this._attr.pos[0], this._attr.pos[1] + 0.5 * this._attr.size[1]];
            case 'west':
                return [this._attr.pos[0] + 0.5 * this._attr.size[0], this._attr.pos[1]];
            default:
                return null;
        }
    }
}