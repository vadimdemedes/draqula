import {useState, useEffect, useRef, useCallback, Dispatch, SetStateAction} from 'react';
import {DocumentNode} from 'graphql';
import AbortController from 'abort-controller';
import {merge} from 'lodash';
import useDraqulaClient from './useDraqulaClient';
import useDataCache from './useDataCache';
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
	cache: T | undefined;
	error: NetworkError | GraphQLError | undefined;
	isLoading: boolean;
	isFetchingMore: boolean;
}

export default <T>(query: DocumentNode, variables: object = {}, options: QueryOptions = {}): Result<T> => {
	const client = useDraqulaClient();
	const [cache, setCache] = useDataCache<T>(query, variables);
	const [{data, error, isLoading, isFetchingMore}, setState] = useState<State<T>>({
		data: cache,
		cache,
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
			setState(previousState => ({
				...previousState,
				data: customData,
				cache: customData
			}));

			setCache(customData);
		}
	}, [customData, options.cache]);

	useEffect(() => {
		const abortController = new AbortController();

		const fetch = async (): Promise<void> => {
			if (cache === undefined) {
				setState(previousState => ({
					...previousState,
					error: undefined,
					isLoading: true
				}));
			}

			try {
				const data = await client.query<T>(query, variables, {
					...options,
					signal: abortController.signal
				});

				setState(previousState => ({
					...previousState,
					data,
					error: undefined,
					isLoading: false
				}));
			} catch (error) {
				// `AbortError` is thrown when request is canceled
				if (error.name === 'AbortError') {
					return;
				}

				setState(previousState => ({
					...previousState,
					data: undefined,
					error,
					isLoading: false
				}));
			}
		};

		setState(previousState => ({
			...previousState,
			data: cache,
			error: undefined,
			isLoading: !cache,
			isFetchingMore: false
		}));

		fetch();

		return () => {
			abortController.abort();
		};
	}, [client, query, JSON.stringify(variables), JSON.stringify(options), cache]);

	// `refetch` can be executed manually any number of times, so we have to manually
	// take care of canceling the last refetch request by maintaing reference to the last abort controller
	const refetchAbortControllerRef = useRef<AbortController>();
	const refetch = useCallback(async () => {
		if (refetchAbortControllerRef.current) {
			refetchAbortControllerRef.current.abort();
		}

		refetchAbortControllerRef.current = new AbortController();

		try {
			const data = await client.query<T>(query, variables, {
				...options,
				signal: refetchAbortControllerRef.current.signal
			});

			setState(previousState => ({
				...previousState,
				data,
				error: undefined
			}));
		} catch (error) {
			// `AbortError` is thrown when request is canceled
			if (error.name === 'AbortError') {
				return;
			}

			throw error;
		}
	}, [client, query, JSON.stringify(variables), JSON.stringify(options)]);

	usePageFocus(refetch as () => void, {
		isEnabled: typeof options.refetchOnFocus === 'boolean' ? options.refetchOnFocus : true
	});

	const fetchMore = useCallback(
		async (overrideVariables: object, fetchMoreOptions: FetchMoreOptions = defaultFetchMoreOptions): Promise<void> => {
			setState(previousState => ({
				...previousState,
				isFetchingMore: true
			}));

			try {
				const nextData = await client.query<T>(query, merge({}, variables, overrideVariables), options);

				setState(previousState => {
					if (previousState.data === undefined) {
						return {
							...previousState,
							data: nextData
						};
					}

					if (previousState.data !== undefined && nextData !== undefined) {
						return {
							...previousState,
							data: fetchMoreOptions.merge<T>(previousState.data, nextData)
						};
					}

					return previousState;
				});
			} finally {
				setState(previousState => ({
					...previousState,
					isFetchingMore: false
				}));
			}
		},
		[client, query, JSON.stringify(variables), JSON.stringify(options)]
	);

	useEffect(() => {
		const unsubscribe = client.watchQuery(query, refetch);
		return unsubscribe;
	}, [client, query, refetch]);

	return {data, setData: setCustomData, error, isLoading, fetchMore, isFetchingMore, refetch};
};
