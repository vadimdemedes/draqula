import React from 'react';
import PropTypes from 'prop-types';
import web from '../../static/web-2.png';

const Sidebar = ({children}) => (
	<div className="flex-none md:w-1/4 md:pr-10 mb-8 md:mb-0 relative">
		<img src={web} className="absolute opacity-25" style={{left: -100, top: 600, width: 200}} alt="" />
		{children}
	</div>
);

Sidebar.propTypes = {
	children: PropTypes.node
};

export default Sidebar;
