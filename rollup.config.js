import { terser } from 'rollup-plugin-terser'
import gzipPlugin from 'rollup-plugin-gzip'
import * as meta from './package.json'

const copyright = `// ${meta.homepage} v${meta.version} Copyright ${(new Date).getFullYear()} ${meta.author.name}`
const dependencies = {
    'd3': 'd3',
    'd3-interpolate-path': 'd3'
}

export default {
    external: Object.keys(dependencies),
    input: meta.module,
    plugins: [
        terser({output: {preamble: copyright}}),
        gzipPlugin()
    ],
    output: {
        globals: dependencies,
        file: meta.main,
        format: 'umd',
        name: `dalian`,
        indent: false
    }
}
