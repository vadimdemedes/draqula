import React, {useEffect, FunctionComponent} from 'react';
import DraqulaContext from './DraqulaContext';
import Draqula from './Draqula';

interface DraqulaProviderProps {
	readonly client: Draqula;
	readonly children: JSX.Element[] | JSX.Element;
}

const DraqulaProvider: FunctionComponent<DraqulaProviderProps> = ({client, children}) => {
	useEffect(() => {
		return () => {
			if (client) {
				client.destroy();
			}
		};
	}, [client]);

	return <DraqulaContext.Provider value={{client}}>{children}</DraqulaContext.Provider>;
};

export default DraqulaProvider;
