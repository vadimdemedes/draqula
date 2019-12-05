import {createContext} from 'react';
import Draqula from './Draqula';

interface DraqulaContextProps {
	readonly client?: Draqula;
}

export default createContext<DraqulaContextProps>({
	client: undefined
});
