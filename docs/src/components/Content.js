import React from 'react';
import PropTypes from 'prop-types';

const Content = ({children}) => <div className="bg-white my-6 p-6 rounded shadow-lg flex">{children}</div>;

Content.propTypes = {
	children: PropTypes.node
};

export default Content;
