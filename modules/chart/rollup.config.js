import { terser } from 'rollup-plugin-terser'
import * as meta from "./package.json"

const copyright = `// ${meta.homepage} v${meta.version} Copyright ${(new Date).getFullYear()} ${meta.author.name}`

export default {
    external: [ 'd3-ease', 'd3-selection', '@dalian/tooltip' ],
    input: 'src/index.js',
    plugins: [
        terser({output: {preamble: copyright}})
    ],
    output: {
        globals: {
            'd3-ease': 'd3',
            'd3-selection': 'd3',
            '@dalian/tooltip': 'Tooltip'
        },
        file: 'dist/dalian.chart.min.js',
        format: 'umd',
        name: 'Chart',
        indent: false,
    }
}
