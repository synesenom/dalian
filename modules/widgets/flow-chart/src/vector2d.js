export default class Vector {
    /**
     * Class implementing a 2D vector.
     *
     * @class Vector
     * @param {(number|number[]|Vector)} x A number or an array. If it is a number, the vector's X component is initialized by this value. If an array, the vector is initialized by its first two values. If it is a vector, its components are copied.
     * @param {number?} y An optional number. If specified, it is the Y component of the vector.
     * @constructor
     */
    constructor(x, y) {
        if (typeof x === 'number' && typeof y === 'number') {
            this._x = x;
            this._y = y;
        } else if (Array.isArray(x)) {
            this._x = x[0];
            this._y = x[1];
        } else if (typeof x.x === 'number' && typeof x.y === 'number') {
            this._x = x.x;
            this._y = x.y;
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

    dx(value) {
        return new Vector(
            this._x + value,
            this._y
        );
    }

    dy(value) {
        return new Vector(
            this._x,
            this._y + value
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

    get length() {
        return Math.sqrt(this._x * this._x + this._y * this._y);
    }

    dot(vector) {
        return this._x * vector.x + this._y * vector.y;
    }

    path() {
        return `${this._x} ${this._y}`;
    }
};
