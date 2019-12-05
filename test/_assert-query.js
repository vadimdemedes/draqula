export default (t, result, {data, error, isFetchingMore}) => {
	t.deepEqual(result.current.data, data);
	t.is(result.current.error, error);

	if (typeof isFetchingMore === 'boolean') {
		t.is(result.current.isFetchingMore, isFetchingMore);
	}
};
