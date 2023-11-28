// import {hot} from "react-hot-loader/root";
import { Experimental_CssVarsProvider as CssVarsProvider } from '@mui/material/styles';
import { ConfigProvider } from 'antd';
import * as React from 'react';
import history from '../core/history';
import AppRoutes from './AppRoutes';
import CustomRouter from './components/CustomRouter/CustomRouter';
import { ModeSwitcher } from './ModeSwitcher';
import { muiTheme } from './theme/muiTheme';

export const AppMain = () => {
  return (
    <CssVarsProvider theme={muiTheme}>
      <ModeSwitcher>
        <CustomRouter history={history}>
          <AppRoutes />
        </CustomRouter>
      </ModeSwitcher>
    </CssVarsProvider>
  );
};
