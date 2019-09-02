import {cloneDeep, mergeWith} from 'lodash';

export default <T>(prevData: T, nextData: T): T => {
	return cloneDeep(
		mergeWith(prevData, nextData, (objValue, srcValue) => {
			if (!Array.isArray(objValue)) {
				return;
			}

			return objValue.concat(srcValue);
		})
	);
};
