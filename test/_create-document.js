import EventEmitter from 'events';

class Document extends EventEmitter {
	addEventListener(...args) {
		return this.addListener(...args);
	}

	removeEventListener(...args) {
		return this.removeListener(...args);
	}
}

export default () => new Document();
