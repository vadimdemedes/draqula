import {DepGraph as DependencyGraph} from 'dependency-graph';
import Emittery from 'emittery';
import {DocumentNode, print} from 'graphql';
import ky, {Hooks, HTTPError, TimeoutError} from 'ky-universal';
import pRetry from 'p-retry';
import {uniq} from 'lodash';
import hash from '@sindresorhus/fnv1a';
import GraphQLError from './lib/graphql-error';
import NetworkError from './lib/network-error';
import addTypenames from './lib/add-typenames';
import getTypenames from './lib/get-typenames';

interface DraqulaOptions {
	readonly retry?: boolean | number | DraqulaOptionsRetry;
	readonly hooks?: Hooks;
	readonly timeout?: number;
	readonly cache?: boolean;
}

interface DraqulaOptionsRetry {
	readonly retries?: number;
	readonly factor?: number;
	readonly minTimeout?: number;
	readonly maxTimeout?: number;
	readonly randomize?: boolean;
}

interface QueryOptions {
	readonly signal?: AbortSignal;
	readonly retry?: boolean;
	readonly timeout?: number;
	readonly cache?: boolean;
}

interface MutateOptions {
	readonly refetchQueries: DocumentNode[];
	readonly waitForRefetchQueries?: boolean;
}

export default class Draqula {
	readonly url: string;
	readonly options: DraqulaOptions;
	private readonly events: Emittery;

	// A graph of two types of nodes:
	// - Query
	// - Type (__typename values)
	// Used to find all queries that have a certain `__typename` for refetching
	private readonly graph: DependencyGraph<string>;

	// Map of queries with added __typename by original query
	private queryCache: WeakMap<any, string>;

	// Map of query IDs by original query
	private queryIds: WeakMap<any, string>;

	// Map of data caches for each query by query ID
	private readonly dataCache: Map<string, Map<string, any>>;

	constructor(url: string, options: DraqulaOptions = {}) {
		this.url = url;
		this.options = options;
		this.events = new Emittery();
		this.graph = new DependencyGraph();
		this.queryCache = new WeakMap();
		this.queryIds = new WeakMap();
		this.dataCache = new Map();
	}

	// For all new queries (that haven't been processed before) add `__typename`
	// to each selection set in the query, generate a query ID by hashing the query itself
	// and initialize an empty map for caching responses
	private createQuery(query: DocumentNode): string {
		if (this.queryCache.has(query)) {
			return this.queryCache.get(query)!;
		}

		const queryString = print(addTypenames(query));
		this.queryCache.set(query, queryString);

		const queryId = String(hash(queryString));
		this.queryIds.set(query, queryId);
		this.dataCache.set(queryId, new Map());

		return queryString;
	}

	private getQueryId(query: DocumentNode): string {
		return this.queryIds.get(query)!;
	}

	private getCacheKey(variables: object): string {
		return JSON.stringify(variables);
	}

	private setDataCache(query: DocumentNode, variables: object, data: any): void {
		if (this.options.cache === false) {
			return;
		}

		const queryId = this.getQueryId(query);
		const cache = this.dataCache.get(queryId);

		if (cache) {
			const cacheKey = this.getCacheKey(variables);
			cache.set(cacheKey, data);
		}
	}

	getDataCache<T>(query: DocumentNode, variables: object): T | null {
		if (this.options.cache === false) {
			return null;
		}

		const queryId = this.getQueryId(query);
		const cache = this.dataCache.get(queryId);

		if (!cache) {
			return null;
		}

		const cacheKey = this.getCacheKey(variables);
		return cache.get(cacheKey) || null;
	}

	private async rawQuery<T>(query: DocumentNode, variables: object, options: QueryOptions): Promise<T> {
		const execute = async (): Promise<T> => {
			try {
				const response: any = await ky
					.post(this.url, {
						json: {
							query: this.createQuery(query),
							variables
						},
						signal: options.signal,
						hooks: this.options.hooks,
						timeout: options.timeout || this.options.timeout
					})
					.json();

				// GraphQL servers don't fail the request, even if resolvers are failing
				// They still return 200 status code, but add `errors` field in the response
				if (Array.isArray(response.errors)) {
					const errors = response.errors.map((error: any) => {
						const error2 = new Error(error.message) as any;

						for (const key in error) {
							if ({}.hasOwnProperty.call(error, key)) {
								error2[key] = error[key];
							}
						}

						return error2;
					});
					throw new GraphQLError(errors);
				}

				if (options.cache !== false && this.options.cache !== false) {
					this.setDataCache(query, variables, response.data);
				}

				return response.data;
			} catch (error) {
				// Since 4xx errors are client errors (like unauthorized), there's no need to keep retrying them
				const isClientError = error.response && String(error.response.status).startsWith('4');

				// `AbortError` is thrown whenever request is canceled via `AbortController`, means we should stop retrying too
				const isAborted = error.name === 'AbortError';

				if (isClientError || isAborted) {
					throw new pRetry.AbortError(error);
				}

				// Rethrow an error to ensure `p-retry` keeps retrying the request in all other cases
				throw error;
			}
		};

		let retries = 2;

		if (typeof this.options.retry === 'number') {
			retries = this.options.retry;
		}

		if (typeof this.options.retry === 'object' && typeof this.options.retry.retries === 'number') {
			retries = this.options.retry.retries;
		}

		if (options.retry === false || this.options.retry === false) {
			retries = 0;
		}

		if (retries === 0) {
			return execute();
		}

		try {
			return await pRetry(execute, {
				retries
			});
		} catch (error) {
			// Convenience wrapper for easier checks between network and GraphQL errors,
			// since most applications won't actually differentiate between HTTP and timeout error types,
			// however the original error is still accessible via `.originalError` property
			if (error.name === HTTPError.name || error.name === TimeoutError.name) {
				throw new NetworkError(error);
			}

			throw error;
		}
	}

	async query<T>(query: DocumentNode, variables: object, options: QueryOptions): Promise<T> {
		const data = await this.rawQuery<T>(query, variables, options);

		if (options.cache !== false && this.options.cache !== false) {
			const queryId = this.getQueryId(query);
			this.graph.addNode(`query:${queryId}`);

			const typenames = getTypenames(data);

			for (const typename of typenames) {
				this.graph.addNode(`type:${typename}`);
				this.graph.addDependency(`query:${queryId}`, `type:${typename}`);
			}
		}

		return data;
	}

	watchQuery(query: DocumentNode, callback: (queryId: string) => any): () => void {
		const queryId = this.getQueryId(query);
		this.events.on(`refetch:${queryId}`, callback);

		return () => this.events.off(`refetch:${queryId}`, callback);
	}

	private refetchQueries(queryIds: string[]): Array<Promise<any>> {
		return uniq(queryIds).map(queryId => {
			// Delete cache for all refetched queries, so that when new component with
			// one of those queries is rendered, it doesn't display an out-dated data
			this.dataCache.delete(queryId);

			return this.events.emit(`refetch:${queryId}`);
		});
	}

	async mutate<T>(query: DocumentNode, variables: object, options: MutateOptions): Promise<T> {
		const data = await this.rawQuery<T>(query, variables, {
			retry: false
		});

		const typenames = getTypenames(data);
		const refetchQueries: string[] = [];

		// Find all queries that have at least one __typename from mutation response
		for (const typename of typenames) {
			const nodeName = `type:${typename}`
			if (this.graph.hasNode(nodeName)) {
				const dependantQueries = this.graph
					.dependantsOf(nodeName)
					.map(queryId => queryId.replace('query:', ''));

				refetchQueries.push(...dependantQueries);
			}
		}

		// Custom queries to refetch, specified by `useMutation()`
		if (Array.isArray(options.refetchQueries)) {
			const queryIds = options.refetchQueries.map(query => this.getQueryId(query));
			refetchQueries.push(...queryIds);
		}

		const promises = this.refetchQueries(refetchQueries);

		if (options.waitForRefetchQueries) {
			await Promise.all(promises);
		}

		return data;
	}

	destroy(): void {
		this.events.clearListeners();
		this.queryCache = new WeakMap();
		this.queryIds = new WeakMap();
		this.dataCache.clear();
	}
}
