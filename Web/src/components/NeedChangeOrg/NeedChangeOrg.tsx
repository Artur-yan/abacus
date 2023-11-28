import * as React from 'react';
import { PropsWithChildren, useEffect, useReducer, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import Utils from '../../../core/Utils';
import REActions from '../../actions/REActions';
import REClient_ from '../../api/REClient';
import StoreActions from '../../stores/actions/StoreActions';
import { calcAuthUserIsLoggedIn } from '../../stores/reducers/authUser';
import RefreshAndProgress from '../RefreshAndProgress/RefreshAndProgress';
const s = require('./NeedChangeOrg.module.css');
const sd = require('../antdUseDark.module.css');

interface INeedChangeOrgProps {
  dontRefresh?: boolean;
}

const NeedChangeOrg = React.memo((props: PropsWithChildren<INeedChangeOrgProps>) => {
  const { paramsProp } = useSelector((state: any) => ({
    paramsProp: state.paramsProp,
    authUserParam: state.authUser,
  }));
  const [ignored, forceUpdate] = useReducer((x) => x + 1, 0);
  const [orgIdHint, setOrgIdHint] = useState(null);
  const [orgNameHint, setOrgNameHint] = useState(null);

  const authUser1 = calcAuthUserIsLoggedIn();

  const cacheProjectsNotInOrg = useRef({});
  const projectId = paramsProp?.get('projectId');

  const showOrgHint = (orgId, orgName) => {
    if (Utils.isNullOrEmpty(orgId) || Utils.isNullOrEmpty(orgName)) {
      setOrgIdHint(null);
      setOrgNameHint(null);
    } else {
      if (authUser1?.orgId === orgId) {
        //already in that org
        return;
      }

      if (!Utils.isNullOrEmpty(projectId)) {
        cacheProjectsNotInOrg.current[projectId] = { orgId, orgName };
      }

      setOrgIdHint(orgId);
      setOrgNameHint(orgName);
    }
  };

  const showOrgHintClear = () => {
    cacheProjectsNotInOrg.current = {};
  };

  useEffect(() => {
    let unHint = REActions.showOrgHint.listen(showOrgHint);
    let unClear = REActions.showOrgHintClear.listen(showOrgHintClear);

    return () => {
      unHint();
      unClear();
    };
  }, []);

  useEffect(() => {
    if (!Utils.isNullOrEmpty(projectId)) {
      const cache1: { orgId; orgName } = cacheProjectsNotInOrg.current[projectId];
      if (cache1 != null && cache1.orgId && cache1.orgName) {
        if (orgIdHint !== cache1.orgId || orgNameHint !== cache1.orgName) {
          setOrgIdHint(cache1.orgId);
          setOrgNameHint(cache1.orgName);
        }
        return;
      }
    }

    if (orgIdHint != null || orgNameHint != null) {
      setOrgIdHint(null);
      setOrgNameHint(null);
    }
  }, [projectId, window.location.pathname]);

  useEffect(() => {
    if (authUser1?.orgId != null && orgIdHint && authUser1?.orgId === orgIdHint) {
      showOrgHintClear();

      setOrgIdHint(null);
      setOrgNameHint(null);
    }
  }, [authUser1?.orgId]);

  const onClickError = (e) => {
    REClient_.client_()._selectActiveOrganization(orgIdHint, (err, res) => {
      if (err) {
        REActions.addNotificationError(err);
      } else {
        // StoreActions.refreshAll_();
        // REActions.showOrgHintClear();

        if (props.dontRefresh) {
          setTimeout(() => {
            REActions.showOrgHintClear();
            StoreActions.refreshAll_();

            setTimeout(() => {
              REActions.onChangeOrgHappened();
              REActions.fullRefreshHappened();
            }, 30);
          }, 30);
        } else {
          window.location.reload();
        }
      }
    });
  };

  if (!Utils.isNullOrEmpty(orgIdHint)) {
    return <RefreshAndProgress onClickErrorButton={onClickError} errorMsg={'This resource is from another Organization'} errorButtonText={'Switch to Organization: ' + (orgNameHint || '')}></RefreshAndProgress>;
  }

  return <div>{props.children}</div>;
});

export default NeedChangeOrg;
