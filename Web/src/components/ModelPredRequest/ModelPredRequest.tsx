import * as React from 'react';
import { PropsWithChildren, useEffect, useReducer, useState } from 'react';
import { useSelector } from 'react-redux';
import REClient_ from '../../api/REClient';
const s = require('./ModelPredRequest.module.css');
const sd = require('../antdUseDark.module.css');

interface IModelPredRequestProps {}

const ModelPredRequest = React.memo((props: PropsWithChildren<IModelPredRequestProps>) => {
  const { paramsProp, authUser } = useSelector((state: any) => ({
    paramsProp: state.paramsProp,
    authUser: state.authUser,
  }));

  const [ignored, forceUpdate] = useReducer((x) => x + 1, 0);
  const [requestOne, setRequestOne] = useState(null);

  const deployId = paramsProp?.get('deployId');
  const requestId = paramsProp?.get('requestId');

  useEffect(() => {
    if (!deployId || !requestId) {
      return;
    }

    setRequestOne(null);
    REClient_.client_()._getPredictionRequestLogs(deployId, requestId, (err, res) => {
      if (!err && res?.success) {
        setRequestOne(res?.result);
      }
    });
  }, [requestId, deployId]);

  return (
    <div
      css={`
        margin: 30px;
      `}
    >
      {requestId}
    </div>
  );
});

export default ModelPredRequest;
