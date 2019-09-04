import React from 'react';
import PropTypes from 'prop-types';
import slugify from '@sindresorhus/slugify';

const H3 = ({children}) => (
	<a href={`#${slugify(children)}`} id={slugify(children)}>
		<h1 className="text-xl font-medium">{children}</h1>
	</a>
);

H3.propTypes = {
	children: PropTypes.node
};

export default H3;
