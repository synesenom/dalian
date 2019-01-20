import { encode } from '@dalian/widget';
import 'd3-transition';
import Vector from './vector2d';


// TODO Add head/tail
// TODO Add bend
export default class FlowChartEdge {
    static get BEND() {
        return {
            r: 15,
            dx: 11
        };
    };

    static get ARROW() {
        return {
            height: 10,
            width: 3
        };
    };

    constructor(dom, name, src, dst, srcDir, dstDir, style = 'arrow', attr = {}) {
        // Identifier
        this._id = encode(name);

        // Position and size
        this._src = {
            p: src,
            v: srcDir
        };
        this._dst = {
            p: dst,
            v: dstDir
        };

        // Bend
        this._bend = attr.bend || false;

        // Style
        this._style = style;

        // Modifiable attributes
        this._attr = {
            stroke: attr.stroke || '#ddd',
            groups: attr.groups || [],
            mouse: attr.mouse || {}
        };

        this._geo = {
            v: this._dst.p.sub(this._src.p).norm(),
            n: this._dst.p.sub(this._src.p).norm().rotate(90)
        };

        // Add DOM element
        let g = dom.append('g')
            .attr('class', `flow-chart-elem flow-chart-edge flow-chart-edge-${encode(name)} ${this._attr.groups.map(d => 'flow-chart-group-' + encode(d)).join(' ')}`),
            bbox = this._bbox(),
            touch = g.append('rect')
                .attr('class', 'flow-chart-edge-touch')
                .attr('x', bbox.x)
                .attr('y', bbox.y)
                .attr('width', bbox.width)
                .attr('height', bbox.height)
                .style('fill', 'transparent')
                .style('stroke', 'transparent'),
            body = g.append('path')
                .attr('class', 'flow-chart-edge-body')
                .style('fill', 'none')
                .style('stroke-width', '1px')
                .style('stroke', 'transparent')
                .attr('d', this._body()),
            head = g.append('polygon')
                .attr('class', 'flow-chart-edge-head')
                .style('stroke', 'none')
                .style('fill', 'transparent')
                .attr('points', ''),
            tail = g.append('polygon')
                .attr('class', 'flow-chart-edge-tail')
                .style('stroke', 'none')
                .style('fill', 'transparent')
                .attr('points', this._style === 'double-arrow' ? this._tail() : '');
        this._dom = {g, touch, body, head, tail};
    }

    _bbox() {
        return {
            x: Math.min(this._dst.p.x, this._src.p.x),
            y: Math.min(this._dst.p.y, this._src.p.y),
            width: Math.abs(this._dst.p.x - this._src.p.x),
            height: Math.abs(this._dst.p.y - this._src.p.y)
        };
    }

    _body() {
        let dv = this._dst.p.sub(this._src.p),
            p;

        // Is it bent?
        if (this._bend) {
            // Build breaking points
            let breakPoints = [];
            if (this._src.v.dot(this._dst.v) === 0) {
                breakPoints = [
                    this._src.v.mult(Math.abs(this._src.v.dot(dv))),
                    this._dst.v.mult(-Math.abs(this._dst.v.dot(dv)))
                ];
            } else {
                breakPoints = [
                    this._src.p.add(this._src.v.mult(0.5*Math.abs(this._src.v.dot(dv)))),
                    this._dst.p.add(this._dst.v.mult(0.5*Math.abs(this._dst.v.dot(dv)))),
                    this._dst.p
                ];
            }

            // Starting point
            p = `M${this._src.p.path()}`;

            // Add sections
            for (let i=0; i<breakPoints.length - 1; i++) {
                let b = breakPoints[i].norm(),
                    out = breakPoints[i+1].norm();
                p += ` `;
            }

            /*
            // Starting point
            p = `M${this._src.p.add(this._src.v.mult(this._style === 'double-arrow' ? 0.5 * FlowChartEdge.ARROW.height : 0)).path()}`;

            // Starting segment
            p += FlowChartEdge._drawLine(this._src.v, Math.abs(this._src.v.dot(dv)) - FlowChartEdge.BEND.r - (this._style === 'double-arrow' ? 0.5 * FlowChartEdge.ARROW.height : 0));

            // Middle segment
            p += FlowChartEdge._drawTurn(this._src.v, this._dst.v);

            // End segment
            p += FlowChartEdge._drawLine(this._dst.v, -Math.abs(this._dst.v.dot(dv)) + FlowChartEdge.BEND.r + FlowChartEdge.ARROW.height);
            */
        } else {
            // Starting point
            p = `M${this._src.p.add(this._geo.v.mult(this._style === 'double-arrow' ? 0.5 * FlowChartEdge.ARROW.height : 0)).path()}`;

            // If not bent, build a simple line
            p += FlowChartEdge._drawLine(this._geo.v, dv.length - (this._style === 'double-arrow' ? 1 : 0.5) * FlowChartEdge.ARROW.height);
        }

        return p;
    }

    static _drawArrow(p, v) {
        let n = v.rotate(90),
            s = p.add(v.mult(FlowChartEdge.ARROW.height));
        return [
            p,
            s.add(n.mult(FlowChartEdge.ARROW.width)),
            s.sub(n.mult(FlowChartEdge.ARROW.width))
        ].map(d => `${d.x},${d.y}`).join(' ');
    }

    static _drawTurn(v1, v2) {
        return ` c${v1.mult(FlowChartEdge.BEND.dx).path()} ${v1.mult(FlowChartEdge.BEND.r).sub(v2.mult(FlowChartEdge.BEND.r-FlowChartEdge.BEND.dx)).path()} ${v1.mult(FlowChartEdge.BEND.r).sub(v2.mult(FlowChartEdge.BEND.r)).path()}`;
    }

    static _drawLine(v, l) {
        return ` l${v.mult(l).path()}`;
    }

    _head() {
        return FlowChartEdge._drawArrow(
            this._dst.p,
            this._bend ? this._dst.v : this._geo.v.mult(-1)
        );
    }

    _tail() {
        return FlowChartEdge._drawArrow(
            this._src.p,
            this._bend ? this._src.v : this._geo.v
        );
    }

    stroke(color) {
        this._attr.stroke = color;
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
        this._dom.g.attr('class', `flow-chart-elem flow-chart-edge flow-chart-edge-${this._id} ${this._attr.groups.map(d => 'flow-chart-group-' + encode(d)).join(' ')}`)
            .on('mouseover', () => {
                this._attr.mouse.enter && this._attr.mouse.enter(this._id, this._attr.groups, 'edge');
            })
            .on('mouseleave', () => {
                this._attr.mouse.leave && this._attr.mouse.leave(this._id, this._attr.groups, 'edge');
            })
            .on('click', () => {
                this._attr.mouse.click && this._attr.mouse.click(this._id, this._attr.groups, 'edge');
            });

        // Body
        this._dom.body.transition().duration(duration)
            .style('stroke', this._attr.stroke);

        // Head
        /*this._dom.head
            .transition().duration(duration)
            .style('fill', this._attr.stroke);

        // Tail
        this._dom.tail
            .transition().duration(duration)
            .style('fill', this._attr.stroke);*/
    }
}