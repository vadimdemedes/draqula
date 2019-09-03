import React from 'react';
import PropTypes from 'prop-types';

const InlineCode = ({children}) => {
	return <code className="bg-yellow-200 text-yellow-800 px-1">{children}</code>;
};

InlineCode.propTypes = {
	children: PropTypes.node
};

export default InlineCode;
