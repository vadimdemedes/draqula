export default class NetworkError extends Error {
	originalError: Error;

	constructor(originalError: Error) {
		super(originalError.message);

		this.name = 'NetworkError';
		this.originalError = originalError;
	}
}
