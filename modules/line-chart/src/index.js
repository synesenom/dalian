import { Scale, Axes, Chart } from '../../chart/src/index';


export class LineChart extends Chart {
    constructor(name, parent) {
        super('line', name, parent);

        // Chart specific attributes
        this.attr.range = {
            x: {
                min: null,
                max: null
            }
        };
        this.attr.labels = {
            x: '',
            y: ''
        };

        // Build scale and axes
        this.dom.scales = {
            x: new Scale('linear'),
            y: new Scale('linear')
        };
        this.dom.axes = new Axes(this.dom);
    }

    xLabel(text) {
        this.attr.labels.x = text;
        return this;
    }

    yLabel(text) {
        this.attr.labels.y = text;
        return this;
    }

    _transformData(data) {
        return data.map(function (d) {
            return {
                name: d.name,
                values: d.values.sort(function (a, b) {
                    return a.x - b.x;
                }).map(function (dd) {
                    return {
                        x: dd.x,
                        y: dd.y,
                        lo: dd.lo || 0,
                        hi: dd.hi || 0
                    };
                })
            };
        });
    }

    _chartUpdate() {
        // Collect all data points
        let flatData = this._data.reduce((acc, d) => acc.concat(d.values), []);

        // Update scales
        this.dom.scales.x.update(flatData.map(d => d.x), [0, parseInt(this.attr.size.innerWidth)]);
        this.dom.scales.y.update(flatData.map(d => d.y), [parseInt(this.attr.size.innerHeight), 0]);

        // Update axes
        this.dom.axes.update(this.attr, this.dom.scales);
    }
}
