import React from 'react';
import PropTypes from 'prop-types';
import {Link} from 'gatsby';

const ArrowRightIcon = () => (
	<svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="fill-current ml-2">
		<path d="m18.59 13h-15.59a1 1 0 0 1 0-2h15.59l-5.3-5.3a1 1 0 1 1 1.42-1.4l7 7a1 1 0 0 1 0 1.4l-7 7a1 1 0 0 1 -1.42-1.4z" />
	</svg>
);

const NextPageLink = ({to, children}) => {
	return (
		<div className="flex justify-end mt-8">
			<Link to={to} className="bg-red-500 hover:bg-red-600 text-white rounded-full px-6 py-2 flex items-center">
				{children}
				<ArrowRightIcon />
			</Link>
		</div>
	);
};

NextPageLink.propTypes = {
	to: PropTypes.string.isRequired,
	children: PropTypes.node
};

export default NextPageLink;
