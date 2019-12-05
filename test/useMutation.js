import test from 'ava';
import React from 'react';
import gql from 'graphql-tag';
import nock from 'nock';
import {renderHook, act} from '@testing-library/react-hooks';
import {Draqula, DraqulaContext, GraphQLError, NetworkError, useQuery, useMutation} from '..';
import createWrapper from './_create-wrapper';
import assertMutation from './_assert-mutation';
import assertQuery from './_assert-query';

nock.disableNetConnect();

const CREATE_TODO_MUTATION = gql`
	mutation CreateTodo($title: String!) {
		createTodo(title: $title) {
			id
			title
		}
	}
`;

const TODOS_QUERY = gql`
	{
		todos {
			id
			title
		}
	}
`;

const POSTS_QUERY = gql`
	{
		posts {
			id
			title
		}
	}
`;

test.afterEach(() => nock.cleanAll());

test('run mutation', async t => {
	const client = new Draqula('http://graph.ql');

	const request = nock('http://graph.ql')
		.post('/', {
			query: /.+/,
			variables: {
				title: 'A'
			}
		})
		.reply(200, {
			data: {
				createTodo: {
					id: 'a',
					title: 'A'
				}
			}
		});

	const {result, waitForNextUpdate} = renderHook(() => useMutation(CREATE_TODO_MUTATION), {
		wrapper: createWrapper(client)
	});

	assertMutation(t, result, {
		data: undefined,
		isLoading: false,
		error: undefined
	});

	act(() => {
		result.current.mutate({
			title: 'A'
		});
	});

	assertMutation(t, result, {
		data: undefined,
		isLoading: true,
		error: undefined
	});

	await waitForNextUpdate();

	assertMutation(t, result, {
		data: {
			createTodo: {
				id: 'a',
				title: 'A'
			}
		},
		isLoading: false,
		error: undefined
	});

	t.true(nock.isDone());
});

test('refetch queries with the same types', async t => {
	const client = new Draqula('http://graph.ql');

	const firstTodos = {
		todos: [
			{
				id: 'a',
				title: 'A',
				__typename: 'Todo'
			}
		],
		__typename: 'RootQuery'
	};

	const firstTodosRequest = nock('http://graph.ql')
		.post('/', /todos/)
		.reply(200, {
			data: firstTodos
		});

	const secondTodos = {
		todos: [
			{
				id: 'a',
				title: 'A',
				__typename: 'Todo'
			},
			{
				id: 'b',
				title: 'B',
				__typename: 'Todo'
			}
		],
		__typename: 'RootQuery'
	};

	const secondTodosRequest = nock('http://graph.ql')
		.post('/', /todos/)
		.reply(200, {
			data: secondTodos
		});

	const posts = {
		posts: [
			{
				id: 'x',
				title: 'X',
				__typename: 'Post'
			}
		],
		__typename: 'RootQuery'
	};

	const postsRequest = nock('http://graph.ql')
		.post('/', /posts/)
		.delay(100)
		.reply(200, {
			data: posts
		});

	const mutationRequest = nock('http://graph.ql')
		.post('/', {
			query: /.+/,
			variables: {
				title: 'B'
			}
		})
		.reply(200, {
			data: {
				createTodo: {
					id: 'b',
					title: 'B',
					__typename: 'Todo'
				},
				__typename: 'RootMutation'
			}
		});

	const wrapper = createWrapper(client);
	const mutation = renderHook(() => useMutation(CREATE_TODO_MUTATION), {wrapper});
	const todosQuery = renderHook(() => useQuery(TODOS_QUERY), {wrapper});
	const postsQuery = renderHook(() => useQuery(POSTS_QUERY), {wrapper});

	assertMutation(t, mutation.result, {
		data: undefined,
		isLoading: false,
		error: undefined
	});

	assertQuery(t, todosQuery.result, {
		data: undefined,
		isLoading: true,
		error: undefined
	});

	assertQuery(t, postsQuery.result, {
		data: undefined,
		isLoading: true,
		error: undefined
	});

	await todosQuery.waitForNextUpdate();
	await postsQuery.waitForNextUpdate();

	assertQuery(t, todosQuery.result, {
		data: firstTodos,
		isLoading: false,
		error: undefined
	});

	assertQuery(t, postsQuery.result, {
		data: posts,
		isLoading: false,
		error: undefined
	});

	act(() => {
		mutation.result.current.mutate({
			title: 'B'
		});
	});

	assertMutation(t, mutation.result, {
		data: undefined,
		isLoading: true,
		error: undefined
	});

	await mutation.waitForNextUpdate();
	await todosQuery.waitForNextUpdate();
	t.true(nock.isDone());

	assertMutation(t, mutation.result, {
		data: {
			createTodo: {
				id: 'b',
				title: 'B',
				__typename: 'Todo'
			},
			__typename: 'RootMutation'
		},
		isLoading: false,
		error: undefined
	});

	assertQuery(t, todosQuery.result, {
		data: secondTodos,
		isLoading: false,
		error: undefined
	});

	assertQuery(t, postsQuery.result, {
		data: posts,
		isLoading: false,
		error: undefined
	});
});

test('refetch queries with additional custom queries', async t => {
	const client = new Draqula('http://graph.ql');

	const firstTodos = {
		todos: [
			{
				id: 'a',
				title: 'A',
				__typename: 'Todo'
			}
		],
		__typename: 'RootQuery'
	};

	const firstTodosRequest = nock('http://graph.ql')
		.post('/', /todos/)
		.reply(200, {
			data: firstTodos
		});

	const secondTodos = {
		todos: [
			{
				id: 'a',
				title: 'A',
				__typename: 'Todo'
			},
			{
				id: 'b',
				title: 'B',
				__typename: 'Todo'
			}
		],
		__typename: 'RootQuery'
	};

	const secondTodosRequest = nock('http://graph.ql')
		.post('/', /todos/)
		.reply(200, {
			data: secondTodos
		});

	const firstPosts = {
		posts: [
			{
				id: 'x',
				title: 'X',
				__typename: 'Post'
			}
		],
		__typename: 'RootQuery'
	};

	const firstPostsRequest = nock('http://graph.ql')
		.post('/', /posts/)
		.delay(100)
		.reply(200, {
			data: firstPosts
		});

	const secondPosts = {
		posts: [
			{
				id: 'x',
				title: 'X',
				__typename: 'Post'
			},
			{
				id: 'y',
				title: 'Y',
				__typename: 'Post'
			}
		],
		__typename: 'RootQuery'
	};

	const secondPostsRequest = nock('http://graph.ql')
		.post('/', /posts/)
		.delay(100)
		.reply(200, {
			data: secondPosts
		});

	const mutationRequest = nock('http://graph.ql')
		.post('/', {
			query: /.+/,
			variables: {
				title: 'B'
			}
		})
		.reply(200, {
			data: {
				createTodo: {
					id: 'b',
					title: 'B',
					__typename: 'Todo'
				},
				__typename: 'RootMutation'
			}
		});

	const wrapper = createWrapper(client);
	const mutation = renderHook(
		() =>
			useMutation(CREATE_TODO_MUTATION, {
				refetchQueries: [POSTS_QUERY]
			}),
		{wrapper}
	);

	const todosQuery = renderHook(() => useQuery(TODOS_QUERY), {wrapper});
	const postsQuery = renderHook(() => useQuery(POSTS_QUERY), {wrapper});

	assertMutation(t, mutation.result, {
		data: undefined,
		isLoading: false,
		error: undefined
	});

	assertQuery(t, todosQuery.result, {
		data: undefined,
		isLoading: true,
		error: undefined
	});

	assertQuery(t, postsQuery.result, {
		data: undefined,
		isLoading: true,
		error: undefined
	});

	await todosQuery.waitForNextUpdate();
	await postsQuery.waitForNextUpdate();

	assertQuery(t, todosQuery.result, {
		data: firstTodos,
		isLoading: false,
		error: undefined
	});

	assertQuery(t, postsQuery.result, {
		data: firstPosts,
		isLoading: false,
		error: undefined
	});

	act(() => {
		mutation.result.current.mutate({
			title: 'B'
		});
	});

	assertMutation(t, mutation.result, {
		data: undefined,
		isLoading: true,
		error: undefined
	});

	await mutation.waitForNextUpdate();
	await todosQuery.waitForNextUpdate();
	await postsQuery.waitForNextUpdate();
	t.true(nock.isDone());

	assertMutation(t, mutation.result, {
		data: {
			createTodo: {
				id: 'b',
				title: 'B',
				__typename: 'Todo'
			},
			__typename: 'RootMutation'
		},
		isLoading: false,
		error: undefined
	});

	assertQuery(t, todosQuery.result, {
		data: secondTodos,
		isLoading: false,
		error: undefined
	});

	assertQuery(t, postsQuery.result, {
		data: secondPosts,
		isLoading: false,
		error: undefined
	});
});

test('do not wait until queries are refetched before completing mutation', async t => {
	const client = new Draqula('http://graph.ql');

	const firstTodos = {
		todos: [
			{
				id: 'a',
				title: 'A',
				__typename: 'Todo'
			}
		],
		__typename: 'RootQuery'
	};

	const firstTodosRequest = nock('http://graph.ql')
		.post('/', /todos/)
		.reply(200, {
			data: firstTodos
		});

	const secondTodos = {
		todos: [
			{
				id: 'a',
				title: 'A',
				__typename: 'Todo'
			},
			{
				id: 'b',
				title: 'B',
				__typename: 'Todo'
			}
		],
		__typename: 'RootQuery'
	};

	const secondTodosRequest = nock('http://graph.ql')
		.post('/', /todos/)
		.delayBody(500)
		.reply(200, {
			data: secondTodos
		});

	const mutationRequest = nock('http://graph.ql')
		.post('/', {
			query: /.+/,
			variables: {
				title: 'B'
			}
		})
		.reply(200, {
			data: {
				createTodo: {
					id: 'b',
					title: 'B',
					__typename: 'Todo'
				},
				__typename: 'RootMutation'
			}
		});

	const wrapper = createWrapper(client);
	const mutation = renderHook(() => useMutation(CREATE_TODO_MUTATION), {wrapper});
	const todosQuery = renderHook(() => useQuery(TODOS_QUERY), {wrapper});

	assertMutation(t, mutation.result, {
		data: undefined,
		isLoading: false,
		error: undefined
	});

	assertQuery(t, todosQuery.result, {
		data: undefined,
		isLoading: true,
		error: undefined
	});

	await todosQuery.waitForNextUpdate();

	assertQuery(t, todosQuery.result, {
		data: firstTodos,
		isLoading: false,
		error: undefined
	});

	await mutation.result.current.mutate({
		title: 'B'
	});

	t.false(nock.isDone());

	assertQuery(t, todosQuery.result, {
		data: firstTodos,
		isLoading: false,
		error: undefined
	});

	assertMutation(t, mutation.result, {
		data: {
			createTodo: {
				id: 'b',
				title: 'B',
				__typename: 'Todo'
			},
			__typename: 'RootMutation'
		},
		isLoading: false,
		error: undefined
	});

	await todosQuery.waitForNextUpdate();

	assertQuery(t, todosQuery.result, {
		data: secondTodos,
		isLoading: false,
		error: undefined
	});

	t.true(nock.isDone());
});

test('wait until queries are refetched before completing mutation', async t => {
	const client = new Draqula('http://graph.ql');

	const firstTodos = {
		todos: [
			{
				id: 'a',
				title: 'A',
				__typename: 'Todo'
			}
		],
		__typename: 'RootQuery'
	};

	const firstTodosRequest = nock('http://graph.ql')
		.post('/', /todos/)
		.reply(200, {
			data: firstTodos
		});

	const secondTodos = {
		todos: [
			{
				id: 'a',
				title: 'A',
				__typename: 'Todo'
			},
			{
				id: 'b',
				title: 'B',
				__typename: 'Todo'
			}
		],
		__typename: 'RootQuery'
	};

	const secondTodosRequest = nock('http://graph.ql')
		.post('/', /todos/)
		.reply(200, {
			data: secondTodos
		});

	const mutationRequest = nock('http://graph.ql')
		.post('/', {
			query: /.+/,
			variables: {
				title: 'B'
			}
		})
		.reply(200, {
			data: {
				createTodo: {
					id: 'b',
					title: 'B',
					__typename: 'Todo'
				},
				__typename: 'RootMutation'
			}
		});

	const wrapper = createWrapper(client);
	const mutation = renderHook(
		() =>
			useMutation(CREATE_TODO_MUTATION, {
				waitForRefetchQueries: true
			}),
		{wrapper}
	);

	const todosQuery = renderHook(() => useQuery(TODOS_QUERY), {wrapper});

	assertMutation(t, mutation.result, {
		data: undefined,
		isLoading: false,
		error: undefined
	});

	assertQuery(t, todosQuery.result, {
		data: undefined,
		isLoading: true,
		error: undefined
	});

	await todosQuery.waitForNextUpdate();

	assertQuery(t, todosQuery.result, {
		data: firstTodos,
		isLoading: false,
		error: undefined
	});

	await mutation.result.current.mutate({
		title: 'B'
	});

	t.true(nock.isDone());

	assertMutation(t, mutation.result, {
		data: {
			createTodo: {
				id: 'b',
				title: 'B',
				__typename: 'Todo'
			},
			__typename: 'RootMutation'
		},
		isLoading: false,
		error: undefined
	});

	assertQuery(t, todosQuery.result, {
		data: secondTodos,
		isLoading: false,
		error: undefined
	});
});

test('delete cache for refetched queries', async t => {
	const client = new Draqula('http://graph.ql');

	const firstTodos = {
		todos: [
			{
				id: 'a',
				title: 'A',
				__typename: 'Todo'
			}
		],
		__typename: 'RootQuery'
	};

	const firstTodosRequest = nock('http://graph.ql')
		.post('/', /todos/)
		.reply(200, {
			data: firstTodos
		});

	const secondTodos = {
		todos: [
			{
				id: 'a',
				title: 'A',
				__typename: 'Todo'
			},
			{
				id: 'b',
				title: 'B',
				__typename: 'Todo'
			}
		],
		__typename: 'RootQuery'
	};

	const secondTodosRequest = nock('http://graph.ql')
		.post('/', /todos/)
		.reply(200, {
			data: secondTodos
		});

	const mutationRequest = nock('http://graph.ql')
		.post('/', {
			query: /.+/,
			variables: {
				title: 'B'
			}
		})
		.reply(200, {
			data: {
				createTodo: {
					id: 'b',
					title: 'B',
					__typename: 'Todo'
				},
				__typename: 'RootMutation'
			}
		});

	const wrapper = createWrapper(client);
	const mutation = renderHook(() => useMutation(CREATE_TODO_MUTATION), {wrapper});

	assertMutation(t, mutation.result, {
		data: undefined,
		isLoading: false,
		error: undefined
	});

	const firstTodosQuery = renderHook(() => useQuery(TODOS_QUERY), {wrapper});

	assertQuery(t, firstTodosQuery.result, {
		data: undefined,
		isLoading: true,
		error: undefined
	});

	await firstTodosQuery.waitForNextUpdate();

	assertQuery(t, firstTodosQuery.result, {
		data: firstTodos,
		isLoading: false,
		error: undefined
	});

	firstTodosQuery.unmount();

	await mutation.result.current.mutate({
		title: 'B'
	});

	t.false(nock.isDone());

	assertMutation(t, mutation.result, {
		data: {
			createTodo: {
				id: 'b',
				title: 'B',
				__typename: 'Todo'
			},
			__typename: 'RootMutation'
		},
		isLoading: false,
		error: undefined
	});

	const secondTodosQuery = renderHook(() => useQuery(TODOS_QUERY), {wrapper});

	assertQuery(t, secondTodosQuery.result, {
		data: undefined,
		isLoading: true,
		error: undefined
	});

	await secondTodosQuery.waitForNextUpdate();

	assertQuery(t, secondTodosQuery.result, {
		data: secondTodos,
		isLoading: false,
		error: undefined
	});
});

test('avoid refetching queries if refetchQueries === false', async t => {
	const client = new Draqula('http://graph.ql');

	const todos = {
		todos: [
			{
				id: 'a',
				title: 'A',
				__typename: 'Todo'
			}
		],
		__typename: 'RootQuery'
	};

	nock('http://graph.ql')
		.post('/', /todos/)
		.reply(200, {
			data: todos
		});

	const posts = {
		posts: [
			{
				id: 'x',
				title: 'X',
				__typename: 'Post'
			}
		],
		__typename: 'RootQuery'
	};

	nock('http://graph.ql')
		.post('/', /posts/)
		.delay(100)
		.reply(200, {
			data: posts
		});

	nock('http://graph.ql')
		.post('/', {
			query: /.+/,
			variables: {
				title: 'B'
			}
		})
		.reply(200, {
			data: {
				createTodo: {
					id: 'b',
					title: 'B',
					__typename: 'Todo'
				},
				__typename: 'RootMutation'
			}
		});

	const wrapper = createWrapper(client);
	const mutation = renderHook(
		() => {
			return useMutation(CREATE_TODO_MUTATION, {
				refetchQueries: false
			});
		},
		{wrapper}
	);
	const todosQuery = renderHook(() => useQuery(TODOS_QUERY), {wrapper});
	const postsQuery = renderHook(() => useQuery(POSTS_QUERY), {wrapper});

	assertMutation(t, mutation.result, {
		data: undefined,
		isLoading: false,
		error: undefined
	});

	assertQuery(t, todosQuery.result, {
		data: undefined,
		isLoading: true,
		error: undefined
	});

	assertQuery(t, postsQuery.result, {
		data: undefined,
		isLoading: true,
		error: undefined
	});

	await todosQuery.waitForNextUpdate();
	await postsQuery.waitForNextUpdate();

	assertQuery(t, todosQuery.result, {
		data: todos,
		isLoading: false,
		error: undefined
	});

	assertQuery(t, postsQuery.result, {
		data: posts,
		isLoading: false,
		error: undefined
	});

	act(() => {
		mutation.result.current.mutate({
			title: 'B'
		});
	});

	assertMutation(t, mutation.result, {
		data: undefined,
		isLoading: true,
		error: undefined
	});

	await mutation.waitForNextUpdate();
	await t.throwsAsync(todosQuery.waitForNextUpdate({timeout: 1000}));
	t.true(nock.isDone());

	assertMutation(t, mutation.result, {
		data: {
			createTodo: {
				id: 'b',
				title: 'B',
				__typename: 'Todo'
			},
			__typename: 'RootMutation'
		},
		isLoading: false,
		error: undefined
	});

	assertQuery(t, todosQuery.result, {
		data: todos,
		isLoading: false,
		error: undefined
	});

	assertQuery(t, postsQuery.result, {
		data: posts,
		isLoading: false,
		error: undefined
	});
});
