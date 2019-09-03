import {useState, useEffect, useRef, useCallback} from 'react';
import {DocumentNode} from 'graphql';
import AbortController from 'abort-controller';
import {merge} from 'lodash';
import useDraqulaClient from './useDraqulaClient';
import useDataCache from './useDataCache';
import useDeepDependencies from './useDeepDependencies';
import defaultMerge from './lib/merge';

interface QueryOptions {
	readonly timeout?: number;
	readonly retry?: boolean;
	readonly cache?: boolean;
}

interface FetchOptions {
	readonly refetch?: boolean;
	readonly signal?: AbortSignal;
}

interface FetchMoreOptions {
	merge: <T>(prevData: T, nextData: T) => T;
}

const defaultFetchMoreOptions = {merge: defaultMerge};

interface QueryResultOptions {
	refetch: () => Promise<void>;
	fetchMore: (variables: object, options: FetchMoreOptions) => Promise<void>;
	fetchingMore: boolean;
}

export default <T>(
	query: DocumentNode,
	variables: object = {},
	options: QueryOptions = {}
): [T | null, boolean, Error | null, QueryResultOptions] => {
	const client = useDraqulaClient();
	const cachedData = useDataCache<T>(query, variables);
	const [data, setData] = useState<T | null>(cachedData);
	const [loading, setLoading] = useState(cachedData === null);
	const [error, setError] = useState(null);
	const [fetchingMore, setFetchingMore] = useState(false);

	const fetch = useCallback(async ({refetch = false, signal}: FetchOptions): Promise<void> => {
		if (!refetch && cachedData === null) {
			setLoading(true);
			setError(null);
		}

		try {
			const data = await client.query<T>(query, variables, {
				...options,
				signal
			});

			setData(data);
			setError(null);
			setLoading(false);
		} catch (error) {
			// `AbortError` is thrown when request is canceled
			if (error.name === 'AbortError') {
				return;
			}

			if (refetch) {
				throw error;
			}

			setData(null);
			setError(error);
			setLoading(false);
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
		setLoading(cachedData === null);
		setError(null);
		setData(cachedData);

		const abortController = new AbortController();
		fetch({signal: abortController.signal});

		return () => abortController.abort();
	}, [fetch]);

	useEffect(() => client.watchQuery(query, refetch), [client, query, refetch]);

	return [data, loading, error, {fetchMore, fetchingMore, refetch}];
};
