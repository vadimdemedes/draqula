import React from 'react';
import PropTypes from 'prop-types';

const H4 = ({children}) => <h1 className="text-base font-medium">{children}</h1>;

H4.propTypes = {
	children: PropTypes.node
};

export default H4;
