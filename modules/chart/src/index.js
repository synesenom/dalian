import { easeLinear } from 'd3-ease'
import { select } from 'd3-selection'
import { encode } from '../../utils/src/index'
import Widget from '../../widget/src/index'
import Font from '../../font/src/index'
import Colors from '../../colors/src/index'
import Tooltip from '../../tooltip/src/index'
import Mouse from '../../mouse/src/index'

export default (type, name, parent, elem, _self, _api) => {
    // Base component is Widget
    let { self, api } = Widget(type, name, parent, elem, _self, _api)

    // Init default values
    self.chart = {
        plots: self.widget.dom.container.append('g')
            .attr('class', 'plots-container'),
        data: undefined,
        transition: false
    }

    // Private methods
    self.chart.transformData = () => {
        console.warn('Chart.transformData(data) is not implemented.')
    }

    self.chart.update = () => {
        console.warn('Chart.update(duration) is not implemented.')
    }

    self.chart.plotGroups = (g, attr, duration = 700) => {
        // Select groups
        let groups = g.selectAll('.plot-group')
            .data(self.chart.data, d => d.name);

        // Exiting groups: simply fade out
        let exit = groups.exit()
            .transition().duration(duration)
            .style('opacity', 0)
            .remove();

        // Entering groups: starting transparent
        let enter = groups.enter().append('g')
            .attr('class', d => `plot-group ${encode(d.name)}`)
            .style('shape-rendering', 'geometricPrecision')
            .style('opacity', 0)
            .style('fill', 'transparent')
            .style('stroke', 'transparent');
        if (attr && attr.enter) {
            enter = attr.enter(enter);
        }

        // Union: attach mouse events
        let union = enter.merge(groups)
            .each(() => {
                // Disable pointer events before transition
                g.style('pointer-events', 'none');
                self.chart.transition = true;
            })
            .on('mouseover', d => {
                typeof self.mouse.enter !== 'undefined' && self.mouse.enter(d);
            })
            .on('mouseleave', d => {
                typeof self.mouse.leave !== 'undefined' && self.mouse.leave(d);
            })
            .on('click', d => {
                typeof self.mouse.click !== 'undefined' && self.mouse.click(d);
            });
        if (attr && attr.union && attr.union.before) {
            union = attr.union.before(union);
        }

        // Animate new state
        let unionAnimated = union.transition().duration(duration)
            .style('opacity', 1)
            .style('fill', d => self.colors.mapping(d.name))
            .style('stroke', d => self.colors.mapping(d.name));
        if (attr && attr.union && attr.union.after) {
            unionAnimated = attr.union.after(unionAnimated);
        }
        unionAnimated.on('end', () => {
            // Re-enable pointer events
            g.style('pointer-events', 'all');
            self.chart.transition = false;
        });

        return {
            groups: groups,
            enter: enter,
            exit: exit,
            union: {
                before: union,
                after: unionAnimated
            }
        };
    }

    self.chart.highlight = (selector, key, duration = 0) => {
        // If currently animated, don't highlight
        if (self.chart.transition) {
            return api;
        }

        // Stop current transitions
        let elems = self.chart.plots.selectAll(selector);
        elems.transition();

        // Perform highlight
        if (typeof key === 'string') {
            // Single key
            elems.transition().duration(duration)
                .style('opacity', function () {
                    return select(this).classed(encode(key)) ? 1 : 0.1;
                });
        } else if (Array.isArray(key)) {
            // Multiple keys
            let keys = key.map(d => encode(d));
            elems.transition().duration(duration)
                .style('opacity', function () {
                    let elem = select(this);
                    return keys.reduce((s, d) => s || elem.classed(d), false) ? 1 : 0.1;
                });
        } else {
            // Remove highlight
            elems.transition().duration(duration ? duration : 0)
                .style('opacity', 1);
        }

        return api;
    }

    self.widget.update = duration => {
        // Chart specific update
        self.chart.update(duration)

        // Adjust plots container
        self.chart.plots
            .attr('width', self.widget.size.innerWidth + 'px')
            .attr('height', self.widget.size.innerHeight + 'px')
            .attr('transform', 'translate(' + self.widget.margins.left + ',' + self.widget.margins.top + ')')
    }

    // Public API
    api = api || {}
    api.data = plots => {
        // Transform data to the standard internal structure
        self.chart.data = self.chart.transformData(plots);

        // Reset color mapping if it is set to default
        api.colors()

        // Switch render flag
        return api;
    }

    return Object.assign(
        api,
        Colors(self, api),
        Tooltip(self, api),
        Mouse(self, api),
        Font(self, api)
    )
}
