import { terser } from 'rollup-plugin-terser'
import * as meta from './package.json'

const copyright = `// ${meta.homepage} v${meta.version} Copyright ${(new Date).getFullYear()} ${meta.author.name}`
const dependencies = {
    '@dalian/core': 'dalian.core',
    '@dalian/component-chart': 'dalian.components.Chart',
    'd3-array': 'd3',
    'd3-shape': 'd3',
    'd3-selection': 'd3', // TODO Remove this
    'd3-ease': 'd3', // TODO Remove this
    'd3-format': 'd3', // TODO Remove this
    'd3-scale': 'd3', // TODO Remove this
    'd3-axis': 'd3', // TODO Remove this
    'd3-transition': 'd3' // TODO Remove this
}
const lib = meta.name.split('/')[0].slice(1)
const name = meta.name.split('/')[1].split('-').slice(1).join('-')

export default {
    external: Object.keys(dependencies),
    input: 'src/index.js',
    plugins: [
        terser({output: {preamble: copyright}})
    ],
    output: {
        globals: dependencies,
        file: `dist/${lib}.widget-${name}.min.js`,
        format: 'umd',
        name: `${lib}.widgets.${name.split('-').map(d => d[0].toUpperCase().concat(d.slice(1))).join('')}`,
        indent: false
    }
}

