/* eslint @typescript-eslint/camelcase: ["error", {allow: ["unstable_batchedUpdates"]}] */
import {useState, useCallback} from 'react';
import {unstable_batchedUpdates} from 'react-dom';
import {DocumentNode} from 'graphql';
import useDraqulaClient from './useDraqulaClient';
import useDeepDependencies from './useDeepDependencies';
import NetworkError from './lib/network-error';
import GraphQLError from './lib/graphql-error';

interface MutationOptions {
	readonly refetchQueries: boolean | DocumentNode[];
	readonly waitForRefetchQueries: boolean;
}

interface Result<T> {
	mutate: (variables?: object) => Promise<T | undefined>;
	data: T | undefined;
	isLoading: boolean;
	error: NetworkError | GraphQLError | undefined;
}

const defaultMutationOptions = {
	refetchQueries: [],
	waitForRefetchQueries: false
};

export default <T>(query: DocumentNode, options: MutationOptions = defaultMutationOptions): Result<T> => {
	const client = useDraqulaClient();
	const [data, setData] = useState<T | undefined>();
	const [isLoading, setIsLoading] = useState<boolean>(false);
	const [error, setError] = useState<NetworkError | GraphQLError | undefined>();

	const mutate = useCallback(async (variables: object = {}): Promise<T | undefined> => {
		unstable_batchedUpdates(() => {
			setData(undefined);
			setError(undefined);
			setIsLoading(true);
		});

		try {
			const data = await client.mutate<T>(query, variables, options);

			unstable_batchedUpdates(() => {
				setData(data);
				setError(undefined);
				setIsLoading(false);
			});

			return data;
		} catch (error) {
			unstable_batchedUpdates(() => {
				setError(error);
				setIsLoading(false);
			});

			throw error;
		}
	}, useDeepDependencies([client, query, options]));

	return {mutate, data, isLoading, error};
};
