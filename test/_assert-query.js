export default (t, result, {data, isLoading, error, isFetchingMore}) => {
	t.deepEqual(result.current.data, data);
	t.is(result.current.isLoading, isLoading);
	t.is(result.current.error, error);

	if (typeof isFetchingMore === 'boolean') {
		t.is(result.current.isFetchingMore, isFetchingMore);
	}
};
