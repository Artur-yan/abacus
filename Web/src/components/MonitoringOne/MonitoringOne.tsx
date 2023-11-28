import * as React from 'react';
import { PropsWithChildren, useReducer } from 'react';
import DeploymentsList from '../DeploymentsList/DeploymentsList';
const s = require('./MonitoringOne.module.css');
const sd = require('../antdUseDark.module.css');

interface IMonitoringOneProps {}

const MonitoringOne = React.memo((props: PropsWithChildren<IMonitoringOneProps>) => {
  // const { paramsProp, authUser, } = useSelector((state: any) => ({
  //   paramsProp: state.paramsProp,
  //   authUser: state.authUser,
  // }));
  const [ignored, forceUpdate] = useReducer((x) => x + 1, 0);

  return (
    <div>
      <DeploymentsList isSmall isDrift />
    </div>
  );
});

export default MonitoringOne;
