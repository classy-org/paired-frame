import { uglify } from 'rollup-plugin-uglify';

export default [
  {
    input: 'dist/PairedFrame.ejs.js',
    output: {
      file: 'dist/PairedFrame.min.js',
      format: 'iife',
      name: 'PairedFrame'
    },
    plugins: [
      uglify()
    ]
  },
  {
    input: 'dist/PairedFrame.ejs.js',
    output: {
      file: 'dist/PairedFrame.cjs.js',
      format: 'cjs'
    }
  }
];
