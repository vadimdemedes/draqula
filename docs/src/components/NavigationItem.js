import React from 'react';
import PropTypes from 'prop-types';
import {Link, withPrefix} from 'gatsby';
import {Location} from '@reach/router';
import NestedNavigation from './NestedNavigation';

const NavigationItem = ({title, path, tableOfContents}) => (
	<Location>
		{({location}) => (
			<>
				<Link
					className="px-2 py-1 mb-1 rounded block text-gray-800"
					activeClassName="bg-red-100 text-red-500"
					to={path}
				>
					{title}
				</Link>

				{location.pathname === withPrefix(path) && Array.isArray(tableOfContents) && (
					<NestedNavigation parentPath={path} items={tableOfContents} />
				)}
			</>
		)}
	</Location>
);

NavigationItem.propTypes = {
	title: PropTypes.string.isRequired,
	path: PropTypes.string.isRequired,
	tableOfContents: PropTypes.array
};

export default NavigationItem;
