import React from 'react';
import PropTypes from 'prop-types';

const H1 = ({children}) => <h1 className="text-3xl font-medium mb-2">{children}</h1>;

H1.propTypes = {
	children: PropTypes.node
};

export default H1;
