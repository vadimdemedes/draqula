export default (t, result, {data, isLoading, error}) => {
	t.deepEqual(result.current.data, data);
	t.is(result.current.isLoading, isLoading);
	t.is(result.current.error, error);
};
