import {useRef} from 'react';
import {isEqual} from 'lodash';

// `dependencies` in hooks use `Object.is()` equality, which doesn't let us
// specify object dependencies, such as query variables.
// This hook is a fix for that and its return value should be passed instead of `dependencies`
export default (dependencies: any): any => {
	const ref = useRef<any>(dependencies);

	if (!isEqual(ref.current, dependencies)) {
		ref.current = dependencies;
	}

	return ref.current;
};
