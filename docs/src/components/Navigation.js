import React from 'react';
import {graphql, useStaticQuery} from 'gatsby';
import NavigationItem from './NavigationItem';

const sortPages = nodes => {
	nodes.sort((a, b) => a.frontmatter.position - b.frontmatter.position);
	return nodes;
};

const Navigation = () => {
	const data = useStaticQuery(graphql`
		query {
			allMdx {
				edges {
					node {
						id
						tableOfContents(maxDepth: 2)
						frontmatter {
							path
							position
						}
					}
				}
			}
		}
	`);

	return (
		<nav>
			{sortPages(data.allMdx.edges.map(edge => edge.node)).map(node => (
				<NavigationItem
					key={node.id}
					title={node.tableOfContents.items[0].title}
					path={node.frontmatter.path}
					tableOfContents={node.tableOfContents.items[0].items}
				/>
			))}
		</nav>
	);
};

export default Navigation;
