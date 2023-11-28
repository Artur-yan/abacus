import Button from 'antd/lib/button';
import Radio from 'antd/lib/radio';
import * as React from 'react';
import { PropsWithChildren, useEffect, useMemo, useReducer, useState } from 'react';
import { useSelector } from 'react-redux';
import Location from '../../../core/Location';
import Utils from '../../../core/Utils';
import REActions from '../../actions/REActions';
import REClient_ from '../../api/REClient';
import { useProject } from '../../api/REUses';
import StoreActions from '../../stores/actions/StoreActions';
import algorithms from '../../stores/reducers/algorithms';
import PartsLink from '../NavLeft/PartsLink';
const s = require('./PretrainedModelsAdd.module.css');
const sd = require('../antdUseDark.module.css');

interface IPretrainedModelsAddProps {}

const PretrainedModelsAdd = React.memo((props: PropsWithChildren<IPretrainedModelsAddProps>) => {
  const { algorithmsParam, paramsProp, authUser } = useSelector((state: any) => ({
    paramsProp: state.paramsProp,
    authUser: state.authUser,
    algorithmsParam: state.algorithms,
  }));

  const [ignored, forceUpdate] = useReducer((x) => x + 1, 0);
  const [modelAlgorithm, setModelAlgorithm] = useState('');
  const [isDeployingModel, setIsDeployingModel] = useState(false);

  let projectId = paramsProp.get('projectId');
  if (projectId === '-') {
    projectId = null;
  }

  let project = useProject(projectId);
  const useCase1 = project?.useCase;

  useEffect(() => {
    algorithms.memPretrainedModelAlgorithms(true, useCase1);
  }, [algorithmsParam, useCase1]);
  let pretrainedAlgorithms = useMemo(() => {
    return algorithms.memPretrainedModelAlgorithms(false, useCase1);
  }, [algorithmsParam, useCase1]);

  const deployModel = (e) => {
    setIsDeployingModel(true);
    const cb = (err, res) => {
      setIsDeployingModel(false);
      if (err) {
        REActions.addNotificationError(err);
      } else {
        StoreActions.deployList_(projectId);
        StoreActions.deployTokensList_(projectId);
        StoreActions.deployList_(projectId);

        let deploymentId = res?.result?.deploymentId;
        Location.push('/' + PartsLink.model_predictions + '/' + (projectId ?? '-') + '/' + deploymentId);
      }
    };
    REClient_.client_()._deployPretrainedModel(projectId, modelAlgorithm, cb);
  };

  const canDeploy = useMemo(() => {
    return !Utils.isNullOrEmpty(modelAlgorithm);
  }, [modelAlgorithm]);

  return (
    <div style={{ marginLeft: '24px', textAlign: 'left' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div
          css={`
            margin-top: 30px;
          `}
          style={{ fontSize: '26px', textAlign: 'center', marginBottom: '38px' }}
        >
          <span>Choose A Foundation Model </span>
        </div>
        <div
          className="pretrained_models"
          css={`
            display: flex;
            justify-content: center;
          `}
        >
          <Radio.Group
            css={`
              display: flex;
              flex-direction: column;
              gap: 7px;
              margin-bottom: 2px;
            `}
            onChange={(e) => {
              setModelAlgorithm(e.target.value);
            }}
          >
            {pretrainedAlgorithms?.map((o1, o1ind) => {
              return (
                <div key={o1.algorithmId}>
                  {' '}
                  <Radio value={o1.algorithmId}>
                    {' '}
                    <span
                      css={`
                        color: white;
                      `}
                    >
                      {o1.name}
                    </span>
                  </Radio>
                </div>
              );
            })}
          </Radio.Group>
        </div>
        <div style={{ paddingTop: '40px', textAlign: 'center', margin: '0 auto' }}>
          <Button disabled={!canDeploy || isDeployingModel} onClick={deployModel} type={'primary'} style={{ width: '126px' }}>
            Deploy Model
          </Button>
        </div>
      </div>
    </div>
  );
});

export default PretrainedModelsAdd;
