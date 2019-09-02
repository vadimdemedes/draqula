import {useState, useCallback} from 'react';
import {DocumentNode} from 'graphql';
import useDraqulaClient from './useDraqulaClient';
import useDeepDependencies from './useDeepDependencies';

interface MutateOptions {
	readonly refetchQueries: DocumentNode[];
	readonly waitForRefetchQueries: boolean;
}

const defaultMutateOptions = {
	refetchQueries: [],
	waitForRefetchQueries: false
};

export default <T>(
	query: DocumentNode,
	options: MutateOptions = defaultMutateOptions
): [(variables?: object) => Promise<T | null>, T | null, boolean, Error | null] => {
	const client = useDraqulaClient();
	const [data, setData] = useState<T | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(null);

	const mutate = useCallback(async (variables: object = {}): Promise<T | null> => {
		setData(null);
		setError(null);
		setLoading(true);

		try {
			const data = await client.mutate<T>(query, variables, options);
			setData(data);
			setError(null);
			setLoading(false);

			return data;
		} catch (error) {
			setError(error);
			setLoading(false);

			throw error;
		}
	}, useDeepDependencies([client, query, options]));

	return [mutate, data, loading, error];
};
