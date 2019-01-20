import { encode } from '@dalian/widget';
import 'd3-transition';
import Vector from './vector2d';

// TODO add four more connectors
export default class FlowChartNode {
    /**
     * Class implementing a flow chart node.
     *
     * @class FlowChartNode
     * @constructor
     * @param {Object} dom DOM element (d3 selection) to append node to.
     * @param {string} name Name of the node.
     * @param {Vector} pos Position vector of the node center in pixels. Default is [0, 0].
     * @param {Vector} size Size vector of the node in pixels. Default is [1, 1].
     * @param {string} type Node type. Currently supported: rect.
     * @param {Object} attr Node attributes. Supported properties:
     * <ul>
     *     <li>{string} fill Fill color of the node. Default is white.</li>
     *     <li>{string} stroke Stroke color of the node. Default is #ddd.</li>
     *     <li>{string} label Node label. Default is an empty string.</li>
     * </ul>
     */
    constructor(dom, name, pos, size, type = 'rect', attr = {}) {
        // Identifier
        this._id = encode(name);

        // Type
        this._type = type;

        // Position and size
        this._pos = pos;
        this._size = size;

        // Modifiable attributes
        this._attr = {
            groups: attr.groups || [],
            fill: attr.fill || 'white',
            stroke: attr.stroke || '#ddd',
            label: attr.label || '',
            mouse: attr.mouse || {}
        };

        // Add DOM elements
        let g = dom.append('g')
                .attr('class', `flow-chart-elem flow-chart-node flow-chart-node-${this._id} ${this._attr.groups.map(d => 'flow-chart-group-' + encode(d)).join(' ')}`);

        // Box
        let corner = this._pos.sub(this._size.mult(0.5)),
            box = g.append(this._type)
                .attr('class', 'flow-chart-node-elem')
                .attr('x', corner.x)
                .attr('y', corner.y)
                .attr('width', this._size.x)
                .attr('height', this._size.y)
                .attr('rx', 5)
                .attr('ry', 5)
                .style('fill', 'transparent')
                .style('stroke', 'transparent')
                .style('stroke-width', '1px');

        // Label
        let dy = 15,
            lines = this._attr.label.split('\n'),
            label = g.append('text')
                .attr('class', 'flow-chart-node-label')
                .attr('x', this._pos.x)
                .attr('y', this._pos.y - dy * lines.length / 2)
                .attr('font-family', 'inherit')
                .attr('font-size', 'inherit')
                .style('text-anchor', 'middle')
                .style('pointer-events', 'none')
                .style('fill', 'transparent')
                .html('');
        lines.forEach(d => {
            label.append('tspan')
                .attr('x', this._pos.x)
                .attr('dy', dy)
                .attr('font-family', 'inherit')
                .attr('font-size', 'inherit')
                .text(d);
        });
        this._dom = {g, box, label};
    }

    stroke(color) {
        this._attr.stroke = color;
        return this;
    }

    fill(color) {
        this._attr.fill = color;
        return this;
    }

    label(text) {
        this._attr.label = text;
        return this;
    }

    groups(ids) {
        this._attr.groups = ids;
        return this;
    }

    mouse(mouse) {
        this._attr.mouse = mouse;
        return this;
    }

    remove(duration) {
        this._dom.g.transition().duration(duration || 0)
            .style('opacity', 0)
            .on('end', () => {
                this._dom.g.remove();
            });
    }

    update(duration) {
        // Group
        this._dom.g.attr('class', `flow-chart-elem flow-chart-node flow-chart-node-${this._id} ${this._attr.groups.map(d => 'flow-chart-group-' + encode(d)).join(' ')}`)
            .on('mouseover', () => {
                this._attr.mouse.enter && this._attr.mouse.enter(this._id, this._attr.groups, 'node');
            })
            .on('mouseleave', () => {
                this._attr.mouse.leave && this._attr.mouse.leave(this._id, this._attr.groups, 'node');
            })
            .on('click', () => {
                this._attr.mouse.click && this._attr.mouse.click(this._id, this._attr.groups, 'node');
            });

        // Node
        this._dom.box.transition().duration(duration)
            .style('fill', this._attr.fill)
            .style('stroke', this._attr.stroke);

        // Label
        this._dom.label.transition().duration(duration)
            .style('fill', 'black');
    }

    /**
     * Computes a connector for the node: these are the locations in the flow chart where edges can be connected to.
     *
     * @method connector
     * @memberOf FlowChartNode
     * @param {string} direction Connector's direction. Supported values are: north, east, south and west.
     * @returns {?Vector} Position vector of the selected connector.
     */
    connector(direction) {
        switch (direction) {
            case 'north':
                return this._pos.dy(-0.5 * this._size.y);
            case 'east':
                return this._pos.dx(0.5 * this._size.x);
            case 'south':
                return this._pos.dy(0.5 * this._size.y);
            case 'west':
                return this._pos.dx(-0.5 * this._size.x);
            default:
                return this._attr.pos;
        }
    }

    /**
     * Returns a normal vector for a direction.
     *
     * @method normal
     * @memberOf FlowChartNode
     * @param {string} direction Direction to return normal vector for.
     * @return {Vector} The normal vector.
     * @static
     */
    static normal(direction) {
        switch (direction) {
            case 'north':
                return new Vector(0, -1);
            case 'east':
                return new Vector(1, 0);
            case 'south':
                return new Vector(0, 1);
            case 'west':
                return new Vector(-1, 0);
            default:
                return null;
        }
    }
}