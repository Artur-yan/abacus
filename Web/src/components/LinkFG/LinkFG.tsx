import * as React from 'react';
import { PropsWithChildren, useEffect, useMemo, useReducer } from 'react';
import { useSelector } from 'react-redux';
import Utils from '../../../core/Utils';
import featureGroups from '../../stores/reducers/featureGroups';
import Link from '../Link/Link';
import PartsLink from '../NavLeft/PartsLink';
const s = require('./LinkFG.module.css');
const sd = require('../antdUseDark.module.css');

interface ILinkFGProps {
  featureGroup?: any;
  featureGroupId?: string;
  projectId?: string;
  showTablenameAsText?: boolean;
  forceSpanUse?: boolean;
}

const LinkFG = React.memo((props: PropsWithChildren<ILinkFGProps>) => {
  const { paramsProp, featureGroupsParam } = useSelector((state: any) => ({
    paramsProp: state.paramsProp,
    featureGroupsParam: state.featureGroups,
  }));

  const [ignored, forceUpdate] = useReducer((x) => x + 1, 0);

  useEffect(() => {
    if (props.featureGroupId) {
      featureGroups.memFeatureGroupsForId(true, null, props.featureGroupId);
    }
  }, [featureGroupsParam, props.featureGroupId]);
  const featureGroupOri = useMemo(() => {
    if (props.featureGroupId) {
      return featureGroups.memFeatureGroupsForId(false, null, props.featureGroupId);
    } else {
      return undefined;
    }
  }, [featureGroupsParam, props.featureGroupId]);

  const featureGroupOne = useMemo(() => {
    return props.featureGroup ?? featureGroupOri;
  }, [props.featureGroup, featureGroupOri]);

  const link1 = useMemo(() => {
    if (featureGroupOne == null) {
      return null;
    }

    let pid1 = '-';
    let ids = featureGroupOne?.projects?.map((p1) => p1.projectId);
    if (props.projectId != null && ids?.includes(props.projectId)) {
      pid1 = props.projectId;
    } else if (ids != null && ids.length === 1) {
      pid1 = ids[0];
    }
    return '/' + PartsLink.feature_group_detail + '/' + pid1 + '/' + featureGroupOne?.featureGroupId;
  }, [featureGroupOne, props.projectId]);

  if (Utils.isNullOrEmpty(link1)) {
    return <span>{props.children}</span>;
  } else {
    let content = props.children;
    if (props.showTablenameAsText) {
      if (featureGroupOne?.tableName != null) {
        content = featureGroupOne?.tableName;
      }
    }

    return (
      <Link to={link1} usePointer showAsLink forceSpanUse={props.forceSpanUse}>
        {content}
      </Link>
    );
  }
});

export default LinkFG;
