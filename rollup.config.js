import typescript from 'rollup-plugin-typescript2';
import babel from 'rollup-plugin-babel';
import pkg from './package.json';

export default {
	input: 'src/index.ts',
	output: [
		{
			file: pkg.main,
			format: 'cjs'
		},
		{
			file: pkg.module,
			format: 'es'
		}
	],
	external: [...Object.keys(pkg.dependencies), ...Object.keys(pkg.peerDependencies)],
	plugins: [
		typescript({typescript: require('typescript')}),
		babel({
			extensions: ['.ts', '.tsx'],
			exclude: 'node_modules/**',
			plugins: ['babel-plugin-lodash'],
			comments: false
		})
	]
};
