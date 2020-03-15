import {useState, useEffect, useRef, useCallback, useReducer, Reducer, Dispatch, SetStateAction} from 'react';
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

interface Result<T> {
	data: T | undefined;
	setData: Dispatch<SetStateAction<T | undefined>>;
	isLoading: boolean;
	error: NetworkError | GraphQLError | undefined;
	refetch: () => Promise<void>;
	fetchMore: (variables: object, options?: FetchMoreOptions) => Promise<void>;
	isFetchingMore: boolean;
}

const defaultFetchMoreOptions = {merge: defaultMerge};

interface State<T> {
	data: T | undefined;
	error: NetworkError | GraphQLError | undefined;
	isLoading: boolean;
	isFetchingMore: boolean;
}

interface Action<T> {
	type: 'fetch' | 'success' | 'error' | 'reset' | 'fetch-more' | 'fetch-more-success' | 'fetch-more-done' | 'set-data';
	data?: T;
	error?: NetworkError | GraphQLError | undefined;
}

const reducer = <T>(state: State<T>, action: Action<T>): State<T> => {
	if (action.type === 'fetch') {
		return {
			...state,
			error: undefined,
			isLoading: true
		};
	}

	if (action.type === 'success') {
		return {
			...state,
			data: action.data,
			error: undefined,
			isLoading: false
		};
	}

	if (action.type === 'error') {
		return {
			...state,
			data: undefined,
			error: action.error,
			isLoading: false
		};
	}

	if (action.type === 'reset') {
		return {
			data: action.data,
			error: undefined,
			isLoading: !action.data,
			isFetchingMore: false
		};
	}

	if (action.type === 'fetch-more') {
		return {
			...state,
			isFetchingMore: true
		};
	}

	if (action.type === 'fetch-more-success') {
		return {
			...state,
			data: action.data
		};
	}

	if (action.type === 'fetch-more-done') {
		return {
			...state,
			isFetchingMore: false
		};
	}

	if (action.type === 'set-data') {
		return {
			...state,
			data: action.data
		};
	}

	return state;
};

export default <T>(query: DocumentNode, variables: object = {}, options: QueryOptions = {}): Result<T> => {
	const client = useDraqulaClient();
	const [cache, setCache] = useDataCache<T>(query, variables);
	const [{data, error, isLoading, isFetchingMore}, dispatch] = useReducer<Reducer<State<T>, Action<T>>>(reducer, {
		data: cache,
		error: undefined,
		isLoading: cache === undefined,
		isFetchingMore: false
	});

	const [customData, setCustomData] = useState(cache);

	useEffect(() => {
		if (options.cache !== false) {
			setCustomData(data);
		}
	}, [data, options.cache]);

	useEffect(() => {
		if (options.cache !== false) {
			dispatch({
				type: 'set-data',
				data: customData
			});

			setCache(customData);
		}
	}, [customData, options.cache]);

	const fetch = useCallback(async ({refetch = false, signal}: FetchOptions): Promise<void> => {
		if (!refetch && cache === undefined) {
			dispatch({
				type: 'fetch'
			});
		}

		try {
			const data = await client.query<T>(query, variables, {
				...options,
				signal
			});

			dispatch({
				type: 'success',
				data
			});
		} catch (error) {
			// `AbortError` is thrown when request is canceled
			if (error.name === 'AbortError') {
				return;
			}

			if (refetch) {
				throw error;
			}

			dispatch({
				type: 'error',
				error
			});
		}
	}, useDeepDependencies([client, query, variables, options, cache]));

	// `refetch` can be executed manually any number of times, so we have to manually
	// take care of canceling the last refetch request by maintaing reference to the last abort controller
	const refetchAbortControllerRef = useRef<AbortController>();
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
			dispatch({
				type: 'fetch-more'
			});

			try {
				const nextData = await client.query<T>(query, merge({}, variables, overrideVariables), options);

				if (data === undefined) {
					dispatch({
						type: 'fetch-more-success',
						data: nextData
					});
				}

				if (data !== undefined && nextData !== undefined) {
					dispatch({
						type: 'fetch-more-success',
						data: fetchMoreOptions.merge<T>(data, nextData)
					});
				}
			} finally {
				dispatch({
					type: 'fetch-more-done'
				});
			}
		},
		useDeepDependencies([client, query, variables, options, data])
	);

	useEffect(() => {
		dispatch({
			type: 'reset',
			data: cache
		});

		const abortController = new AbortController();
		fetch({signal: abortController.signal});

		return () => abortController.abort();
	}, [fetch]);

	useEffect(() => client.watchQuery(query, refetch), [client, query, refetch]);

	return {data, setData: setCustomData, error, isLoading, fetchMore, isFetchingMore, refetch};
};
