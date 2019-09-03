import React from 'react';
import PropTypes from 'prop-types';

const Pre = ({children}) => <div>{children}</div>;

Pre.propTypes = {
	children: PropTypes.node
};

export default Pre;
