module.exports = {
	siteMetadata: {
		title: 'Draqula'
	},
	plugins: [
		{
			resolve: 'gatsby-source-filesystem',
			options: {
				name: 'pages',
				path: `${__dirname}/src/pages`
			}
		},
		{
			resolve: 'gatsby-plugin-mdx',
			options: {
				defaultLayouts: {
					default: `${__dirname}/src/components/Layout.js`
				}
			}
		},
		'gatsby-plugin-postcss'
	]
};
