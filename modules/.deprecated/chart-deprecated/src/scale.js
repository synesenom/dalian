import { scaleLinear, scaleBand, scalePoint } from 'd3-scale';

/**
 * Class implementing a chart scale.
 *
 * @class Scale
 * @param {string} type Scale type: linear, band or point.
 */
export default class Scale {
    constructor(type) {
        // Set type
        this._type = type;

        // Add domain
        switch (type) {
            default:
            case 'linear':
                this._scale = scaleLinear();
                break;
            case 'band':
                this._scale = scaleBand().padding(0.1);
                break;
            case 'point':
                this._scale = scalePoint().padding(0.5);
        }
    }

    /**
     * Returns the scale object.
     *
     * @property g
     * @memberOf Scale
     * @return {Object} D3 scale object.
     */
    get scale() {
        return this._scale;
    }

    /**
     * Updates scale.
     *
     * @method update
     * @memberOf Scale
     * @param {number[]} values Array of numbers to update scale with.
     * @param {number[]} range Array containing the lower and upper boundary of the range.
     */
    update(values, range) {
        switch (this._type) {
            default:
            case 'linear':
                this._scale.domain([Math.min(...values), Math.max(...values)]);
                break;
            case 'band':
            case 'point':
                this._scale.domain(values);
                break;
        }

        if (range) {
            this._scale.range(range);
        }
    }
}