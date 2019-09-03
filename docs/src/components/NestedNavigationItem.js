import React from 'react';
import PropTypes from 'prop-types';
import {Link} from 'gatsby';

const NestedNavigationItem = ({title, path}) => (
	<Link className="mb-1 block text-gray-500" activeClassName="text-red-500" to={path}>
		{title}
	</Link>
);

NestedNavigationItem.propTypes = {
	title: PropTypes.string.isRequired,
	path: PropTypes.string.isRequired
};

export default NestedNavigationItem;
