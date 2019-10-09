import { terser } from 'rollup-plugin-terser'
import * as meta from "./package.json";

const copyright = `// ${meta.homepage} v${meta.version} Copyright ${(new Date).getFullYear()} ${meta.author.name}`;

export default {
    external: [ 'd3-color', 'd3-ease', 'd3-format', 'd3-selection', 'd3-transition' ],
    input: 'src/index.js',
    plugins: [
        terser({output: {preamble: copyright}})
    ],
    output: {
        globals: {
            'd3-color': 'd3',
            'd3-ease': 'd3',
            'd3-format': 'd3',
            'd3-selection': 'd3',
            'd3-transition': 'd3'
        },
        file: 'dist/dalian.widget.min.js',
        format: 'umd',
        name: 'Widget',
        indent: false,
    }
};