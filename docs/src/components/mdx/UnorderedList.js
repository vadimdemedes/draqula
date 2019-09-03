import React from 'react';
import PropTypes from 'prop-types';

const UnorderedList = ({children}) => <ul className="list-disc list-inside mb-4 ml-2">{children}</ul>;

UnorderedList.propTypes = {
	children: PropTypes.node
};

export default UnorderedList;
