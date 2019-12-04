/* eslint @typescript-eslint/camelcase: ["error", {allow: ["unstable_batchedUpdates"]}] */
import {useState, useEffect, useRef, useCallback} from 'react';
import {unstable_batchedUpdates} from 'react-dom';
import {DocumentNode} from 'graphql';
import AbortController from 'abort-controller';
import {merge} from 'lodash';
import useDraqulaClient from './useDraqulaClient';
import useDataCache from './useDataCache';
import useDeepDependencies from './useDeepDependencies';
import usePageFocus from './usePageFocus';
import NetworkError from './lib/network-error';
import GraphQLError from './lib/graphql-error';
import defaultMerge from './lib/merge';

interface QueryOptions {
	readonly timeout?: number;
	readonly retry?: boolean;
	readonly cache?: boolean;
	readonly refetchOnFocus?: boolean;
}

interface FetchOptions {
	readonly refetch?: boolean;
	readonly signal?: AbortSignal;
}

interface FetchMoreOptions {
	merge: <T>(prevData: T, nextData: T) => T;
}

const defaultFetchMoreOptions = {merge: defaultMerge};

export default <T>(
	query: DocumentNode,
	variables: object = {},
	options: QueryOptions = {}
): {
	data: T | null;
	isLoading: boolean;
	error: NetworkError | GraphQLError | null;
	refetch: () => Promise<void>;
	fetchMore: (variables: object, options?: FetchMoreOptions) => Promise<void>;
	isFetchingMore: boolean;
} => {
	const client = useDraqulaClient();
	const cachedData = useDataCache<T>(query, variables);
	const [data, setData] = useState<T | null>(cachedData);
	const [isLoading, setIsLoading] = useState(cachedData === null);
	const [error, setError] = useState(null);
	const [isFetchingMore, setFetchingMore] = useState(false);

	const fetch = useCallback(async ({refetch = false, signal}: FetchOptions): Promise<void> => {
		if (!refetch && cachedData === null) {
			unstable_batchedUpdates(() => {
				setIsLoading(true);
				setError(null);
			});
		}

		try {
			const data = await client.query<T>(query, variables, {
				...options,
				signal
			});

			unstable_batchedUpdates(() => {
				setData(data);
				setError(null);
				setIsLoading(false);
			});
		} catch (error) {
			// `AbortError` is thrown when request is canceled
			if (error.name === 'AbortError') {
				return;
			}

			if (refetch) {
				throw error;
			}

			unstable_batchedUpdates(() => {
				setData(null);
				setError(error);
				setIsLoading(false);
			});
		}
	}, useDeepDependencies([client, query, variables, options, cachedData]));

	// `refetch` can be executed manually any number of times, so we have to manually
	// take care of canceling the last refetch request by maintaing reference to the last abort controller
	const refetchAbortControllerRef = useRef<AbortController | null>(null);
	const refetch = useCallback(() => {
		if (refetchAbortControllerRef.current) {
			refetchAbortControllerRef.current.abort();
		}

		refetchAbortControllerRef.current = new AbortController();

		return fetch({
			refetch: true,
			signal: refetchAbortControllerRef.current.signal
		});
	}, [fetch]);

	usePageFocus(refetch as () => void, {
		isEnabled: typeof options.refetchOnFocus === 'boolean' ? options.refetchOnFocus : true
	});

	const fetchMore = useCallback(
		async (overrideVariables: object, fetchMoreOptions: FetchMoreOptions = defaultFetchMoreOptions): Promise<void> => {
			setFetchingMore(true);

			try {
				const nextData = await client.query<T>(query, merge({}, variables, overrideVariables), options);

				setData(data => {
					if (data === null) {
						return nextData;
					}

					if (nextData === null) {
						return data;
					}

					return fetchMoreOptions.merge<T>(data, nextData);
				});
			} finally {
				setFetchingMore(false);
			}
		},
		useDeepDependencies([client, query, variables, options])
	);

	useEffect(() => {
		unstable_batchedUpdates(() => {
			setIsLoading(cachedData === null);
			setError(null);
			setData(cachedData);
		});

		const abortController = new AbortController();
		fetch({signal: abortController.signal});

		return () => abortController.abort();
	}, [fetch]);

	useEffect(() => client.watchQuery(query, refetch), [client, query, refetch]);

	return {data, isLoading, error, fetchMore, isFetchingMore, refetch};
};
