import {DocumentNode, SelectionSetNode, SelectionNode, FieldNode, visit, Kind} from 'graphql';
import {cloneDeep} from 'lodash';

const hasTypename = (node: SelectionSetNode): boolean => {
	const typenameField = node.selections.find((selection: SelectionNode) => {
		return (selection as FieldNode).name.value === '__typename';
	});

	return Boolean(typenameField);
};

const addTypename = (node: SelectionSetNode): void => {
	(node.selections as any).push({
		kind: Kind.FIELD,
		name: {
			kind: Kind.NAME,
			value: '__typename'
		},
		arguments: [],
		directives: []
	});
};

export default (query: DocumentNode): DocumentNode => {
	const queryClone = cloneDeep(query);

	visit(queryClone, {
		SelectionSet(node: SelectionSetNode) {
			if (!hasTypename(node)) {
				addTypename(node);
			}
		}
	});

	return queryClone;
};
