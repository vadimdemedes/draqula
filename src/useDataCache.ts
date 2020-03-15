import {useMemo, useCallback} from 'react';
import {DocumentNode} from 'graphql';
import useDraqulaClient from './useDraqulaClient';

export default <T>(query: DocumentNode, variables: object): [T | undefined, (data: T | undefined) => void] => {
	const client = useDraqulaClient();
	const cache = useMemo(() => {
		return client.getDataCache<T>(query, variables);
	}, [client, query, JSON.stringify(variables)]);

	const setCache = useCallback(
		data => {
			client.setDataCache(query, variables, data);
		},
		[client]
	);

	return [cache, setCache];
};
