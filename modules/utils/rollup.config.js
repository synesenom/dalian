import { terser } from 'rollup-plugin-terser'
import * as meta from "./package.json"

const copyright = `// ${meta.homepage} v${meta.version} Copyright ${(new Date).getFullYear()} ${meta.author.name}`

export default {
    external: [],
    input: 'src/index.js',
    plugins: [
        terser({output: {preamble: copyright}})
    ],
    output: {
        globals: {},
        file: 'dist/dalian.utils.min.js',
        format: 'umd',
        name: 'utils',
        indent: false,
    }
}
