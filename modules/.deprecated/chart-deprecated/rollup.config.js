import { terser } from 'rollup-plugin-terser'
import * as meta from "./package.json";

const copyright = `// ${meta.homepage} v${meta.version} Copyright ${(new Date).getFullYear()} ${meta.author.name}`;

export default {
  external: [ '@dalian/widget', 'd3-axis', 'd3-scale', 'd3-selection', 'd3-transition' ],
  input: 'src/index.js',
  plugins: [
    terser({output: {preamble: copyright}})
  ],
  output: {
    globals: {
      '@dalian/widget': 'Widget',
      'd3-axis': 'd3',
      'd3-scale': 'd3',
      'd3-selection': 'd3',
      'd3-transition': 'd3'
    },
    file: 'dist/dalian.chart.min.js',
    format: 'umd',
    name: 'chart',
    indent: false,
  }
};
