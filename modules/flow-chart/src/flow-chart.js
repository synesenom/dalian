import { Widget } from '@dalian/widget';

export default class FlowChart extends Widget {
    constructor(name, parent) {
        // Call Widget constructor
        super('flow-chart', name, parent);

        // Add flow chart specific attributes
        this.attr.grid = Array.from({length: 100}, () => Array.from({length: 100}));

        // Add nodes and edges
        this.dom.nodes = this.dom.container.append('g')
            .attr('class', 'nodes');
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
        this.attr.grid = Array.from({length: width}, () => Array.from({length: height}));
        return this;
    }
}