import React from 'react';
import PropTypes from 'prop-types';

const SocialLinks = ({children}) => <ul className="flex items-center">{children}</ul>;

SocialLinks.propTypes = {
	children: PropTypes.node
};

export default SocialLinks;
