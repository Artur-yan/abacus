import * as React from 'react';
import { PropsWithChildren, useReducer } from 'react';
import { useSelector } from 'react-redux';
import Link from '../Link/Link';
import PartsLink from '../NavLeft/PartsLink';
const s = require('./ShareModelFinish.module.css');
const sd = require('../antdUseDark.module.css');

interface IShareModelFinishProps {}

const ShareModelFinish = React.memo((props: PropsWithChildren<IShareModelFinishProps>) => {
  const { paramsProp } = useSelector((state: any) => ({
    paramsProp: state.paramsProp,
  }));
  const [ignored, forceUpdate] = useReducer((x) => x + 1, 0);

  const projectId = paramsProp?.get('projectId');
  const modelId = paramsProp?.get('modelId');

  return (
    <div style={{ marginTop: '40px', textAlign: 'center' }}>
      <div style={{ display: 'inline-block', fontSize: '14px', padding: '20px' }} className={sd.grayPanel}>
        <p>Your model has been shared with the community</p>
        <p>
          Check out the{' '}
          <Link noApp newWindow to={'/models/model_detail/' + modelId} style={{ cursor: 'pointer' }} className={sd.linkBlueAlways}>
            public page
          </Link>{' '}
          for your model.
        </p>
        <p>
          Go back to{' '}
          <Link to={'/' + PartsLink.model_detail + '/' + modelId + '/' + projectId} style={{ cursor: 'pointer' }} className={sd.linkBlueAlways}>
            Model Details
          </Link>
        </p>
      </div>
    </div>
  );
});

export default ShareModelFinish;
