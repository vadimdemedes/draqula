import React from 'react';
import PropTypes from 'prop-types';
import web from '../../static/web-1.png';
import bat from '../../static/bat.png';

const Content = ({children}) => (
	<div className="bg-white my-6 p-6 rounded shadow-lg md:flex relative overflow-hidden">
		<img src={web} className="absolute top-0 right-0 opacity-50" style={{height: 100}} alt="" />
		<img src={bat} className="absolute" style={{bottom: -10, left: `calc(50% - 30px)`, width: 60}} alt="" />
		{children}
	</div>
);

Content.propTypes = {
	children: PropTypes.node
};

export default Content;
