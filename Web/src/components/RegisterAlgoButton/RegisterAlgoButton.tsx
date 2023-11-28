import Button from 'antd/lib/button';
import * as React from 'react';
import { CSSProperties, PropsWithChildren, useMemo, useReducer } from 'react';
import { useListAvailableProblemTypesForAlgorithms, useProblemTypesInfo, useProject, useUseCaseFromProjectOne } from '../../api/REUses';
import Constants from '../../constants/Constants';
import Link from '../Link/Link';
import ModalConfirm from '../ModalConfirm/ModalConfirm';
import PartsLink from '../NavLeft/PartsLink';
const s = require('./RegisterAlgoButton.module.css');
const sd = require('../antdUseDark.module.css');

interface IRegisterAlgoButtonProps {
  projectId?: string;
  suffix?: any;
  style?: CSSProperties;
}

const RegisterAlgoButton = React.memo((props: PropsWithChildren<IRegisterAlgoButtonProps>) => {
  // const { paramsProp, authUser, } = useSelector((state: any) => ({
  //   paramsProp: state.paramsProp,
  //   authUser: state.authUser,
  // }));

  const [ignored, forceUpdate] = useReducer((x) => x + 1, 0);

  const listAlgoForProblemTypes = useListAvailableProblemTypesForAlgorithms();

  const problemTypesList = useProblemTypesInfo();

  const projectOne = useProject(props.projectId);
  const useCaseInfo = useUseCaseFromProjectOne(projectOne, true);

  const isShowWarning = useMemo(() => {
    if (props.projectId) {
      let pt1 = problemTypesList?.find((p1) => p1.problemType?.toUpperCase() === useCaseInfo?.ori?.problemType?.toUpperCase());
      if (pt1 != null) {
        if (!pt1?.useCasesSupportCustomAlgorithm?.some((s1) => s1?.toUpperCase() === projectOne?.useCase?.toUpperCase())) {
          // if (projectOne?.useCase?.toUpperCase() !== pt1?.defaultUseCaseSupportsCustomAlgorithm?.name?.toUpperCase()) {
          return pt1?.defaultUseCaseSupportsCustomAlgorithm?.webName;
        }
      }
    }
    return null;
  }, [projectOne, useCaseInfo, problemTypesList]);

  if (Constants.flags.algos && (listAlgoForProblemTypes?.includes(useCaseInfo?.ori?.problemType) || props.projectId == null)) {
    let button1 = (
      <Button type={'primary'} style={props.style}>
        {'Register Algorithm'}
        {props.suffix}
      </Button>
    );

    if (isShowWarning != null) {
      return (
        <ModalConfirm okText={'Ok'} okType={'primary'} cancelText={null} title={`You can register an algorithm by creating a ${isShowWarning} use-case project. Navigate to the Models tab and Register your algorithm there`}>
          {button1}
        </ModalConfirm>
      );
    } else {
      return <Link to={['/' + PartsLink.algorithm_one + '/' + (props.projectId ?? '-'), 'isAdd=1']}>{button1}</Link>;
    }
  } else {
    return null;
  }
});

export default RegisterAlgoButton;
