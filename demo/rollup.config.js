import babel from 'rollup-plugin-babel';

export default [
  {
    input: `${__dirname}/client/parent.js`,
    output: {
      file: `${__dirname}/public/parent.js`,
      format: 'iife'
    },
    plugins: [
      babel({
        presets: [
          '@babel/preset-env',
          '@babel/preset-react'
        ]
      })
    ]
  },
  {
    input: `${__dirname}/client/child.js`,
    output: {
      file: `${__dirname}/public/child.js`,
      format: 'iife'
    },
    plugins: [
      babel({
        presets: [
          '@babel/preset-env'
        ]
      })
    ]
  }
];
