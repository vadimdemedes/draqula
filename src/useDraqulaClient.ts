import {useContext} from 'react';
import DraqulaContext from './DraqulaContext';
import Draqula from './Draqula';

export default (): Draqula => {
	const context = useContext(DraqulaContext);

	if (!context || !context.client) {
		throw new Error(
			"Draqula client couldn't be found. Did you forget to pass client to your React components via DragulaProvider?"
		);
	}

	return context.client;
};
