import babel from 'rollup-plugin-babel';
import { uglify } from 'rollup-plugin-uglify';

export default [
  {
    input: 'src/PairedFrame.js',
    output: {
      file: 'dist/PairedFrame.min.js',
      format: 'iife',
      name: 'PairedFrame'
    },
    plugins: [
      babel({
        presets: ['@babel/preset-env']
      }),
      uglify()
    ]
  },
  {
    input: 'src/PairedFrame.js',
    output: [
      {
        file: 'dist/PairedFrame.cjs.js',
        format: 'cjs'
      },
      {
        file: 'dist/PairedFrame.ejs.js',
        format: 'es'
      }
    ],
    plugins: [
      babel({
        presets: ['@babel/preset-env']
      })
    ]
  }
];
