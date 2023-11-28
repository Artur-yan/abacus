import * as React from 'react';
import { PropsWithChildren, useLayoutEffect, useState } from 'react';
import { Router } from 'react-router-dom';

interface ICustomRouterProps {
  basename?;
  history?;
}

const CustomRouter = React.memo((props: PropsWithChildren<ICustomRouterProps>) => {
  const [state, setState] = useState({
    action: props.history?.action,
    location: props.history?.location,
  });

  useLayoutEffect(() => props.history.listen(setState), [props.history]);

  return (
    <Router basename={props.basename} location={state.location} navigationType={state.action} navigator={props.history}>
      {props.children}
    </Router>
  );
});

export default CustomRouter;
