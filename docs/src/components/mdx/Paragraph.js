import React from 'react';
import PropTypes from 'prop-types';

const Paragraph = ({children}) => <p className="mb-4 leading-relaxed">{children}</p>;

Paragraph.propTypes = {
	children: PropTypes.node
};

export default Paragraph;
