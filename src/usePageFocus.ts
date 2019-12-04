import {useEffect} from 'react';

interface Options {
	readonly isEnabled: boolean;
}

export default (callback: () => void, options: Options): void => {
	useEffect(() => {
		if (typeof document === 'undefined' || !options.isEnabled) {
			return;
		}

		const handleVisibilityChange = (): void => {
			if (!document.hidden) {
				callback();
			}
		};

		document.addEventListener('visibilitychange', handleVisibilityChange);

		return () => {
			document.removeEventListener('visibilitychange', handleVisibilityChange);
		};
	}, [options.isEnabled, callback]);
};
