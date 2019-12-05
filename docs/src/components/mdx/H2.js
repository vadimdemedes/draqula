import React from 'react';
import PropTypes from 'prop-types';
import slugify from '@sindresorhus/slugify';

const H2 = ({children}) => (
	<a href={`#${slugify(children)}`} id={slugify(children)}>
		<h1 className="text-2xl font-medium mt-10">{children}</h1>
	</a>
);

H2.propTypes = {
	children: PropTypes.node
};

export default H2;
