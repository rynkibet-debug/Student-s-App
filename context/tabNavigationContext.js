import React, { createContext, useContext } from 'react';

export const TabNavigationContext = createContext(null);

export function useTabNavigation() {
  return useContext(TabNavigationContext);
}