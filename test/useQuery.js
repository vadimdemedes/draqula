import test from 'ava';
import React from 'react';
import gql from 'graphql-tag';
import nock from 'nock';
import {renderHook, act} from '@testing-library/react-hooks';
import {Draqula, DraqulaContext, GraphQLError, NetworkError, useQuery, useMutation} from '..';
import createWrapper from './_create-wrapper';

nock.disableNetConnect();

const TODOS_QUERY = gql`
	{
		todos {
			id
			title
		}
	}
`;

const TODOS_WITH_PAGES_QUERY = gql`
	query Todos($page: Int!) {
		todos(page: $page) {
			id
			title
		}
	}
`;

test.afterEach(() => nock.cleanAll());

test('query data', async t => {
	const client = new Draqula('http://graph.ql');

	const request = nock('http://graph.ql')
		.post('/')
		.reply(200, {
			data: {
				todos: [
					{
						id: 'a',
						title: 'A'
					},
					{
						id: 'b',
						title: 'B'
					}
				]
			}
		});

	const {result, waitForNextUpdate} = renderHook(() => useQuery(TODOS_QUERY), {wrapper: createWrapper(client)});
	t.deepEqual(result.current.slice(0, 3), [null, true, null]);

	await waitForNextUpdate();

	t.deepEqual(result.current.slice(0, 3), [
		{
			todos: [
				{
					id: 'a',
					title: 'A'
				},
				{
					id: 'b',
					title: 'B'
				}
			]
		},
		false,
		null
	]);

	t.true(nock.isDone());
});

test('render cached data if possible and refetch', async t => {
	const client = new Draqula('http://graph.ql');

	const firstRequest = nock('http://graph.ql')
		.post('/')
		.reply(200, {
			data: {
				todos: [
					{
						id: 'a',
						title: 'A'
					},
					{
						id: 'b',
						title: 'B'
					}
				]
			}
		});

	const secondRequest = nock('http://graph.ql')
		.post('/')
		.reply(200, {
			data: {
				todos: [
					{
						id: 'a',
						title: 'A'
					},
					{
						id: 'b',
						title: 'B'
					},
					{
						id: 'c',
						title: 'C'
					}
				]
			}
		});

	const firstRender = renderHook(() => useQuery(TODOS_QUERY), {wrapper: createWrapper(client)});
	t.deepEqual(firstRender.result.current.slice(0, 3), [null, true, null]);

	await firstRender.waitForNextUpdate();

	t.deepEqual(firstRender.result.current.slice(0, 3), [
		{
			todos: [
				{
					id: 'a',
					title: 'A'
				},
				{
					id: 'b',
					title: 'B'
				}
			]
		},
		false,
		null
	]);

	firstRender.unmount();

	const secondRender = renderHook(() => useQuery(TODOS_QUERY), {wrapper: createWrapper(client)});

	t.deepEqual(secondRender.result.current.slice(0, 3), [
		{
			todos: [
				{
					id: 'a',
					title: 'A'
				},
				{
					id: 'b',
					title: 'B'
				}
			]
		},
		false,
		null
	]);

	await secondRender.waitForNextUpdate();

	t.deepEqual(secondRender.result.current.slice(0, 3), [
		{
			todos: [
				{
					id: 'a',
					title: 'A'
				},
				{
					id: 'b',
					title: 'B'
				},
				{
					id: 'c',
					title: 'C'
				}
			]
		},
		false,
		null
	]);

	t.true(nock.isDone());
});

test('disable cache for all queries', async t => {
	const client = new Draqula('http://graph.ql', {
		cache: false
	});

	const firstRequest = nock('http://graph.ql')
		.post('/')
		.reply(200, {
			data: {
				todos: [
					{
						id: 'a',
						title: 'A'
					},
					{
						id: 'b',
						title: 'B'
					}
				]
			}
		});

	const secondRequest = nock('http://graph.ql')
		.post('/')
		.reply(200, {
			data: {
				todos: [
					{
						id: 'a',
						title: 'A'
					},
					{
						id: 'b',
						title: 'B'
					},
					{
						id: 'c',
						title: 'C'
					}
				]
			}
		});

	const firstRender = renderHook(() => useQuery(TODOS_QUERY), {wrapper: createWrapper(client)});
	t.deepEqual(firstRender.result.current.slice(0, 3), [null, true, null]);

	await firstRender.waitForNextUpdate();

	t.deepEqual(firstRender.result.current.slice(0, 3), [
		{
			todos: [
				{
					id: 'a',
					title: 'A'
				},
				{
					id: 'b',
					title: 'B'
				}
			]
		},
		false,
		null
	]);

	firstRender.unmount();

	const secondRender = renderHook(() => useQuery(TODOS_QUERY), {wrapper: createWrapper(client)});
	t.deepEqual(secondRender.result.current.slice(0, 3), [null, true, null]);

	await secondRender.waitForNextUpdate();

	t.deepEqual(secondRender.result.current.slice(0, 3), [
		{
			todos: [
				{
					id: 'a',
					title: 'A'
				},
				{
					id: 'b',
					title: 'B'
				},
				{
					id: 'c',
					title: 'C'
				}
			]
		},
		false,
		null
	]);

	t.true(nock.isDone());
});

test('disable cache per query', async t => {
	const client = new Draqula('http://graph.ql');

	const firstRequest = nock('http://graph.ql')
		.post('/')
		.reply(200, {
			data: {
				todos: [
					{
						id: 'a',
						title: 'A'
					},
					{
						id: 'b',
						title: 'B'
					}
				]
			}
		});

	const secondRequest = nock('http://graph.ql')
		.post('/')
		.reply(200, {
			data: {
				todos: [
					{
						id: 'a',
						title: 'A'
					},
					{
						id: 'b',
						title: 'B'
					},
					{
						id: 'c',
						title: 'C'
					}
				]
			}
		});

	const firstRender = renderHook(() => useQuery(TODOS_QUERY, {}, {cache: false}), {wrapper: createWrapper(client)});
	t.deepEqual(firstRender.result.current.slice(0, 3), [null, true, null]);

	await firstRender.waitForNextUpdate();

	t.deepEqual(firstRender.result.current.slice(0, 3), [
		{
			todos: [
				{
					id: 'a',
					title: 'A'
				},
				{
					id: 'b',
					title: 'B'
				}
			]
		},
		false,
		null
	]);

	firstRender.unmount();

	const secondRender = renderHook(() => useQuery(TODOS_QUERY, {}, {cache: false}), {
		wrapper: createWrapper(client)
	});
	t.deepEqual(secondRender.result.current.slice(0, 3), [null, true, null]);

	await secondRender.waitForNextUpdate();

	t.deepEqual(secondRender.result.current.slice(0, 3), [
		{
			todos: [
				{
					id: 'a',
					title: 'A'
				},
				{
					id: 'b',
					title: 'B'
				},
				{
					id: 'c',
					title: 'C'
				}
			]
		},
		false,
		null
	]);

	t.true(nock.isDone());
});

test('refetch on demand', async t => {
	const client = new Draqula('http://graph.ql');

	const firstRequest = nock('http://graph.ql')
		.post('/')
		.reply(200, {
			data: {
				todos: [
					{
						id: 'a',
						title: 'A'
					},
					{
						id: 'b',
						title: 'B'
					}
				]
			}
		});

	const secondRequest = nock('http://graph.ql')
		.post('/')
		.reply(200, {
			data: {
				todos: [
					{
						id: 'a',
						title: 'A'
					}
				]
			}
		});

	const {result, waitForNextUpdate} = renderHook(() => useQuery(TODOS_QUERY), {wrapper: createWrapper(client)});
	t.deepEqual(result.current.slice(0, 3), [null, true, null]);

	await waitForNextUpdate();

	t.deepEqual(result.current.slice(0, 3), [
		{
			todos: [
				{
					id: 'a',
					title: 'A'
				},
				{
					id: 'b',
					title: 'B'
				}
			]
		},
		false,
		null
	]);

	act(() => {
		result.current[3].refetch();
	});

	t.deepEqual(result.current.slice(0, 3), [
		{
			todos: [
				{
					id: 'a',
					title: 'A'
				},
				{
					id: 'b',
					title: 'B'
				}
			]
		},
		false,
		null
	]);

	await waitForNextUpdate();

	t.deepEqual(result.current.slice(0, 3), [
		{
			todos: [
				{
					id: 'a',
					title: 'A'
				}
			]
		},
		false,
		null
	]);

	t.true(nock.isDone());
});

test('fetch query with different variables', async t => {
	const client = new Draqula('http://graph.ql');

	const firstPage = {
		todos: [
			{
				id: 'a',
				title: 'A'
			},
			{
				id: 'b',
				title: 'B'
			}
		]
	};

	const secondPage = {
		todos: [
			{
				id: 'c',
				title: 'C'
			},
			{
				id: 'd',
				title: 'D'
			}
		]
	};

	const firstRequest = nock('http://graph.ql')
		.post('/', {
			query: /.+/,
			variables: {
				page: 1
			}
		})
		.reply(200, {
			data: firstPage
		});

	const secondRequest = nock('http://graph.ql')
		.post('/', {
			query: /.+/,
			variables: {
				page: 2
			}
		})
		.reply(200, {
			data: secondPage
		});

	let page = 1;
	const {result, rerender, waitForNextUpdate} = renderHook(() => useQuery(TODOS_QUERY, {page}), {
		wrapper: createWrapper(client)
	});

	t.deepEqual(result.current.slice(0, 3), [null, true, null]);

	await waitForNextUpdate();
	t.deepEqual(result.current.slice(0, 3), [firstPage, false, null]);

	page = 2;
	rerender();
	t.deepEqual(result.current.slice(0, 3), [null, true, null]);

	await waitForNextUpdate();

	t.deepEqual(result.current.slice(0, 3), [secondPage, false, null]);
	t.true(nock.isDone());
});

test('cache data for different variables', async t => {
	const client = new Draqula('http://graph.ql');

	const firstPage = {
		todos: [
			{
				id: 'a',
				title: 'A'
			},
			{
				id: 'b',
				title: 'B'
			}
		]
	};

	const secondPage = {
		todos: [
			{
				id: 'c',
				title: 'C'
			},
			{
				id: 'd',
				title: 'D'
			}
		]
	};

	const firstRequest = nock('http://graph.ql')
		.post('/', {
			query: /.+/,
			variables: {
				page: 1
			}
		})
		.reply(200, {
			data: firstPage
		});

	const secondRequest = nock('http://graph.ql')
		.post('/', {
			query: /.+/,
			variables: {
				page: 2
			}
		})
		.reply(200, {
			data: secondPage
		});

	const thirdRequest = nock('http://graph.ql')
		.post('/', {
			query: /.+/,
			variables: {
				page: 1
			}
		})
		.reply(200, {
			data: firstPage
		});

	const fourthRequest = nock('http://graph.ql')
		.post('/', {
			query: /.+/,
			variables: {
				page: 2
			}
		})
		.reply(200, {
			data: secondPage
		});

	let page = 1;
	const {result, rerender, waitForNextUpdate} = renderHook(() => useQuery(TODOS_QUERY, {page}), {
		wrapper: createWrapper(client)
	});

	t.deepEqual(result.current.slice(0, 3), [null, true, null]);

	await waitForNextUpdate();
	t.deepEqual(result.current.slice(0, 3), [firstPage, false, null]);

	page = 2;
	rerender();
	t.deepEqual(result.current.slice(0, 3), [null, true, null]);

	await waitForNextUpdate();
	t.deepEqual(result.current.slice(0, 3), [secondPage, false, null]);

	page = 1;
	rerender();
	t.deepEqual(result.current.slice(0, 3), [firstPage, false, null]);

	await waitForNextUpdate();
	t.deepEqual(result.current.slice(0, 3), [firstPage, false, null]);

	page = 2;
	rerender();
	t.deepEqual(result.current.slice(0, 3), [secondPage, false, null]);

	await waitForNextUpdate();
	t.deepEqual(result.current.slice(0, 3), [secondPage, false, null]);
	t.true(nock.isDone());
});

test('fetch more', async t => {
	const client = new Draqula('http://graph.ql');

	const firstPage = {
		todos: [
			{
				id: 'a',
				title: 'A'
			},
			{
				id: 'b',
				title: 'B'
			}
		]
	};

	const secondPage = {
		todos: [
			{
				id: 'c',
				title: 'C'
			},
			{
				id: 'd',
				title: 'D'
			}
		]
	};

	const firstRequest = nock('http://graph.ql')
		.post('/', {
			query: /.+/,
			variables: {
				page: 1
			}
		})
		.reply(200, {
			data: firstPage
		});

	const secondRequest = nock('http://graph.ql')
		.post('/', {
			query: /.+/,
			variables: {
				page: 2
			}
		})
		.reply(200, {
			data: secondPage
		});

	const {result, waitForNextUpdate} = renderHook(() => useQuery(TODOS_QUERY, {page: 1}), {
		wrapper: createWrapper(client)
	});

	t.deepEqual(result.current.slice(0, 3), [null, true, null]);

	await waitForNextUpdate();
	t.deepEqual(result.current.slice(0, 3), [firstPage, false, null]);

	act(() => {
		result.current[3].fetchMore({
			page: 2
		});
	});

	t.deepEqual(result.current.slice(0, 3), [firstPage, false, null]);
	t.true(result.current[3].fetchingMore);

	await waitForNextUpdate();

	t.deepEqual(result.current.slice(0, 3), [
		{
			todos: [...firstPage.todos, ...secondPage.todos]
		},
		false,
		null
	]);

	t.false(result.current[3].fetchingMore);
	t.true(nock.isDone());
});

test('fetch more with custom merge function', async t => {
	const client = new Draqula('http://graph.ql');

	const firstPage = {
		todos: [
			{
				id: 'a',
				title: 'A'
			},
			{
				id: 'b',
				title: 'B'
			}
		]
	};

	const secondPage = {
		todos: [
			{
				id: 'c',
				title: 'C'
			},
			{
				id: 'd',
				title: 'D'
			}
		]
	};

	const firstRequest = nock('http://graph.ql')
		.post('/', {
			query: /.+/,
			variables: {
				page: 1
			}
		})
		.reply(200, {
			data: firstPage
		});

	const secondRequest = nock('http://graph.ql')
		.post('/', {
			query: /.+/,
			variables: {
				page: 2
			}
		})
		.reply(200, {
			data: secondPage
		});

	const {result, waitForNextUpdate} = renderHook(() => useQuery(TODOS_QUERY, {page: 1}), {
		wrapper: createWrapper(client)
	});

	t.deepEqual(result.current.slice(0, 3), [null, true, null]);

	await waitForNextUpdate();
	t.deepEqual(result.current.slice(0, 3), [firstPage, false, null]);

	act(() => {
		result.current[3].fetchMore(
			{
				page: 2
			},
			{
				merge: (prevData, nextData) => nextData
			}
		);
	});

	t.deepEqual(result.current.slice(0, 3), [firstPage, false, null]);

	await waitForNextUpdate();
	t.deepEqual(result.current.slice(0, 3), [secondPage, false, null]);
	t.true(nock.isDone());
});

test('handle GQL errors', async t => {
	const client = new Draqula('http://graph.ql');

	const request = nock('http://graph.ql')
		.post('/')
		.times(3)
		.reply(200, {
			errors: [
				{
					message: 'Error 1'
				},
				{
					message: 'Error 2'
				}
			]
		});

	const {result, waitForNextUpdate} = renderHook(() => useQuery(TODOS_QUERY), {wrapper: createWrapper(client)});
	t.deepEqual(result.current.slice(0, 3), [null, true, null]);
	t.is(result.error, undefined);

	await waitForNextUpdate();
	t.is(result.current[0], null);
	t.false(result.current[1]);
	t.true(result.current[2] instanceof GraphQLError);
	t.is(result.current[2].toArray().length, 2);
	t.is(result.current[2].toArray()[0].message, 'Error 1');
	t.is(result.current[2].toArray()[1].message, 'Error 2');
	t.true(nock.isDone());
});

test('do not retry failed requests', async t => {
	const client = new Draqula('http://graph.ql', {
		retry: false
	});

	const request = nock('http://graph.ql')
		.post('/')
		.reply(200, {
			errors: [
				{
					message: 'Error 1'
				},
				{
					message: 'Error 2'
				}
			]
		});

	const {result, waitForNextUpdate} = renderHook(() => useQuery(TODOS_QUERY), {wrapper: createWrapper(client)});
	t.deepEqual(result.current.slice(0, 3), [null, true, null]);
	t.is(result.error, undefined);

	await waitForNextUpdate();
	t.is(result.current[0], null);
	t.false(result.current[1]);
	t.true(result.current[2] instanceof GraphQLError);
	t.is(result.current[2].toArray().length, 2);
	t.is(result.current[2].toArray()[0].message, 'Error 1');
	t.is(result.current[2].toArray()[1].message, 'Error 2');
	t.true(nock.isDone());
});

test('retry failed requests N times', async t => {
	const client = new Draqula('http://graph.ql', {
		retry: 1
	});

	const request = nock('http://graph.ql')
		.post('/')
		.times(2)
		.reply(200, {
			errors: [
				{
					message: 'Error 1'
				},
				{
					message: 'Error 2'
				}
			]
		});

	const {result, waitForNextUpdate} = renderHook(() => useQuery(TODOS_QUERY), {wrapper: createWrapper(client)});
	t.deepEqual(result.current.slice(0, 3), [null, true, null]);
	t.is(result.error, undefined);

	await waitForNextUpdate();
	t.is(result.current[0], null);
	t.false(result.current[1]);
	t.true(result.current[2] instanceof GraphQLError);
	t.is(result.current[2].toArray().length, 2);
	t.is(result.current[2].toArray()[0].message, 'Error 1');
	t.is(result.current[2].toArray()[1].message, 'Error 2');
	t.true(nock.isDone());
});

test('handle network errors', async t => {
	const client = new Draqula('http://graph.ql');

	const request = nock('http://graph.ql')
		.post('/')
		.times(3)
		.reply(500);

	const {result, waitForNextUpdate} = renderHook(() => useQuery(TODOS_QUERY), {wrapper: createWrapper(client)});
	t.deepEqual(result.current.slice(0, 3), [null, true, null]);
	t.is(result.error, undefined);

	await waitForNextUpdate();
	t.is(result.current[0], null);
	t.false(result.current[1]);
	t.true(result.current[2] instanceof NetworkError);
	t.is(result.current[2].message, 'Internal Server Error');
	t.true(nock.isDone());
});

test('do not retry 4xx responses', async t => {
	const client = new Draqula('http://graph.ql');

	const request = nock('http://graph.ql')
		.post('/')
		.reply(400);

	const {result, waitForNextUpdate} = renderHook(() => useQuery(TODOS_QUERY), {wrapper: createWrapper(client)});
	t.deepEqual(result.current.slice(0, 3), [null, true, null]);
	t.is(result.error, undefined);

	await waitForNextUpdate();
	t.is(result.current[0], null);
	t.false(result.current[1]);
	t.true(result.current[2] instanceof NetworkError);
	t.is(result.current[2].message, 'Bad Request');
	t.true(nock.isDone());
});

test('customize timeout for all queries', async t => {
	const client = new Draqula('http://graph.ql', {
		timeout: 500
	});

	const request = nock('http://graph.ql')
		.post('/')
		.delay(600)
		.times(3)
		.reply(500);

	const {result, waitForNextUpdate} = renderHook(() => useQuery(TODOS_QUERY), {wrapper: createWrapper(client)});
	t.deepEqual(result.current.slice(0, 3), [null, true, null]);
	t.is(result.error, undefined);

	await waitForNextUpdate();
	t.is(result.current[0], null);
	t.false(result.current[1]);
	t.true(result.current[2] instanceof NetworkError);
	t.is(result.current[2].message, 'Request timed out');
	t.true(nock.isDone());
});

test('customize timeout per query', async t => {
	const client = new Draqula('http://graph.ql');

	const request = nock('http://graph.ql')
		.post('/')
		.delay(600)
		.times(3)
		.reply(500);

	const {result, waitForNextUpdate} = renderHook(() => useQuery(TODOS_QUERY, {}, {timeout: 500}), {
		wrapper: createWrapper(client)
	});

	t.deepEqual(result.current.slice(0, 3), [null, true, null]);
	t.is(result.error, undefined);

	await waitForNextUpdate();
	t.is(result.current[0], null);
	t.false(result.current[1]);
	t.true(result.current[2] instanceof NetworkError);
	t.is(result.current[2].message, 'Request timed out');
	t.true(nock.isDone());
});
