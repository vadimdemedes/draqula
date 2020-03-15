import {useReducer, useCallback, useRef, useEffect, Reducer} from 'react';
import {DocumentNode} from 'graphql';
import useDraqulaClient from './useDraqulaClient';
import NetworkError from './lib/network-error';
import GraphQLError from './lib/graphql-error';

interface MutationOptions {
	readonly refetchQueries?: boolean | DocumentNode[];
	readonly waitForRefetchQueries?: boolean;
}

interface Result<T> {
	mutate: (variables?: object) => Promise<T>;
	data: T | undefined;
	isLoading: boolean;
	error: NetworkError | GraphQLError | undefined;
}

const defaultMutationOptions = {
	refetchQueries: [],
	waitForRefetchQueries: false
};

interface State<T> {
	data: T | undefined;
	error: NetworkError | GraphQLError | undefined;
	isLoading: boolean;
}

interface Action<T> {
	type: 'mutate' | 'success' | 'error';
	data?: T;
	error?: NetworkError | GraphQLError | undefined;
}

const reducer = <T>(state: State<T>, action: Action<T>): State<T> => {
	if (action.type === 'mutate') {
		return {
			data: undefined,
			error: undefined,
			isLoading: true
		};
	}

	if (action.type === 'success') {
		return {
			data: action.data,
			error: undefined,
			isLoading: false
		};
	}

	if (action.type === 'error') {
		return {
			data: undefined,
			error: action.error,
			isLoading: false
		};
	}

	return state;
};

const initialState = {
	data: undefined,
	error: undefined,
	isLoading: false
};

export default <T>(query: DocumentNode, options: MutationOptions = defaultMutationOptions): Result<T> => {
	const client = useDraqulaClient();
	const [{data, error, isLoading}, originalDispatch] = useReducer<Reducer<State<T>, Action<T>>>(reducer, initialState);

	// Disable any state updates after component with this hook is unmounted
	const isUnmountedRef = useRef(false);

	useEffect(() => {
		return () => {
			isUnmountedRef.current = false;
		};
	}, []);

	const dispatch = (action: Action<T>): void => {
		if (isUnmountedRef.current === false) {
			originalDispatch(action);
		}
	};

	const mutate = useCallback(
		async (variables: object = {}): Promise<T> => {
			dispatch({
				type: 'mutate'
			});

			try {
				const data = await client.mutate<T>(query, variables, options);

				dispatch({
					type: 'success',
					data
				});

				return data;
			} catch (error) {
				dispatch({
					type: 'error',
					error
				});

				throw error;
			}
		},
		[client, query, JSON.stringify(options)]
	);

	return {mutate, data, error, isLoading};
};
