import {useState, useCallback} from 'react';
import {DocumentNode} from 'graphql';
import useDraqulaClient from './useDraqulaClient';
import useDeepDependencies from './useDeepDependencies';
import NetworkError from './lib/network-error';
import GraphQLError from './lib/graphql-error';

interface MutationOptions {
	readonly refetchQueries: DocumentNode[];
	readonly waitForRefetchQueries: boolean;
}

const defaultMutationOptions = {
	refetchQueries: [],
	waitForRefetchQueries: false
};

export default <T>(
	query: DocumentNode,
	options: MutationOptions = defaultMutationOptions
): {
	mutate: (variables?: object) => Promise<T | null>;
	data: T | null;
	isLoading: boolean;
	error: NetworkError | GraphQLError | null;
} => {
	const client = useDraqulaClient();
	const [data, setData] = useState<T | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState(null);

	const mutate = useCallback(async (variables: object = {}): Promise<T | null> => {
		setData(null);
		setError(null);
		setIsLoading(true);

		try {
			const data = await client.mutate<T>(query, variables, options);
			setData(data);
			setError(null);
			setIsLoading(false);

			return data;
		} catch (error) {
			setError(error);
			setIsLoading(false);

			throw error;
		}
	}, useDeepDependencies([client, query, options]));

	return {mutate, data, isLoading, error};
};
