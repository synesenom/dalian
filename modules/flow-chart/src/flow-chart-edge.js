import { encode } from '@dalian/widget';
import 'd3-transition';

// TODO isolate Vector class
class Vector {
    constructor(x, y) {
        if (typeof x === 'number' && typeof y === 'number') {
            this._x = x;
            this._y = y;
        } else if(Array.isArray(x)) {
            this._x = x[0];
            this._y = x[1];
        } else {
            this._x = 1;
            this._y = 0;
        }
    }

    get x() {
        return this._x;
    }

    get y() {
        return this._y;
    }

    norm() {
        let l = Math.sqrt(this._x * this._x + this._y * this._y);
        return new Vector(
            this._x / l,
            this._y / l
        );
    }

    rotate(angle) {
        let rad = Math.PI * angle / 180,
            c = Math.cos(rad),
            s = Math.sin(rad);
        return new Vector(
            this._x * c - this._y * s,
            this._x * s + this._y * c
        );
    }

    add(vector) {
        return new Vector(
            this._x + vector.x,
            this._y + vector.y
        );
    }

    sub(vector) {
        return new Vector(
            this._x - vector.x,
            this._y - vector.y
        );
    }

    mult(value) {
        return new Vector(
            value * this._x,
            value * this._y
        );
    }
}

// TODO Add head/tail
// TODO Add bend
export default class FlowChartEdge {
    constructor(dom, name, attr = {}) {
        this._id = encode(name);

        this._attr = {
            src: attr.src,
            dst: attr.dst,
            stroke: attr.stroke || '#ddd'
        };

        // Add DOM element
        let g = dom.append('g')
            .attr('class', `flow-chart-edge flow-chart-edge-${this._id}`),
            body = g.append('path')
                .attr('class', 'flow-chart-edge-body')
                .attr('fill', 'none')
                .attr('stroke-width', '1px')
                .attr('stroke', 'transparent')
                .attr('d', `M${this._attr.src[0]} ${this._attr.src[1]} L${this._attr.dst[0]} ${this._attr.dst[1]}`),
            head = g.append('polygon')
                .attr('class', 'flow-chart-edge-head')
                .attr('stroke', 'none')
                .attr('fill', 'black'),
            tail = g.append('polygon')
                .attr('class', 'flow-chart-edge-tail')
                .attr('stroke', 'none')
                .attr('fill', 'black');
        this._dom = {body, head, tail};
    }

    update(duration) {
        // Compute some useful vectors
        

        // Body
        this._dom.body.transition().duration(duration)
            .attr('d', `M${this._attr.src[0]} ${this._attr.src[1]} L${this._attr.dst[0]} ${this._attr.dst[1]}`)
            .style('stroke', this._attr.stroke);

        // Head
        let end = new Vector(this._attr.src),
            v = new Vector(
                this._attr.dst[0] - this._attr.src[0],
                this._attr.dst[1] - this._attr.src[1]
            ).norm(),
            n = v.rotate(90),
            s = end.add(v.mult(10)),
            points = [
                end,
                s.add(n.mult(3)),
                s.sub(n.mult(3))
            ];
        this._dom.head.attr('points', points.map(d => `${d.x},${d.y}`).join(' '));
    }
}