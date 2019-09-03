import React from 'react';
import PropTypes from 'prop-types';

const TopNavigation = ({children}) => <div className="flex justify-between items-start">{children}</div>;

TopNavigation.propTypes = {
	children: PropTypes.node
};

export default TopNavigation;
