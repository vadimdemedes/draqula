import React from 'react';
import PropTypes from 'prop-types';

const H5 = ({children}) => <h1 className="text-sm font-medium">{children}</h1>;

H5.propTypes = {
	children: PropTypes.node
};

export default H5;
