export default class GraphQLError extends Error {
	private readonly _errors: Error[];

	constructor(errors: Error[]) {
		super(errors[0].message || 'Request failed');

		this.name = 'GraphQLError';
		this._errors = errors;
	}

	toArray(): Error[] {
		return this._errors;
	}

	// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
	*[Symbol.iterator]() {
		for (const error of this._errors) {
			yield error;
		}
	}
}
