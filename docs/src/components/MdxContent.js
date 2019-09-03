import React from 'react';
import PropTypes from 'prop-types';
import {MDXProvider} from '@mdx-js/react';
import * as mdxComponents from './mdx';

const MdxContent = ({children}) => (
	<main className="flex-1">
		<MDXProvider components={mdxComponents}>{children}</MDXProvider>
	</main>
);

MdxContent.propTypes = {
	children: PropTypes.node
};

export default MdxContent;
