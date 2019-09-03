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
		'gatsby-plugin-postcss',
		'gatsby-plugin-react-helmet',
		{
			resolve: 'gatsby-plugin-purgecss',
			options: {
				printRejected: false,
				develop: true,
				tailwind: true
			}
		},
		{
			resolve: 'gatsby-plugin-fathom',
			options: {
				siteId: 'OHXKQKPG'
			}
		}
	]
};
