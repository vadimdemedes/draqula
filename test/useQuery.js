import test from 'ava';
import React from 'react';
import gql from 'graphql-tag';
import nock from 'nock';
import {renderHook, act} from '@testing-library/react-hooks';
import {Draqula, DraqulaContext, GraphQLError, NetworkError, useQuery, useMutation} from '..';
import createWrapper from './_create-wrapper';
import createDocument from './_create-document';
import assertQuery from './_assert-query';

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
	assertQuery(t, result, {
		data: undefined,
		isLoading: true,
		error: undefined
	});

	await waitForNextUpdate();

	assertQuery(t, result, {
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
		},
		isLoading: false,
		error: undefined
	});

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

	assertQuery(t, firstRender.result, {
		data: undefined,
		isLoading: true,
		error: undefined
	});

	await firstRender.waitForNextUpdate();

	assertQuery(t, firstRender.result, {
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
		},
		isLoading: false,
		error: undefined
	});

	firstRender.unmount();

	const secondRender = renderHook(() => useQuery(TODOS_QUERY), {wrapper: createWrapper(client)});

	assertQuery(t, secondRender.result, {
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
		},
		isLoading: false,
		error: undefined
	});

	await secondRender.waitForNextUpdate();

	assertQuery(t, secondRender.result, {
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
		},
		isLoading: false,
		error: undefined
	});

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

	assertQuery(t, firstRender.result, {
		data: undefined,
		isLoading: true,
		error: undefined
	});

	await firstRender.waitForNextUpdate();

	assertQuery(t, firstRender.result, {
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
		},
		isLoading: false,
		error: undefined
	});

	firstRender.unmount();

	const secondRender = renderHook(() => useQuery(TODOS_QUERY), {wrapper: createWrapper(client)});

	assertQuery(t, secondRender.result, {
		data: undefined,
		isLoading: true,
		error: undefined
	});

	await secondRender.waitForNextUpdate();

	assertQuery(t, secondRender.result, {
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
		},
		isLoading: false,
		error: undefined
	});

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

	assertQuery(t, firstRender.result, {
		data: undefined,
		isLoading: true,
		error: undefined
	});

	await firstRender.waitForNextUpdate();

	assertQuery(t, firstRender.result, {
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
		},
		isLoading: false,
		error: undefined
	});

	firstRender.unmount();

	const secondRender = renderHook(() => useQuery(TODOS_QUERY, {}, {cache: false}), {
		wrapper: createWrapper(client)
	});

	assertQuery(t, secondRender.result, {
		data: undefined,
		isLoading: true,
		error: undefined
	});

	await secondRender.waitForNextUpdate();

	assertQuery(t, secondRender.result, {
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
		},
		isLoading: false,
		error: undefined
	});

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

	assertQuery(t, result, {
		data: undefined,
		isLoading: true,
		error: undefined
	});

	await waitForNextUpdate();

	assertQuery(t, result, {
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
		},
		isLoading: false,
		error: undefined
	});

	act(() => {
		result.current.refetch();
	});

	assertQuery(t, result, {
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
		},
		isLoading: false,
		error: undefined
	});

	await waitForNextUpdate();

	assertQuery(t, result, {
		data: {
			todos: [
				{
					id: 'a',
					title: 'A'
				}
			]
		},
		isLoading: false,
		error: undefined
	});

	t.true(nock.isDone());
});

test('refetch when page becomes active', async t => {
	global.document = createDocument();
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

	assertQuery(t, result, {
		data: undefined,
		isLoading: true,
		error: undefined
	});

	await waitForNextUpdate();

	assertQuery(t, result, {
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
		},
		isLoading: false,
		error: undefined
	});

	act(() => {
		document.hidden = false;
		global.document.emit('visibilitychange');
	});

	assertQuery(t, result, {
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
		},
		isLoading: false,
		error: undefined
	});

	await waitForNextUpdate();

	assertQuery(t, result, {
		data: {
			todos: [
				{
					id: 'a',
					title: 'A'
				}
			]
		},
		isLoading: false,
		error: undefined
	});

	t.true(nock.isDone());
	global.document = undefined;
});

test('avoid refetch when page becomes active if this behavior is disabled', async t => {
	global.document = createDocument();
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

	const {result, waitForNextUpdate} = renderHook(
		() => {
			return useQuery(
				TODOS_QUERY,
				{},
				{
					refetchOnFocus: false
				}
			);
		},
		{wrapper: createWrapper(client)}
	);

	assertQuery(t, result, {
		data: undefined,
		isLoading: true,
		error: undefined
	});

	await waitForNextUpdate();

	assertQuery(t, result, {
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
		},
		isLoading: false,
		error: undefined
	});

	act(() => {
		document.hidden = false;
		global.document.emit('visibilitychange');
	});

	assertQuery(t, result, {
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
		},
		isLoading: false,
		error: undefined
	});

	await t.throwsAsync(waitForNextUpdate({timeout: 1000}));

	assertQuery(t, result, {
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
		},
		isLoading: false,
		error: undefined
	});

	t.true(nock.isDone());
	global.document = undefined;
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

	assertQuery(t, result, {
		data: undefined,
		isLoading: true,
		error: undefined
	});

	await waitForNextUpdate();

	assertQuery(t, result, {
		data: firstPage,
		isLoading: false,
		error: undefined
	});

	page = 2;
	rerender();

	assertQuery(t, result, {
		data: undefined,
		isLoading: true,
		error: undefined
	});

	await waitForNextUpdate();

	assertQuery(t, result, {
		data: secondPage,
		isLoading: false,
		error: undefined
	});

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

	assertQuery(t, result, {
		data: undefined,
		isLoading: true,
		error: undefined
	});

	await waitForNextUpdate();

	assertQuery(t, result, {
		data: firstPage,
		isLoading: false,
		error: undefined
	});

	page = 2;
	rerender();

	assertQuery(t, result, {
		data: undefined,
		isLoading: true,
		error: undefined
	});

	await waitForNextUpdate();

	assertQuery(t, result, {
		data: secondPage,
		isLoading: false,
		error: undefined
	});

	page = 1;
	rerender();

	await waitForNextUpdate();

	assertQuery(t, result, {
		data: firstPage,
		isLoading: false,
		error: undefined
	});

	page = 2;
	rerender();

	await waitForNextUpdate();

	assertQuery(t, result, {
		data: secondPage,
		isLoading: false,
		error: undefined
	});

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

	assertQuery(t, result, {
		data: undefined,
		isLoading: true,
		error: undefined
	});

	await waitForNextUpdate();

	assertQuery(t, result, {
		data: firstPage,
		isLoading: false,
		error: undefined
	});

	act(() => {
		result.current.fetchMore({
			page: 2
		});
	});

	assertQuery(t, result, {
		data: firstPage,
		isLoading: false,
		error: undefined,
		isFetchingMore: true
	});

	await waitForNextUpdate();

	assertQuery(t, result, {
		data: {
			todos: [...firstPage.todos, ...secondPage.todos]
		},
		isLoading: false,
		error: undefined,
		isFetchingMore: false
	});

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

	assertQuery(t, result, {
		data: undefined,
		isLoading: true,
		error: undefined
	});

	await waitForNextUpdate();

	assertQuery(t, result, {
		data: firstPage,
		isLoading: false,
		error: undefined
	});

	act(() => {
		result.current.fetchMore(
			{
				page: 2
			},
			{
				merge: (prevData, nextData) => nextData
			}
		);
	});

	assertQuery(t, result, {
		data: firstPage,
		isLoading: false,
		error: undefined
	});

	await waitForNextUpdate();

	assertQuery(t, result, {
		data: secondPage,
		isLoading: false,
		error: undefined
	});

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
					message: 'Error 1',
					extensions: {code: 'ERROR_1'}
				},
				{
					message: 'Error 2',
					extensions: {code: 'ERROR_2'}
				}
			]
		});

	const {result, waitForNextUpdate} = renderHook(() => useQuery(TODOS_QUERY), {wrapper: createWrapper(client)});

	assertQuery(t, result, {
		data: undefined,
		isLoading: true,
		error: undefined
	});

	t.is(result.error, undefined);

	await waitForNextUpdate();

	t.is(result.current.data, undefined);
	t.false(result.current.isLoading);
	t.true(result.current.error instanceof GraphQLError);
	t.is(result.current.error.message, 'Error 1');
	t.is(result.current.error.toArray().length, 2);
	t.is(result.current.error.toArray()[0].message, 'Error 1');
	t.is(result.current.error.toArray()[0].extensions.code, 'ERROR_1');
	t.is(result.current.error.toArray()[1].message, 'Error 2');
	t.is(result.current.error.toArray()[1].extensions.code, 'ERROR_2');
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

	assertQuery(t, result, {
		data: undefined,
		isLoading: true,
		error: undefined
	});

	t.is(result.error, undefined);

	await waitForNextUpdate();
	t.is(result.current.data, undefined);
	t.false(result.current.isLoading);
	t.true(result.current.error instanceof GraphQLError);
	t.is(result.current.error.toArray().length, 2);
	t.is(result.current.error.toArray()[0].message, 'Error 1');
	t.is(result.current.error.toArray()[1].message, 'Error 2');
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

	assertQuery(t, result, {
		data: undefined,
		isLoading: true,
		error: undefined
	});

	t.is(result.error, undefined);

	await waitForNextUpdate();
	t.is(result.current.data, undefined);
	t.false(result.current.isLoading);
	t.true(result.current.error instanceof GraphQLError);
	t.is(result.current.error.toArray().length, 2);
	t.is(result.current.error.toArray()[0].message, 'Error 1');
	t.is(result.current.error.toArray()[1].message, 'Error 2');
	t.true(nock.isDone());
});

test('handle network errors', async t => {
	const client = new Draqula('http://graph.ql');

	const request = nock('http://graph.ql')
		.post('/')
		.times(3)
		.reply(500);

	const {result, waitForNextUpdate} = renderHook(() => useQuery(TODOS_QUERY), {wrapper: createWrapper(client)});

	assertQuery(t, result, {
		data: undefined,
		isLoading: true,
		error: undefined
	});

	t.is(result.error, undefined);

	await waitForNextUpdate();

	t.is(result.current.data, undefined);
	t.false(result.current.isLoading);
	t.true(result.current.error instanceof NetworkError);
	t.is(result.current.error.message, 'Internal Server Error');
	t.true(nock.isDone());
});

test('do not retry 4xx responses', async t => {
	const client = new Draqula('http://graph.ql');

	const request = nock('http://graph.ql')
		.post('/')
		.reply(400);

	const {result, waitForNextUpdate} = renderHook(() => useQuery(TODOS_QUERY), {wrapper: createWrapper(client)});

	assertQuery(t, result, {
		data: undefined,
		isLoading: true,
		error: undefined
	});

	t.is(result.error, undefined);

	await waitForNextUpdate();
	t.is(result.current.data, undefined);
	t.false(result.current.isLoading);
	t.true(result.current.error instanceof NetworkError);
	t.is(result.current.error.message, 'Bad Request');
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

	assertQuery(t, result, {
		data: undefined,
		isLoading: true,
		error: undefined
	});

	t.is(result.error, undefined);

	await waitForNextUpdate();
	t.is(result.current.data, undefined);
	t.false(result.current.isLoading);
	t.true(result.current.error instanceof NetworkError);
	t.is(result.current.error.message, 'Request timed out');
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

	assertQuery(t, result, {
		data: undefined,
		isLoading: true,
		error: undefined
	});

	t.is(result.error, undefined);

	await waitForNextUpdate();
	t.is(result.current.data, undefined);
	t.false(result.current.isLoading);
	t.true(result.current.error instanceof NetworkError);
	t.is(result.current.error.message, 'Request timed out');
	t.true(nock.isDone());
});

test('clear cache', async t => {
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

	assertQuery(t, firstRender.result, {
		data: undefined,
		isLoading: true,
		error: undefined
	});

	await firstRender.waitForNextUpdate();

	assertQuery(t, firstRender.result, {
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
		},
		isLoading: false,
		error: undefined
	});

	firstRender.unmount();
	client.clearCache();

	const secondRender = renderHook(() => useQuery(TODOS_QUERY), {wrapper: createWrapper(client)});

	assertQuery(t, secondRender.result, {
		data: undefined,
		isLoading: true,
		error: undefined
	});

	await secondRender.waitForNextUpdate();

	assertQuery(t, secondRender.result, {
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
		},
		isLoading: false,
		error: undefined
	});

	t.true(nock.isDone());
});

test('preload query and render with warm cache', async t => {
	const client = new Draqula('http://graph.ql');

	const todos = [
		{
			id: 'a',
			title: 'A'
		},
		{
			id: 'b',
			title: 'B'
		}
	];

	const request = nock('http://graph.ql')
		.post('/')
		.twice()
		.reply(200, {
			data: {todos}
		});

	await client.preload(TODOS_QUERY);

	const {result, waitForNextUpdate} = renderHook(() => useQuery(TODOS_QUERY), {wrapper: createWrapper(client)});
	assertQuery(t, result, {
		data: {todos},
		isLoading: false,
		error: undefined
	});

	await waitForNextUpdate();

	assertQuery(t, result, {
		data: {todos},
		isLoading: false,
		error: undefined
	});

	t.true(nock.isDone());
});

test('change cache', async t => {
	const client = new Draqula('http://graph.ql');

	const firstTodos = [
		{
			id: 'a',
			title: 'A'
		},
		{
			id: 'b',
			title: 'B'
		}
	];

	const secondTodos = [
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
	];

	const firstRequest = nock('http://graph.ql')
		.post('/')
		.reply(200, {
			data: {todos: firstTodos}
		});

	const secondRequest = nock('http://graph.ql')
		.post('/')
		.reply(200, {
			data: {todos: secondTodos}
		});

	const firstQuery = renderHook(() => useQuery(TODOS_QUERY), {wrapper: createWrapper(client)});
	assertQuery(t, firstQuery.result, {
		data: undefined,
		isLoading: true,
		error: undefined
	});

	await firstQuery.waitForNextUpdate();

	assertQuery(t, firstQuery.result, {
		data: {todos: firstTodos},
		isLoading: false,
		error: undefined
	});

	firstQuery.result.current.setData({todos: secondTodos});

	await firstQuery.waitForNextUpdate();

	assertQuery(t, firstQuery.result, {
		data: {todos: secondTodos},
		isLoading: false,
		error: undefined
	});

	const secondQuery = renderHook(() => useQuery(TODOS_QUERY), {wrapper: createWrapper(client)});
	assertQuery(t, secondQuery.result, {
		data: {todos: secondTodos},
		isLoading: false,
		error: undefined
	});

	await secondQuery.waitForNextUpdate();

	assertQuery(t, secondQuery.result, {
		data: {todos: secondTodos},
		isLoading: false,
		error: undefined
	});

	t.true(nock.isDone());
});

test('change cache using reducer', async t => {
	const client = new Draqula('http://graph.ql');

	const firstTodos = [
		{
			id: 'a',
			title: 'A'
		},
		{
			id: 'b',
			title: 'B'
		}
	];

	const secondTodos = [
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
	];

	const firstRequest = nock('http://graph.ql')
		.post('/')
		.reply(200, {
			data: {todos: firstTodos}
		});

	const secondRequest = nock('http://graph.ql')
		.post('/')
		.reply(200, {
			data: {todos: secondTodos}
		});

	const firstQuery = renderHook(() => useQuery(TODOS_QUERY), {wrapper: createWrapper(client)});
	assertQuery(t, firstQuery.result, {
		data: undefined,
		isLoading: true,
		error: undefined
	});

	await firstQuery.waitForNextUpdate();

	assertQuery(t, firstQuery.result, {
		data: {todos: firstTodos},
		isLoading: false,
		error: undefined
	});

	firstQuery.result.current.setData(prevData => {
		t.deepEqual(prevData, {todos: firstTodos});
		return {todos: secondTodos};
	});

	await firstQuery.waitForNextUpdate();

	assertQuery(t, firstQuery.result, {
		data: {todos: secondTodos},
		isLoading: false,
		error: undefined
	});

	const secondQuery = renderHook(() => useQuery(TODOS_QUERY), {wrapper: createWrapper(client)});
	assertQuery(t, secondQuery.result, {
		data: {todos: secondTodos},
		isLoading: false,
		error: undefined
	});

	await secondQuery.waitForNextUpdate();

	assertQuery(t, secondQuery.result, {
		data: {todos: secondTodos},
		isLoading: false,
		error: undefined
	});

	t.true(nock.isDone());
});
