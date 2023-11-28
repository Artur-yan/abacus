import * as React from 'react';
import { useFeatureGroup } from '../../api/REUses';
const s = require('./FeatureGroupConsume.module.css');
const sd = require('../antdUseDark.module.css');

interface IFeatureGroupConsumeProps {
  projectId?: string;
  featuregroupId?: string;
  children?: (featureGroupOne?: any) => any;
}

const FeatureGroupConsume = React.memo((props: IFeatureGroupConsumeProps) => {
  // const { paramsProp, authUser, } = useSelector((state: any) => ({
  //   paramsProp: state.paramsProp,
  //   authUser: state.authUser,
  // }));

  // const [ignored, forceUpdate] = useReducer(x => x + 1, 0);

  const featureGroupOne = useFeatureGroup(props.projectId, props.featuregroupId);

  return props.children?.(featureGroupOne);
});

export default FeatureGroupConsume;
