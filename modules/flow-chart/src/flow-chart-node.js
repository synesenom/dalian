import { select } from 'd3-selection';

class FlowChartNode {
    /**
     * Class implementing a flow chart node.
     *
     * @class FlowChartNode
     * @constructor
     * @param {Object} dom DOM element (d3 selection) to append node to.
     * @param {string} chartName Name of the chart to add the node to.
     * @param {string} nodeName Name of the node.
     * @param {Object} attr Object containing the node properties. Supported properties:
     * <ul>
     *     <li>{number[]} pos Array containing the (x, y) position of the node's center in pixels.</li>
     *     <li>{number[]} size Array containing the size (width and height) in pixels.</li>
     *     <li>{string} type Node type: rect.</li>
     * </ul>
     */
    constructor(dom, chartName, nodeName, attr) {
        // Add DOM element
        this.elem = dom.append('g')
            .attr('class', `flow-chart-node flow-chart-node-${name}`);

        // Set up base properties
        this.attr = {
            pos: attr && attr.pos ? attr.pos : [0, 0],
            size: attr && attr.size ? attr.size : [1, 1],
            type: attr && attr.type ? attr.type : 'rect'
        }
    }

    /**
     * Computes connectors for the node: these are the locations in the flow chart where edges can be connected to. Each node has eight connectors: north, northeast, east, southeast, south, southwest, west and northwest.
     *
     * @method _updateConnectors
     * @returns {FlowChartNode} Reference to the current node.
     * @private
     */
    _updateConnectors() {
        // North, east, south and west
        this.connectors = {
            north: [this.attr.pos[0], this.attr.pos[1] - 0.5 * this.attr.size[1]],
            east: [this.attr.pos[0] - 0.5 * this.attr.size[0], this.attr.pos[1]],
            south: [this.attr.pos[0], this.attr.pos[1] + 0.5 * this.attr.size[1]],
            west: [this.attr.pos[0] + 0.5 * this.attr.size[0], this.attr.pos[1]]
        };
        return this;
    }
}