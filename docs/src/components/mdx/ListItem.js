import React from 'react';
import PropTypes from 'prop-types';

const ListItem = ({children}) => <li className="mb-1">{children}</li>;

ListItem.propTypes = {
	children: PropTypes.node
};

export default ListItem;
