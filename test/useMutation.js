import test from 'ava';
import React from 'react';
import gql from 'graphql-tag';
import nock from 'nock';
import {renderHook, act} from '@testing-library/react-hooks';
import {Draqula, DraqulaContext, GraphQLError, NetworkError, useQuery, useMutation} from '..';
import createWrapper from './_create-wrapper';

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

	t.deepEqual(result.current.slice(1, 4), [null, false, null]);

	act(() => {
		result.current[0]({
			title: 'A'
		});
	});

	t.deepEqual(result.current.slice(1, 4), [null, true, null]);

	await waitForNextUpdate();

	t.deepEqual(result.current.slice(1, 4), [
		{
			createTodo: {
				id: 'a',
				title: 'A'
			}
		},
		false,
		null
	]);

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

	t.deepEqual(mutation.result.current.slice(1, 4), [null, false, null]);
	t.deepEqual(todosQuery.result.current.slice(0, 3), [null, true, null]);
	t.deepEqual(postsQuery.result.current.slice(0, 3), [null, true, null]);

	await todosQuery.waitForNextUpdate();
	await postsQuery.waitForNextUpdate();

	t.deepEqual(todosQuery.result.current.slice(0, 3), [firstTodos, false, null]);
	t.deepEqual(postsQuery.result.current.slice(0, 3), [posts, false, null]);

	act(() => {
		mutation.result.current[0]({
			title: 'B'
		});
	});

	t.deepEqual(mutation.result.current.slice(1, 4), [null, true, null]);

	await mutation.waitForNextUpdate();
	await todosQuery.waitForNextUpdate();
	t.true(nock.isDone());

	t.deepEqual(mutation.result.current.slice(1, 4), [
		{
			createTodo: {
				id: 'b',
				title: 'B',
				__typename: 'Todo'
			},
			__typename: 'RootMutation'
		},
		false,
		null
	]);

	t.deepEqual(todosQuery.result.current.slice(0, 3), [secondTodos, false, null]);
	t.deepEqual(postsQuery.result.current.slice(0, 3), [posts, false, null]);
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

	t.deepEqual(mutation.result.current.slice(1, 4), [null, false, null]);
	t.deepEqual(todosQuery.result.current.slice(0, 3), [null, true, null]);
	t.deepEqual(postsQuery.result.current.slice(0, 3), [null, true, null]);

	await todosQuery.waitForNextUpdate();
	await postsQuery.waitForNextUpdate();

	t.deepEqual(todosQuery.result.current.slice(0, 3), [firstTodos, false, null]);
	t.deepEqual(postsQuery.result.current.slice(0, 3), [firstPosts, false, null]);

	act(() => {
		mutation.result.current[0]({
			title: 'B'
		});
	});

	t.deepEqual(mutation.result.current.slice(1, 4), [null, true, null]);

	await mutation.waitForNextUpdate();
	await todosQuery.waitForNextUpdate();
	await postsQuery.waitForNextUpdate();
	t.true(nock.isDone());

	t.deepEqual(mutation.result.current.slice(1, 4), [
		{
			createTodo: {
				id: 'b',
				title: 'B',
				__typename: 'Todo'
			},
			__typename: 'RootMutation'
		},
		false,
		null
	]);

	t.deepEqual(todosQuery.result.current.slice(0, 3), [secondTodos, false, null]);
	t.deepEqual(postsQuery.result.current.slice(0, 3), [secondPosts, false, null]);
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

	t.deepEqual(mutation.result.current.slice(1, 4), [null, false, null]);
	t.deepEqual(todosQuery.result.current.slice(0, 3), [null, true, null]);

	await todosQuery.waitForNextUpdate();

	t.deepEqual(todosQuery.result.current.slice(0, 3), [firstTodos, false, null]);

	await mutation.result.current[0]({
		title: 'B'
	});

	t.false(nock.isDone());
	t.deepEqual(todosQuery.result.current.slice(0, 3), [firstTodos, false, null]);
	t.deepEqual(mutation.result.current.slice(1, 4), [
		{
			createTodo: {
				id: 'b',
				title: 'B',
				__typename: 'Todo'
			},
			__typename: 'RootMutation'
		},
		false,
		null
	]);

	await todosQuery.waitForNextUpdate();

	t.deepEqual(todosQuery.result.current.slice(0, 3), [secondTodos, false, null]);
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

	t.deepEqual(mutation.result.current.slice(1, 4), [null, false, null]);
	t.deepEqual(todosQuery.result.current.slice(0, 3), [null, true, null]);

	await todosQuery.waitForNextUpdate();

	t.deepEqual(todosQuery.result.current.slice(0, 3), [firstTodos, false, null]);

	await mutation.result.current[0]({
		title: 'B'
	});

	t.true(nock.isDone());
	t.deepEqual(mutation.result.current.slice(1, 4), [
		{
			createTodo: {
				id: 'b',
				title: 'B',
				__typename: 'Todo'
			},
			__typename: 'RootMutation'
		},
		false,
		null
	]);

	t.deepEqual(todosQuery.result.current.slice(0, 3), [secondTodos, false, null]);
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
	t.deepEqual(mutation.result.current.slice(1, 4), [null, false, null]);

	const firstTodosQuery = renderHook(() => useQuery(TODOS_QUERY), {wrapper});
	t.deepEqual(firstTodosQuery.result.current.slice(0, 3), [null, true, null]);

	await firstTodosQuery.waitForNextUpdate();
	t.deepEqual(firstTodosQuery.result.current.slice(0, 3), [firstTodos, false, null]);
	firstTodosQuery.unmount();

	await mutation.result.current[0]({
		title: 'B'
	});

	t.false(nock.isDone());
	t.deepEqual(mutation.result.current.slice(1, 4), [
		{
			createTodo: {
				id: 'b',
				title: 'B',
				__typename: 'Todo'
			},
			__typename: 'RootMutation'
		},
		false,
		null
	]);

	const secondTodosQuery = renderHook(() => useQuery(TODOS_QUERY), {wrapper});
	t.deepEqual(secondTodosQuery.result.current.slice(0, 3), [null, true, null]);

	await secondTodosQuery.waitForNextUpdate();
	t.deepEqual(secondTodosQuery.result.current.slice(0, 3), [secondTodos, false, null]);
});
