import { Widget } from '@dalian/widget';
import FlowChartNode from './flow-chart-node';
import FlowChartEdge from './flow-chart-edge';


export default class FlowChart extends Widget {
    constructor(name, parent) {
        // Call Widget constructor
        super('flow-chart', name, parent);

        // Add flow chart specific attributes
        this._attr.grid = [100, 100];

        // Add nodes and edges
        this._dom.nodes = [];
        this._dom.edges = [];
        // TODO add edges
    }

    /**
     * Re-sizes flow chart grid. Note that all nodes and edges are removed.
     *
     * @method grid
     * @memberOf FlowChart
     * @param {number} width New grid width.
     * @param {number} height New grid height.
     * @return {FlowChart} Reference to the current flow chart.
     */
    grid(width, height) {
        // TODO remove all nodes and edges
        this._attr.grid = [width, height];
        return this;
    }

    addNode(name, attr) {
        // Get grid dimensions
        let grid = {
            x0: parseInt(this._attr.margins.left),
            dx: (parseInt(this._attr.size.innerWidth) - 2) / this._attr.grid[0],
            y0: parseInt(this._attr.margins.top),
            dy: (parseInt(this._attr.size.innerHeight) - 2) / this._attr.grid[1]
        };

        this._dom.nodes.push(
            new FlowChartNode(this._dom.container, name, 'rect', {
                pos: [grid.x0 + attr.x * grid.dx, grid.y0 + attr.y * grid.dy],
                size: [attr.width * grid.dx, attr.height * grid.dy],
                fill: attr.fill,
                stroke: attr.stroke,
                label: attr.label
            })
        );
        return this;
    }

    addEdge(name, srcId, dstId, attr) {
        // Find nodes
        let srcNode = this._dom.nodes.filter(d => d.id === srcId),
            dstNode = this._dom.nodes.filter(d => d.id === dstId);

        // Get connectors
        let src = srcNode.length === 1 ? srcNode[0].connector('south') : null,
            dst = dstNode.length === 1 ? dstNode[0].connector('north') : null;
        if (src && dst) {
            this._dom.edges.push(
                new FlowChartEdge(this._dom.container, name, {
                        src: src,
                        dst: dst,
                        stroke: attr.stroke
                    }
                )
            );
        }
        return this;
    }

    _update(duration) {
        // Nodes
        this._dom.nodes.forEach(d => d.update(duration));

        // Edges
        this._dom.edges.forEach(d => d.update(duration));
    }
}