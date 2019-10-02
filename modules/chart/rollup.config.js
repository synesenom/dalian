import { terser } from 'rollup-plugin-terser'
import * as meta from './package.json'

const copyright = `// ${meta.homepage} v${meta.version} Copyright ${(new Date).getFullYear()} ${meta.author.name}`
const dependencies = {
    '@dalian/core': 'dalian.core',
    '@dalian/colors': 'dalian.Colors',
    '@dalian/font': 'dalian.Font',
    '@dalian/mouse': 'dalian.Mouse',
    '@dalian/tooltip': 'dalian.Tooltip',
    '@dalian/utils': 'dalian.utils',
    '@dalian/widget': 'dalian.Widget',
    'd3-ease': 'd3',
    'd3-selection': 'd3'
}
const lib = meta.name.split('/')[0].slice(1)
const name = meta.name.split('/')[1]

export default {
    external: Object.keys(dependencies),
    input: 'src/index.js',
    plugins: [
        terser({output: {preamble: copyright}})
    ],
    output: {
        globals: dependencies,
        file: `dist/${lib}.${name}.min.js`,
        format: 'umd',
        name: `${lib}.${name.split('-').map(d => d[0].toUpperCase().concat(d.slice(1))).join('')}`,
        indent: false
    }
}
