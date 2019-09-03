import React from 'react';
import PropTypes from 'prop-types';
import NestedNavigationItem from './NestedNavigationItem';

const NestedNavigation = ({parentPath, items}) => (
	<ul className="block ml-4">
		{items.map(item => (
			<NestedNavigationItem key={item.url} title={item.title} path={parentPath + item.url} />
		))}
	</ul>
);

NestedNavigation.propTypes = {
	parentPath: PropTypes.string.isRequired,
	items: PropTypes.array
};

export default NestedNavigation;
