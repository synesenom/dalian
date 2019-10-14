import { terser } from 'rollup-plugin-terser'
import * as meta from './package.json'

const copyright = `// ${meta.homepage} v${meta.version} Copyright ${(new Date).getFullYear()} ${meta.author.name}`
const dependencies = {
    'd3-array': 'd3'
}
const lib = meta.name.split('/')[0].slice(1)
const name = meta.name.split('/')[1].split('-')[1]

export default {
    external: Object.keys(dependencies),
    input: meta.module,
    plugins: [
        terser({output: {preamble: copyright}})
    ],
    output: {
        globals: dependencies,
        file: meta.main,
        format: 'umd',
        name: `${lib}.components.${name[0].toUpperCase().concat(name.slice(1))}`,
        indent: false
    }
}
