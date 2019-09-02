import React from 'react';
import {DraqulaContext} from '..';

export default client => ({children}) => <DraqulaContext.Provider value={{client}}>{children}</DraqulaContext.Provider>;
