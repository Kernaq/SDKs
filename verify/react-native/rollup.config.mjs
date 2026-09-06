import resolve from '@rollup/plugin-node-resolve'
import swc from '@rollup/plugin-swc'
import dts from 'rollup-plugin-dts'

const swcPlugin = swc({
  swc: {
    jsc: {
      target: 'es2020',
      parser: { syntax: 'typescript', tsx: true, decorators: false },
    },
    sourceMaps: true,
  },
})

// Treat all peer deps as external — they live in the host app, not our bundle
const externals = [
  'react',
  'react-native',
  'react-native-vision-camera',
  'react-native-permissions',
]

const src = 'src/index.ts'

export default [
  // CJS build
  {
    input: src,
    output: { file: 'dist/index.js', format: 'cjs', sourcemap: true },
    external: externals,
    plugins: [resolve({ extensions: ['.ts', '.tsx', '.js'] }), swcPlugin],
  },
  // ESM build
  {
    input: src,
    output: { file: 'dist/index.esm.js', format: 'esm', sourcemap: true },
    external: externals,
    plugins: [resolve({ extensions: ['.ts', '.tsx', '.js'] }), swcPlugin],
  },
  // Types
  {
    input: src,
    output: { file: 'dist/index.d.ts', format: 'esm' },
    external: externals,
    plugins: [dts()],
  },
]
