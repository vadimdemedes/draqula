import React from 'react';
import PropTypes from 'prop-types';

const H3 = ({children}) => <h1 className="text-xl font-medium">{children}</h1>;

H3.propTypes = {
	children: PropTypes.node
};

export default H3;
