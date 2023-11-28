import * as Sentry from '@sentry/react';
import * as React from 'react';
import { PropsWithChildren, useEffect, useReducer, useState } from 'react';
import Constants from '../../constants/Constants';
import RefreshAndProgress from '../RefreshAndProgress/RefreshAndProgress';
const s = require('./CompBoundError.module.css');
const sd = require('../antdUseDark.module.css');

interface ICompBoundErrorProps {}

const CompBoundError = React.memo((props: PropsWithChildren<ICompBoundErrorProps>) => {
  // const { paramsProp, authUser, } = useSelector((state: any) => ({
  //   paramsProp: state.paramsProp,
  //   authUser: state.authUser,
  // }));

  const [ignored, forceUpdate] = useReducer((x) => x + 1, 0);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    setIsError((ise) => {
      if (ise) {
        ise = false;
        forceUpdate();
      }
      return ise;
    });
  }, [props.children]);

  const onError = () => {
    setIsError(true);
  };

  return (
    // @ts-ignore
    <Sentry.ErrorBoundary key={'a' + ignored} fallback={<RefreshAndProgress errorMsg={`${Constants.errorDefault} (UI)`}></RefreshAndProgress>} onError={onError}>
      {props.children}
    </Sentry.ErrorBoundary>
  );
});

export default CompBoundError;
