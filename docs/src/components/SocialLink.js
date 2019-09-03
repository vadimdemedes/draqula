import React from 'react';
import PropTypes from 'prop-types';

const SocialLink = ({href, children}) => (
	<li className="ml-3">
		<a href={href} className="text-gray-500 hover:text-gray-700">
			{children}
		</a>
	</li>
);

SocialLink.propTypes = {
	href: PropTypes.string.isRequired,
	children: PropTypes.node.isRequired
};

export default SocialLink;
