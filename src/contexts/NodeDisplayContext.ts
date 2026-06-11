import { createContext, useContext } from 'react';

export const NodeDisplayContext = createContext<{ compact: boolean }>({ compact: false });

export function useNodeDisplay() {
  return useContext(NodeDisplayContext);
}
