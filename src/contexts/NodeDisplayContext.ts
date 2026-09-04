import { createContext, useContext } from 'react';

export const NodeDisplayContext = createContext<{ compact: boolean; darkMode: boolean; design2: boolean }>({ compact: false, darkMode: false, design2: false });

export function useNodeDisplay() {
  return useContext(NodeDisplayContext);
}
