import Vector from './vector2d';
import { encode, Widget } from '@dalian/widget';
import FlowChartNode from './flow-chart-node';
import FlowChartEdge from './flow-chart-edge';
import { select } from 'd3-selection';
import 'd3-transition';

export default class FlowChart extends Widget {
    constructor(name, parent) {
        // Call Widget constructor
        super('flow-chart', name, parent);

        // Add flow chart specific attributes
        this._attr.grid = [100, 100];

        // Add nodes and edges
        this._dom.nodes = new Map();
        this._dom.edges = new Map();
    }

    /**
     * Re-sizes flow chart grid. Note that all nodes and edges are removed.
     *
     * @method grid
     * @memberOf FlowChart
     * @param {number} width New grid width.
     * @param {number} height New grid height.
     * @return {FlowChart} Reference to the closest flow chart.
     */
    grid(width, height) {
        // Remove nodes
        this._dom.nodes.forEach(d => d.remove());
        this._dom.nodes.clear();

        // Remove edges
        this._dom.edges.forEach(d => d.remove());
        this._dom.edges.clear();

        // Update grid
        this._attr.grid = [width, height];
        return this;
    }

    node(name) {
        return this._dom.nodes.get(name);
    }

    addNode(name, attr) {
        // Check if we have node with the same name already
        if (this._dom.nodes.has(name)) {
            throw Error(`Node '${name}' already exists in flow chart`);
        }

        // Get grid dimensions
        let grid = {
            x0: parseInt(this._attr.margins.left),
            dx: (parseInt(this._attr.size.innerWidth) - 2) / this._attr.grid[0],
            y0: parseInt(this._attr.margins.top),
            dy: (parseInt(this._attr.size.innerHeight) - 2) / this._attr.grid[1]
        };

        this._dom.nodes.set(name,
            new FlowChartNode(this._dom.container, name, new Vector([grid.x0 + attr.x * grid.dx, grid.y0 + attr.y * grid.dy]), new Vector([attr.width * grid.dx, attr.height * grid.dy]), 'rect', {
                fill: attr.fill,
                stroke: attr.stroke,
                label: attr.label,
                groups: attr.groups
            })
        );
        return this;
    }

    removeNode(name, duration = 700) {
        // Find node
        let node = this._dom.nodes.get(name);
        if (typeof node === 'undefined') {
            return false;
        }

        // Remove from DOM
        node.remove(duration);

        // Remove from chart
        this._dom.nodes.delete(name);

        return true;
    }

    edge(name) {
        return this._dom.edges.get(name);
    }

    addEdge(name, srcId, dstId, attr) {
        // Check if we have edge with the same name already
        if (this._dom.edges.has(name)) {
            throw Error(`Edge '${name}' already exists in flow chart`);
        }

        // Find nodes
        let srcNode = this._dom.nodes.get(srcId),
            dstNode = this._dom.nodes.get(dstId);

        // Get connectors
        let src = srcNode ? srcNode.connector(attr.srcSide) : null,
            dst = dstNode ? dstNode.connector(attr.dstSide) : null;
        if (src && dst) {
            this._dom.edges.set(name,
                new FlowChartEdge(
                    this._dom.container, name,
                    src, dst,
                    FlowChartNode.normal(attr.srcSide),
                    FlowChartNode.normal(attr.dstSide),
                    attr.style, {
                        stroke: attr.stroke,
                        bend: attr.bend,
                        groups: attr.groups
                    })
            );
        }
        return this;
    }

    removeEdge(name, duration = 700) {
        // Find edge
        let edge = this._dom.edges.get(name);
        if (typeof edge === 'undefined') {
            return false;
        }

        // Remove from DOM
        edge.remove(duration);

        // Remove from chart
        this._dom.edges.delete(name);

        return true;
    }

    highlight(ids, duration = 700, type = 'group') {
        this._dom.container.selectAll('.flow-chart-elem')
            .transition().duration(duration)
            .style('opacity', function () {
                let elem = select(this);
                return !ids || ids.reduce((acc, d) => acc || elem.classed(`flow-chart-${type}-${encode(d)}`), false) ? 1 : 0.2;
            });
    }

    _update(duration) {
        // Nodes
        this._dom.nodes.forEach(d => d.mouse(this._attr.mouse).update(duration));

        // Edges
        this._dom.edges.forEach(d => d.mouse(this._attr.mouse).update(duration));
    }
}