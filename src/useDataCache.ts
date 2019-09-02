import {useMemo} from 'react';
import {DocumentNode} from 'graphql';
import useDraqulaClient from './useDraqulaClient';
import useDeepDependencies from './useDeepDependencies';

export default <T>(query: DocumentNode, variables: object): T | null => {
	const client = useDraqulaClient();
	const cache = useMemo(() => {
		return client.getDataCache<T>(query, variables);
	}, useDeepDependencies([client, query, variables]));

	return cache;
};
