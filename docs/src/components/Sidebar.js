import React from 'react';
import PropTypes from 'prop-types';

const Sidebar = ({children}) => <div className="flex-none w-1/4 pr-10">{children}</div>;

Sidebar.propTypes = {
	children: PropTypes.node
};

export default Sidebar;
