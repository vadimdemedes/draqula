import {createContext} from 'react';
import Draqula from './Draqula';

interface DraqulaContextProps {
	readonly client: Draqula | null;
}

export default createContext<DraqulaContextProps>({
	client: null
});
