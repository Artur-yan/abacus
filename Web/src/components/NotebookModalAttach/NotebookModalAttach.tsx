import QuestionCircleOutlined from '@ant-design/icons/QuestionCircleOutlined';
import * as React from 'react';
import { PropsWithChildren, useMemo, useReducer, useRef } from 'react';
import { useSelector } from 'react-redux';
import REActions from '../../actions/REActions';
import REClient_ from '../../api/REClient';
import { useProjectsAll } from '../../api/REUses';
import Constants from '../../constants/Constants';
import ModalConfirm from '../ModalConfirm/ModalConfirm';
import SelectExt from '../SelectExt/SelectExt';
const s = require('./NotebookModalAttach.module.css');
const sd = require('../antdUseDark.module.css');

interface INotebookModalAttachProps {
  notebookId?: string;
  excludeProjectId?: string;
  forMenu?: boolean;
  isDetach?: boolean;
  detachFromProjectId?: string;

  onAttach?: (projectId?: string) => void;
  onDetach?: (projectId?: string) => void;
}

const NotebookModalAttach = React.memo((props: PropsWithChildren<INotebookModalAttachProps>) => {
  const { paramsProp, authUser } = useSelector((state: any) => ({
    paramsProp: state.paramsProp,
    authUser: state.authUser,
  }));

  const [ignored, forceUpdate] = useReducer((x) => x + 1, 0);

  const onClickAttachToProject = (e) => {
    return new Promise<boolean>((resolve) => {
      if (!props.isDetach) {
        REClient_.client_()._attachNotebookToProject(props.notebookId, selValue.current, (err, res) => {
          if (err || !res?.success) {
            REActions.addNotificationError(err || Constants.errorDefault);
            resolve(false);
          } else {
            props.onAttach?.(selValue.current);
            resolve(true);
          }
        });
      } else {
        REClient_.client_()._removeNotebookFromProject(props.notebookId, props.detachFromProjectId, (err, res) => {
          if (err || !res?.success) {
            REActions.addNotificationError(err || Constants.errorDefault);
            resolve(false);
          } else {
            props.onDetach?.(selValue.current);
            resolve(true);
          }
        });
      }
    });
  };

  const projectsList = useProjectsAll();

  const optionsProjects = useMemo(() => {
    let list = projectsList;
    if (props.excludeProjectId) {
      list = list?.filter((p1) => p1?.projectId !== props.excludeProjectId);
    }
    return list
      ?.map((p1) => ({ label: `${p1.name} - ${p1.projectId}`, value: p1.projectId }))
      ?.sort((a, b) => {
        return (a?.label || '').toLowerCase().localeCompare((b?.label || '').toLowerCase());
      });
  }, [projectsList, props.excludeProjectId]);

  const selValue = useRef(null);
  const onChangeSel = (option1) => {
    selValue.current = option1?.value;
  };

  const conentAttachToProject = useMemo(() => {
    if (props.isDetach) {
      return 'Do you want to detach this notebook?';
    }

    return (
      <div css={``}>
        <div
          css={`
            font-size: 15px;
          `}
        >
          Attach to Project:
        </div>
        <div
          css={`
            margin-top: 15px;
          `}
        >
          <SelectExt options={optionsProjects} onChange={onChangeSel} />
        </div>
      </div>
    );
  }, [optionsProjects, props.isDetach]);

  return (
    <ModalConfirm
      width={props.isDetach ? undefined : 700}
      onConfirmPromise={onClickAttachToProject}
      title={conentAttachToProject}
      icon={<QuestionCircleOutlined style={{ color: 'darkgreen' }} />}
      okText={props.isDetach ? 'Remove' : 'Attach'}
      cancelText={'Cancel'}
      okType={'primary'}
    >
      <div style={props.forMenu ? { margin: '-6px -12px', padding: '6px 12px' } : {}}>{props.isDetach ? 'Detach from Project...' : 'Attach To Project...'}</div>
    </ModalConfirm>
  );
});

export default NotebookModalAttach;
