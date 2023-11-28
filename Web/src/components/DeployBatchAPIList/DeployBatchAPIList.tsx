import Button from 'antd/lib/button';
import * as React from 'react';
import { CSSProperties, PropsWithChildren, useEffect, useMemo, useReducer, useState } from 'react';
import { useSelector } from 'react-redux';
import Location from '../../../core/Location';
import Utils from '../../../core/Utils';
import BatchList from '../BatchList/BatchList';
import { DeployBatchAPI_calcListDeploy } from '../DeployBatchAPI/DeployBatchAPI';
import HelpIcon from '../HelpIcon/HelpIcon';
import PartsLink from '../NavLeft/PartsLink';
import { topAfterHeaderHH } from '../ProjectsList/ProjectsList';
import RefreshAndProgress from '../RefreshAndProgress/RefreshAndProgress';
import SelectExt from '../SelectExt/SelectExt';
const s = require('./DeployBatchAPIList.module.css');
const sd = require('../antdUseDark.module.css');

interface IDeployBatchAPIListProps {}

const DeployBatchAPIList = React.memo((props: PropsWithChildren<IDeployBatchAPIListProps>) => {
  const { paramsProp, deployments } = useSelector((state: any) => ({
    paramsProp: state.paramsProp,
    deployments: state.deployments,
  }));
  const [ignored, forceUpdate] = useReducer((x) => x + 1, 0);
  const [isProcessing, setIsProcessing] = useState(false);

  let projectId = paramsProp?.get('projectId');
  let deployId = paramsProp?.get('deployId');

  const styleLabel: CSSProperties = { display: 'inline-block', width: '120px', fontFamily: 'Matter', fontSize: '16px', fontWeight: 500, color: '#8798ad' };
  const styleLineDesc: CSSProperties = { margin: '5px 0' };

  const onClickCreate = (e) => {
    Location.push('/' + PartsLink.deploy_batch + '/' + projectId + (deployId ? '/' + deployId : ''));
  };

  useEffect(() => {
    DeployBatchAPI_calcListDeploy(deployments, deployId, projectId, true);
  }, [deployments, deployId, projectId]);

  let listDeploymentsActive = useMemo(() => {
    return DeployBatchAPI_calcListDeploy(deployments, deployId, projectId, false);
  }, [deployments, deployId, projectId]);
  let listDeploymentsAll = useMemo(() => {
    return DeployBatchAPI_calcListDeploy(deployments, deployId, projectId, false, true);
  }, [deployments, deployId, projectId]);

  let listDeployments = listDeploymentsAll;

  // let deployIdRandomOne = useMemo(() => {
  //   if(listDeploymentsActive && listDeploymentsActive.length>0 && listDeploymentsActive[listDeploymentsActive.length-1]) {
  //     return listDeploymentsActive[listDeploymentsActive.length-1].deploymentId ?? null;
  //   }
  //   if(listDeploymentsAll && listDeploymentsAll.length>0 && listDeploymentsAll[listDeploymentsAll.length-1]) {
  //     return listDeploymentsAll[listDeploymentsAll.length-1].deploymentId ?? null;
  //   }
  //   return null;
  // }, [listDeploymentsActive, listDeploymentsAll]);

  // if(Utils.isNullOrEmpty(deployId) && !Utils.isNullOrEmpty(deployIdRandomOne)) {
  //   deployId = deployIdRandomOne;
  // }

  let optionsDeploys = useMemo(() => {
    let res = listDeployments?.map((d1) => {
      return {
        label: d1.name || '-',
        value: d1.deploymentId,
      };
    });

    res ??= [];
    res.unshift({ label: 'All', value: null });

    return res;
  }, [listDeployments]);
  let optionsDeploysSel = optionsDeploys?.find((d1) => d1.value == deployId);

  const onChangeSelectDeployment = (optionSel) => {
    let projectId = paramsProp?.get('projectId');
    let deployId = optionSel?.value;
    Location.push('/' + PartsLink.deploy_batch + '/' + (projectId ?? '-') + (deployId == null ? '' : '/' + deployId), undefined, 'showList=true');
  };

  let popupContainerForMenu = (node) => document.getElementById('body2');

  let deploymentSelect = (
    <span style={{ width: '320px', display: 'inline-block', fontSize: '14px', marginLeft: '10px' }}>
      <SelectExt value={optionsDeploysSel} options={optionsDeploys ?? []} onChange={onChangeSelectDeployment} menuPortalTarget={popupContainerForMenu(null)} />
    </span>
  );

  return (
    <div className={sd.table} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, margin: '25px' }}>
      <RefreshAndProgress msgMsg={isProcessing ? 'Processing...' : null} isMsgAnimRefresh>
        <div
          className={sd.titleTopHeaderAfter}
          style={{ height: topAfterHeaderHH }}
          css={`
            display: flex;
            align-items: center;
          `}
        >
          <span>Batch Predictions for Deployment</span>
          <HelpIcon id={'batchlist_deployment_name'} style={{ marginLeft: '4px' }} />

          <div
            css={`
              margin-left: 10px;
            `}
          >
            {deploymentSelect}
          </div>

          <div
            css={`
              flex: 1;
            `}
          ></div>
          {!Utils.isNullOrEmpty(projectId) && (
            <span>
              <Button style={{}} type={'primary'} onClick={onClickCreate}>
                Create New Batch Prediction
              </Button>
            </span>
          )}
        </div>

        <div style={{ position: 'absolute', top: topAfterHeaderHH + 'px', left: 0, right: 0, bottom: 0 }}>
          <BatchList useDeployIdIfEmpty={deployId} />
        </div>
      </RefreshAndProgress>
    </div>
  );
});

export default DeployBatchAPIList;
