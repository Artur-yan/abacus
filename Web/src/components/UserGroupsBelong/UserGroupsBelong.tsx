import * as React from 'react';
import { PropsWithChildren, useMemo, useReducer } from 'react';
import { useSelector } from 'react-redux';
import { css } from 'styled-components';
import { calcAuthUserIsLoggedIn } from '../../stores/reducers/authUser';
import Link from '../Link/Link';
import PartsLink from '../NavLeft/PartsLink';
import { UserProfileSection } from '../UserProfile/UserProfile';
const s = require('./UserGroupsBelong.module.css');
const sd = require('../antdUseDark.module.css');

export interface IPermGroupOne {
  admin?: boolean;
  createdAt?: string;
  defaultGroup?: boolean;
  groupName?: string;
  organizationGroupId?: string;
  permissions?: string[];
}

interface IUserGroupsBelongProps {
  isAdmin?: boolean;
}

const UserGroupsBelong = React.memo((props: PropsWithChildren<IUserGroupsBelongProps>) => {
  const { paramsProp, authUser } = useSelector((state: any) => ({
    paramsProp: state.paramsProp,
    authUser: state.authUser,
  }));

  const [ignored, forceUpdate] = useReducer((x) => x + 1, 0);
  const [ignoredGroups, forceUpdateGroups] = useReducer((x) => x + 1, 0);

  const groups = useMemo(() => {
    let gg = calcAuthUserIsLoggedIn()?.orgGroups;
    gg = gg?.sort((a, b) => {
      return (a?.groupName?.toLowerCase() || '').localeCompare(b?.groupName?.toLowerCase() || '');
    });
    return gg;
  }, [authUser]);

  return (
    <div>
      <div
        css={css`
          color: #ffffff;
          line-height: 1.33;
          font-size: 24px;
          font-family: Matter, sans-serif;
          font-weight: 400;
          margin-bottom: 14px;
        `}
      >
        Groups
      </div>
      <div style={{ borderTop: '1px solid white', marginBottom: '17px' }}></div>
      {groups?.map((g1, g1ind) => {
        return (
          <div key={'g' + g1.organizationGroupId} css={``}>
            <span
              css={`
                font-size: 14px;
                color: white;
                margin: 6px 0;
              `}
            >
              {g1.groupName}
            </span>
          </div>
        );
      })}
      {groups != null && groups.length === 0 && (
        <div
          css={`
            opacity: 0.7;
            font-size: 14px;
            margin: 6px 0;
          `}
        >
          (None)
        </div>
      )}

      {calcAuthUserIsLoggedIn()?.isAdmin === true && !props.isAdmin && (
        <div
          css={`
            opacity: 0.7;
            font-size: 14px;
            margin: 14px 0 6px 0;
          `}
        >
          <Link to={'/' + PartsLink.profile + '/' + UserProfileSection.groups} usePointer showAsLink>
            Edit
          </Link>
        </div>
      )}
    </div>
  );
});

export default UserGroupsBelong;
