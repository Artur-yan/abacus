import { useColorScheme } from '@mui/material/styles';
import * as React from 'react';
import { PropsWithChildren, useEffect } from 'react';

interface ModeSwitcherProps {}

export const ModeSwitcher = ({ children }: PropsWithChildren<ModeSwitcherProps>) => {
  const { setMode } = useColorScheme();

  useEffect(() => {
    setMode?.('dark');
  }, [setMode]);

  return <>{children}</>;
};
