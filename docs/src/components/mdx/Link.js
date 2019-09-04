import React from 'react';
import PropTypes from 'prop-types';
import {Link as InternalLink} from 'gatsby';

const Link = ({href, children}) => {
	const className = 'text-blue-500 hover:underline';

	if (href.startsWith('/') || href.startsWith('#')) {
		return (
			<InternalLink className={className} to={href}>
				{children}
			</InternalLink>
		);
	}

	return (
		<a href={href} className={className} target="_blank" rel="noopener noreferrer">
			{children}
		</a>
	);
};

Link.propTypes = {
	href: PropTypes.string.isRequired,
	children: PropTypes.node
};

export default Link;
