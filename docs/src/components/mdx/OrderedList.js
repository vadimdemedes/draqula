import React from 'react';
import PropTypes from 'prop-types';

const OrderedList = ({children}) => <ul className="list-decimal list-inside my-4 ml-2">{children}</ul>;

OrderedList.propTypes = {
	children: PropTypes.node
};

export default OrderedList;
