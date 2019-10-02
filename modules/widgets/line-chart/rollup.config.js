import { terser } from 'rollup-plugin-terser'
import * as meta from "./package.json";

const copyright = `// ${meta.homepage} v${meta.version} Copyright ${(new Date).getFullYear()} ${meta.author.name}`;

export default {
    external: [ '@dalian/chart', '@dalian/widget', 'd3-array', 'd3-selection', 'd3-shape' ],
    input: 'src/index.js',
    plugins: [
        terser({output: {preamble: copyright}})
    ],
    output: {
        globals: {
            '@dalian/chart': 'chart',
            '@dalian/widget': 'Widget',
            'd3-array': 'd3',
            'd3-selection': 'd3',
            'd3-shape': 'd3'
        },
        file: 'dist/dalian.line-chart.min.js',
        format: 'umd',
        name: 'LineChart',
        indent: false,
    }
};
