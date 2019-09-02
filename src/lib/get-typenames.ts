import {uniq, isPlainObject} from 'lodash';

const scanTypenames = (data: any): string[] => {
	if (!data) {
		return [];
	}

	const typenames: string[] = [];

	for (const [key, value] of Object.entries(data)) {
		if (key === '__typename') {
			typenames.push(value as string);
		}

		if (Array.isArray(value)) {
			for (const item of value) {
				typenames.push(...scanTypenames(item));
			}
		}

		if (isPlainObject(value)) {
			typenames.push(...scanTypenames(value));
		}
	}

	return typenames;
};

export default (data: any): string[] => {
	const rootTypename = data.__typename;

	return uniq(scanTypenames(data)).filter(typename => typename !== rootTypename);
};
