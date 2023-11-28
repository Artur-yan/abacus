import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Button from 'antd/lib/button';
import Input from 'antd/lib/input';
import * as React from 'react';
import { CSSProperties } from 'react';
import { connect } from 'react-redux';
import SplitPane from 'react-split-pane';
import Location from '../../../core/Location';
import Utils from '../../../core/Utils';
import REActions from '../../actions/REActions';
import REClient_ from '../../api/REClient';
import Constants from '../../constants/Constants';
import memoizeOne from '../../libs/memoizeOne';
import { calcAuthUserIsLoggedIn } from '../../stores/reducers/authUser';
import ModalConfirm from '../ModalConfirm/ModalConfirm';
import SelectExt from '../SelectExt/SelectExt';
import TableExt, { ITableExtColumn } from '../TableExt/TableExt';
import TooltipExt from '../TooltipExt/TooltipExt';
import { IPermGroupOne } from '../UserGroupsBelong/UserGroupsBelong';
import { UserProfileSection } from '../UserProfile/UserProfile';
const s = require('./ProfileGroups.module.css');
const sd = require('../antdUseDark.module.css');

interface IProfileGroupsProps {
  paramsProp?: any;
  authUser?: any;
  height?: number;
}

interface IProfileGroupsState {
  isRefreshing?: boolean;
  userList?: any[];
  fgList?: any[];
  fgListAll?: any[];
  groupsList?: IPermGroupOne[];
  groupsListSelId?: string;
  selType?: GroupsType;
}

enum GroupsType {
  Permissions = 'Permissions',
  Users = 'Users',
  FeatureGroups = 'FeatureGroups',
}

const styleButton: CSSProperties = { marginRight: '8px', marginBottom: '8px' };

class ProfileGroups extends React.PureComponent<IProfileGroupsProps, IProfileGroupsState> {
  groupName: string;
  groupPerm: any;
  groupUserId: any;
  groupFGId: any;

  constructor(props) {
    super(props);

    this.state = {
      isRefreshing: false,
      userList: null,
      groupsListSelId: this.props.paramsProp?.get('selGroup') ?? null,
      selType: this.props.paramsProp?.get('selType') ?? GroupsType.Users,
    };
  }

  refreshAllData = () => {
    REClient_.client_().listOrganizationUsers((err, res) => {
      if (!err && res?.result) {
        this.setState({
          userList: res?.result,
        });
      }
    });

    REClient_.client_().listOrganizationGroups((err, res) => {
      if (!err && res?.result) {
        let gg: IPermGroupOne[] = res?.result;
        gg = gg?.sort((a, b) => {
          return (a?.groupName?.toLowerCase() || '').localeCompare(b?.groupName?.toLowerCase() || '');
        });

        let id1 = gg?.[0]?.organizationGroupId;
        if (this.state.groupsListSelId != null && gg?.find((g1) => g1?.organizationGroupId === this.state.groupsListSelId) != null) {
          id1 = this.state.groupsListSelId;
        }

        this.setState(
          {
            groupsList: gg,
            groupsListSelId: id1,
          },
          () => {
            this.refreshFGs(id1);
          },
        );
      }
    });
  };

  refreshFGs = (groupId = null) => {
    if (groupId == null) {
      groupId = this.state.groupsListSelId;
    }

    this.setState({
      fgList: null,
    });
    if (Utils.isNullOrEmpty(groupId)) {
      return;
    }

    REClient_.client_()._listOrganizationGroupFeatureGroupModifiers(groupId, (err, res) => {
      if (!err && res?.success) {
        this.setState({
          fgList: res?.result ?? null,
        });
      }
    });
  };

  memAdmin = memoizeOne((isAdmin) => {
    if (isAdmin != null && isAdmin !== true) {
      this.setState({
        selType: GroupsType.FeatureGroups,
      });
    }
  });

  componentDidUpdate(prevProps: Readonly<IProfileGroupsProps>, prevState: Readonly<IProfileGroupsState>, snapshot?: any) {
    this.memAdmin(calcAuthUserIsLoggedIn()?.isAdmin);
  }

  componentDidMount() {
    this.memAdmin(calcAuthUserIsLoggedIn()?.isAdmin);

    this.refreshAllData();
    this.refreshFGs(this.state.groupsListSelId);

    REClient_.client_().listFeatureGroups(1000, null, null, null, (err, res) => {
      if (err || !res?.success || !res?.result) {
        //
      } else {
        this.setState({
          fgListAll: res?.result,
        });
      }
    });
  }

  componentWillUnmount() {}

  onClickRowGroups = (row, key, e) => {
    let id1 = row?.organizationGroupId;
    this.setState(
      {
        groupsListSelId: id1,
      },
      () => {
        this.refreshFGs(id1);
      },
    );

    Location.push('/' + this.props.paramsProp?.get('mode') + '/' + UserProfileSection.groups, undefined, Utils.processParamsAsQuery({ selGroup: id1 }, window.location.search));
  };

  calcIsSelectedGroups = (index) => {
    return this.state.groupsList?.[index]?.organizationGroupId === this.state.groupsListSelId;
  };

  onClickRowType = (row, key, e) => {
    let type1 = row?.value;
    let v1 = type1 ?? GroupsType.Users;
    this.setState({
      selType: v1,
    });
    Location.push('/' + this.props.paramsProp?.get('mode') + '/' + UserProfileSection.groups, undefined, Utils.processParamsAsQuery({ selType: v1 }, window.location.search));
  };

  calcIsSelectedType = (index) => {
    let typeList = this.memOptionsType(this.state.selType, calcAuthUserIsLoggedIn()?.isAdmin === true);
    return this.state.selType === typeList?.[index]?.value;
  };

  memGroupSel = memoizeOne((groupsListSelId, groupsList) => {
    return groupsListSelId == null ? null : groupsList?.find((g1) => g1?.organizationGroupId === groupsListSelId);
  });

  memPermsList = memoizeOne((groupSel) => {
    return groupSel?.permissions?.map((s1) => ({ name: s1, id: s1, admin: groupSel?.admin })) ?? [];
  });

  memOptionsType = memoizeOne((selType, isAdmin) => {
    if (!isAdmin) {
      return [
        {
          label: 'Feature Groups',
          value: GroupsType.FeatureGroups,
        },
      ];
    } else {
      return [
        {
          label: GroupsType.Users,
          value: GroupsType.Users,
        },
        {
          label: GroupsType.Permissions,
          value: GroupsType.Permissions,
        },
        {
          label: 'Feature Groups',
          value: GroupsType.FeatureGroups,
        },
      ];
    }
  });

  memOptionsUsers = memoizeOne((userList) => {
    return (
      userList?.map((u1) => {
        return { label: u1?.email ?? '-', value: u1?.userId };
      }) ?? []
    );
  });

  memOptionsPerms = memoizeOne((permissions, permissionsListAlready) => {
    if (permissions != null && permissions.length > 0) {
      let pp = [...permissions];
      permissionsListAlready?.some((s1) => {
        pp = pp.filter((s2) => s2 !== s1?.id);
      });
      return pp.sort().map((p1) => ({ label: p1, value: p1 }));
    }
    return [];
  });

  memUsersList = memoizeOne((userList, groupSel) => {
    if (!groupSel) {
      return null;
    }
    let uu = userList?.filter((u1) => u1?.organizationGroups?.find((o1) => o1.organizationGroupId === groupSel?.organizationGroupId) != null);
    uu = uu?.sort((a, b) => {
      return (a?.email?.toLowerCase() || '').localeCompare(b?.email?.toLowerCase() || '');
    });
    return uu;
  });

  onConfirmAddFG = (organizationGroupId) => {
    return new Promise<boolean>((resolve) => {
      REClient_.client_().addOrganizationGroupToFeatureGroupModifiers(this.groupFGId, organizationGroupId, (err, res) => {
        if (err || !res?.success) {
          REActions.addNotificationError(err || Constants.errorDefault);
          resolve(false);
        } else {
          this.refreshAllData();
          this.refreshFGs();
          resolve(true);
        }
      });
    });
  };

  onConfirmAddUser = (organizationGroupId) => {
    return new Promise<boolean>((resolve) => {
      let email1 = this.state.userList?.find((u1) => u1?.userId === this.groupUserId)?.email;

      REClient_.client_().addUserToOrganizationGroup(organizationGroupId, email1, (err, res) => {
        if (err || !res?.success) {
          REActions.addNotificationError(err || Constants.errorDefault);
          resolve(false);
        } else {
          this.refreshAllData();
          resolve(true);
        }
      });
    });
  };

  onConfirmDeleteUser = (organizationGroupId, userId) => {
    return new Promise<boolean>((resolve) => {
      let email1 = this.state.userList?.find((u1) => u1?.userId === userId)?.email;

      REClient_.client_().removeUserFromOrganizationGroup(organizationGroupId, email1, (err, res) => {
        if (err || !res?.success) {
          REActions.addNotificationError(err || Constants.errorDefault);
          resolve(false);
        } else {
          this.refreshAllData();
          resolve(true);
        }
      });
    });
  };

  onConfirmAddPerm = (organizationGroupId) => {
    return new Promise<boolean>((resolve) => {
      REClient_.client_().addOrganizationGroupPermission(organizationGroupId, this.groupPerm, (err, res) => {
        if (err || !res?.success) {
          REActions.addNotificationError(err || Constants.errorDefault);
          resolve(false);
        } else {
          this.refreshAllData();
          resolve(true);
        }
      });
    });
  };

  onConfirmDeletePerm = (organizationGroupId, perm1) => {
    return new Promise<boolean>((resolve) => {
      REClient_.client_().removeOrganizationGroupPermission(organizationGroupId, perm1, (err, res) => {
        if (err || !res?.success) {
          REActions.addNotificationError(err || Constants.errorDefault);
          resolve(false);
        } else {
          this.refreshAllData();
          resolve(true);
        }
      });
    });
  };

  onConfirmAddGroup = () => {
    return new Promise<boolean>((resolve) => {
      REClient_.client_().createOrganizationGroup(this.groupName, ['VIEW'], null, (err, res) => {
        if (err || !res?.success) {
          REActions.addNotificationError(err || Constants.errorDefault);
          resolve(false);
        } else {
          this.refreshAllData();
          resolve(true);
        }
      });
    });
  };

  onConfirmSetDefaultGroup = (groupId) => {
    return new Promise<boolean>((resolve) => {
      REClient_.client_().setDefaultOrganizationGroup(groupId, (err, res) => {
        if (err || !res?.success) {
          REActions.addNotificationError(err || Constants.errorDefault);
          resolve(false);
        } else {
          this.refreshAllData();
          resolve(true);
        }
      });
    });
  };

  onConfirmDeleteFG = (groupId, featureGroupId) => {
    return new Promise<boolean>((resolve) => {
      REClient_.client_().removeOrganizationGroupFromFeatureGroupModifiers(featureGroupId, groupId, (err, res) => {
        if (err || !res?.success) {
          REActions.addNotificationError(err || Constants.errorDefault);
          resolve(false);
        } else {
          this.refreshAllData();
          this.refreshFGs();
          resolve(true);
        }
      });
    });
  };

  onConfirmDeleteGroup = (groupId) => {
    return new Promise<boolean>((resolve) => {
      REClient_.client_().deleteOrganizationGroup(groupId, (err, res) => {
        if (err || !res?.success) {
          REActions.addNotificationError(err || Constants.errorDefault);
          resolve(false);
        } else {
          this.refreshAllData();
          resolve(true);
        }
      });
    });
  };

  memFGList = memoizeOne((fgList, groupSel) => {
    return fgList ?? [];
  });

  memOptionsFG = memoizeOne((fgsListAll) => {
    return (
      fgsListAll
        ?.map((d1) => ({ label: d1.tableName, value: d1.featureGroupId }))
        ?.sort((a, b) => {
          return (a?.label ?? '').localeCompare(b?.label ?? '');
        }) ?? []
    );
  });

  onClickLock = (isLock, featureGroupId) => {
    REClient_.client_().setFeatureGroupModifierLock(featureGroupId, isLock, (err, res) => {
      if (err || !res?.success) {
        REActions.addNotificationError(err || Constants.errorDefault);
      } else {
        this.refreshFGs();
      }
    });
  };

  render() {
    const isAdmin = calcAuthUserIsLoggedIn()?.isAdmin === true;

    const columnsGroups: ITableExtColumn[] = [
      {
        field: 'groupName',
        title: 'Name',
        render: (text, row, index) => {
          let def1 = null;
          if (row?.defaultGroup) {
            def1 = (
              <TooltipExt title={'Default'}>
                <FontAwesomeIcon icon={require('@fortawesome/pro-regular-svg-icons/faShieldCheck').faShieldCheck} transform={{ size: 16, x: 0, y: 0 }} style={{ color: 'white', cursor: 'pointer', marginRight: '5px' }} />
              </TooltipExt>
            );
          }

          let isMine = null;
          if (calcAuthUserIsLoggedIn()?.orgGroups?.find((g1) => g1.groupName === text) != null) {
            isMine = (
              <span
                css={`
                  margin-left: 5px;
                  opacity: 0.8;
                  font-size: 13px;
                `}
              >
                (You are in)
              </span>
            );
          }

          return (
            <span>
              {def1}
              {text}
              {isMine}
              {this.state.groupsListSelId === row.organizationGroupId && (
                <FontAwesomeIcon icon={require('@fortawesome/pro-regular-svg-icons/faArrowRight').faArrowRight} transform={{ size: 18, x: 0, y: 0 }} style={{ color: 'white', cursor: 'pointer', marginLeft: '9px', opacity: 0.8 }} />
              )}
            </span>
          );
        },
      },
      {
        noAutoTooltip: true,
        noLink: true,
        title: 'Actions',
        render: (text, row, index) => {
          if (row?.admin || row?.defaultGroup || !isAdmin) {
            return null;
          }
          return (
            <span>
              <ModalConfirm
                title={`Do you want to set "${row.groupName}" as default group for new users?`}
                cancelText={'Cancel'}
                okType={'primary'}
                onConfirmPromise={this.onConfirmSetDefaultGroup.bind(this, row.organizationGroupId)}
                okText={'Set as Default'}
              >
                <TooltipExt title={'Set as Default'}>
                  <FontAwesomeIcon icon={require('@fortawesome/pro-regular-svg-icons/faShieldCheck').faShieldCheck} transform={{ size: 16, x: 0, y: 0 }} style={{ color: 'white', cursor: 'pointer', marginRight: '8px', opacity: 0.85 }} />
                </TooltipExt>
              </ModalConfirm>

              <ModalConfirm title={`Do you want to delete group "${row.groupName}"?`} cancelText={'Cancel'} okType={'danger'} onConfirmPromise={this.onConfirmDeleteGroup.bind(this, row.organizationGroupId)} okText={'Delete'}>
                <FontAwesomeIcon icon={require('@fortawesome/pro-regular-svg-icons/faTimesCircle').faTimesCircle} transform={{ size: 18, x: 0, y: 0 }} style={{ color: 'darkred', cursor: 'pointer' }} />
              </ModalConfirm>
            </span>
          );
        },
        width: 100,
      },
    ];
    const columnsPerms: ITableExtColumn[] = [
      {
        field: 'name',
        title: 'Name',
      },
      {
        noAutoTooltip: true,
        noLink: true,
        title: 'Actions',
        render: (text, row, index) => {
          if (row?.admin) {
            return null;
          }
          return (
            <span>
              <ModalConfirm title={`Do you want to remove permission "${row.name}"?`} cancelText={'Cancel'} okType={'danger'} onConfirmPromise={this.onConfirmDeletePerm.bind(this, groupSel?.organizationGroupId, row.name)} okText={'Remove'}>
                <FontAwesomeIcon icon={require('@fortawesome/pro-regular-svg-icons/faTimesCircle').faTimesCircle} transform={{ size: 18, x: 0, y: 0 }} style={{ color: 'darkred', cursor: 'pointer' }} />
              </ModalConfirm>
            </span>
          );
        },
        width: 100,
      },
    ];
    const columnsUsers: ITableExtColumn[] = [
      {
        field: 'email',
        title: 'EMail',
      },
      {
        noAutoTooltip: true,
        noLink: true,
        title: 'Actions',
        render: (text, row, index) => {
          return (
            <span>
              <ModalConfirm
                title={`Do you want to remove user "${row.email}" from group?`}
                cancelText={'Cancel'}
                okType={'danger'}
                onConfirmPromise={this.onConfirmDeleteUser.bind(this, groupSel?.organizationGroupId, row.userId)}
                okText={'Remove'}
              >
                <FontAwesomeIcon icon={require('@fortawesome/pro-regular-svg-icons/faTimesCircle').faTimesCircle} transform={{ size: 18, x: 0, y: 0 }} style={{ color: 'darkred', cursor: 'pointer' }} />
              </ModalConfirm>
            </span>
          );
        },
        width: 100,
      },
    ];
    const columnsFGs: ITableExtColumn[] = [
      {
        title: 'TableName',
        field: 'tableName',
      },
      {
        noAutoTooltip: true,
        noLink: true,
        title: 'Actions',
        render: (text, row, index) => {
          let isLock = row.modificationLock === true;

          let lockElem = (
            <ModalConfirm
              title={`Do you want to ${isLock ? 'Unlock' : 'Lock'} feature group "${row.tableName}"?`}
              cancelText={'Cancel'}
              okType={'danger'}
              onConfirm={this.onClickLock.bind(this, !isLock, row.featureGroupId)}
              okText={isLock ? 'Unlock' : 'Lock'}
            >
              <Button
                type={'primary'}
                ghost
                size={'small'}
                css={`
                  margin-right: 9px;
                `}
              >
                {isLock ? 'Locked' : 'Unlocked'}
              </Button>
            </ModalConfirm>
          );
          lockElem = <TooltipExt title={isLock ? '' : ''}>{lockElem}</TooltipExt>;

          return (
            <span>
              {lockElem}
              <ModalConfirm
                title={`Do you want to remove feature group "${row.tableName}" from the group?`}
                cancelText={'Cancel'}
                okType={'danger'}
                onConfirmPromise={this.onConfirmDeleteFG.bind(this, groupSel?.organizationGroupId, row.featureGroupId)}
                okText={'Remove'}
              >
                <FontAwesomeIcon icon={require('@fortawesome/pro-regular-svg-icons/faTimesCircle').faTimesCircle} transform={{ size: 18, x: 0, y: 0 }} style={{ color: 'darkred', cursor: 'pointer' }} />
              </ModalConfirm>
            </span>
          );
        },
        width: 136,
      },
    ];

    const allHH = (this.props.height ?? 510) - 2 * 20,
      topHH = 50;
    let groupSel: IPermGroupOne = this.memGroupSel(this.state.groupsListSelId, this.state.groupsList);

    let usersList = this.memUsersList(this.state.userList, groupSel);
    let permissionsList = this.memPermsList(groupSel);

    let optionsPermissions = this.memOptionsPerms(this.state.groupsList?.find((g1) => !!g1.admin)?.permissions, permissionsList);
    let optionsUsers = this.memOptionsUsers(this.state.userList);

    let fgsList = this.memFGList(this.state.fgList, groupSel);
    let optionsFGs = this.memOptionsFG(this.state.fgListAll);

    const columnsType: ITableExtColumn[] = [
      {
        title: 'Type',
        field: 'label',
        render: (text, row, index) => {
          return (
            <span>
              <FontAwesomeIcon icon={require('@fortawesome/pro-duotone-svg-icons/faFolders').faFolders} transform={{ size: 18, x: 0, y: 0 }} style={{ color: 'white', cursor: 'pointer', marginRight: '12px' }} />
              {text}
              {this.state.selType === row.value && (
                <FontAwesomeIcon icon={require('@fortawesome/pro-regular-svg-icons/faArrowRight').faArrowRight} transform={{ size: 18, x: 0, y: 0 }} style={{ color: 'white', cursor: 'pointer', marginLeft: '9px', opacity: 0.8 }} />
              )}
            </span>
          );
        },
      },
    ];
    let typeList = this.memOptionsType(this.state.selType, calcAuthUserIsLoggedIn()?.isAdmin === true);

    return (
      <div style={{ width: '100%', minWidth: '800px' }}>
        <div
          css={`
            position: relative;
            height: ${allHH + topHH}px;
          `}
        >
          {/*// @ts-ignore*/}
          <SplitPane
            split={'vertical'}
            minSize={250}
            defaultSize={Utils.dataNum('orggroups_list_left_ww', 300)}
            onChange={(v1) => {
              Utils.dataNum('orggroups_list_left_ww', undefined, v1);
            }}
          >
            <div
              css={`
                margin-right: 5px;
              `}
            >
              <div
                css={`
                  margin: 8px 0;
                  text-align: center;
                  font-size: 14px;
                `}
              >
                Groups
                <ModalConfirm
                  okType={'primary'}
                  onConfirmPromise={this.onConfirmAddGroup}
                  title={
                    <div className={'useDark'}>
                      <div>Add Group</div>
                      <div
                        css={`
                          margin-top: 20px;
                        `}
                      >
                        <Input
                          defaultValue={''}
                          placeholder={'Name'}
                          onChange={(e) => {
                            this.groupName = e.target.value;
                          }}
                        />
                      </div>
                    </div>
                  }
                  okText={'Add'}
                  cancelText={'Cancel'}
                >
                  <span
                    css={`
                      margin-left: 8px;
                      padding: 3px 8px;
                      background: rgba(255, 255, 255, 0.1);
                      border: rgba(255, 255, 255, 0.4);
                      border-radius: 3px;
                    `}
                  >
                    <FontAwesomeIcon icon={require('@fortawesome/pro-regular-svg-icons/faPlus').faPlus} transform={{ size: 18, x: 0, y: 0 }} style={{ color: 'green', cursor: 'pointer' }} />
                  </span>
                </ModalConfirm>
              </div>
              <div
                css={`
                  position: absolute;
                  top: ${topHH}px;
                  left: 0;
                  right: 5px;
                  bottom: 0;
                `}
              >
                <TableExt
                  isVirtual
                  calcIsSelected={this.calcIsSelectedGroups}
                  onClickCell={this.onClickRowGroups}
                  height={allHH}
                  defaultSort={{ field: 'groupName', isAsc: true }}
                  dataSource={this.state.groupsList}
                  columns={columnsGroups}
                  calcKey={(r1) => r1.organizationGroupId}
                />
              </div>
            </div>
            {/*// @ts-ignore*/}
            <SplitPane
              split={'vertical'}
              minSize={250}
              defaultSize={Utils.dataNum('orggroups_left_sec_ww', 250)}
              onChange={(v1) => {
                Utils.dataNum('orggroups_left_sec_ww', undefined, v1);
              }}
            >
              <div
                css={`
                  margin-right: 5px;
                `}
              >
                <div
                  css={`
                    margin: 8px 0;
                    text-align: center;
                    font-size: 14px;
                  `}
                >
                  Type
                </div>
                <div
                  css={`
                    position: absolute;
                    top: ${topHH}px;
                    left: 5px;
                    right: 5px;
                    bottom: 0;
                  `}
                >
                  <TableExt calcIsSelected={this.calcIsSelectedType} onClickCell={this.onClickRowType} isVirtual height={allHH} disableSort dataSource={typeList} columns={columnsType} calcKey={(r1) => r1.value} />
                </div>
              </div>
              <div
                css={`
                  margin-left: 5px;
                `}
              >
                {this.state.selType === GroupsType.Permissions && (
                  <div>
                    <div
                      css={`
                        margin: 8px 0;
                        text-align: center;
                        font-size: 14px;
                      `}
                    >
                      Permissions - (Count: {permissionsList?.length ?? '0'})
                      {!groupSel?.admin && (
                        <ModalConfirm
                          okType={'primary'}
                          onConfirmPromise={this.onConfirmAddPerm.bind(this, groupSel?.organizationGroupId)}
                          title={
                            <div className={'useDark'}>
                              <div>Add Permission</div>
                              <div
                                css={`
                                  margin-top: 20px;
                                `}
                              >
                                <SelectExt
                                  placeholder={'Permission'}
                                  options={optionsPermissions}
                                  onChange={(option1) => {
                                    this.groupPerm = option1?.value;
                                  }}
                                />
                              </div>
                            </div>
                          }
                          okText={'Add'}
                          cancelText={'Cancel'}
                        >
                          <span
                            css={`
                              margin-left: 8px;
                              padding: 3px 8px;
                              background: rgba(255, 255, 255, 0.1);
                              border: rgba(255, 255, 255, 0.4);
                              border-radius: 3px;
                            `}
                          >
                            <FontAwesomeIcon icon={require('@fortawesome/pro-regular-svg-icons/faPlus').faPlus} transform={{ size: 18, x: 0, y: 0 }} style={{ color: 'green', cursor: 'pointer' }} />
                          </span>
                        </ModalConfirm>
                      )}
                    </div>
                    <div
                      css={`
                        position: absolute;
                        top: ${topHH}px;
                        left: 5px;
                        right: 5px;
                        bottom: 0;
                      `}
                    >
                      <TableExt isVirtual height={allHH} defaultSort={{ field: 'name', isAsc: true }} dataSource={permissionsList} columns={columnsPerms} calcKey={(r1) => r1.id} />
                    </div>
                  </div>
                )}

                {this.state.selType === GroupsType.Users && (
                  <div>
                    <div
                      css={`
                        margin: 8px 0;
                        text-align: center;
                        font-size: 14px;
                      `}
                    >
                      Users - (Count: {usersList?.length ?? '0'})
                      <ModalConfirm
                        okType={'primary'}
                        onConfirmPromise={this.onConfirmAddUser.bind(this, groupSel?.organizationGroupId)}
                        title={
                          <div className={'useDark'}>
                            <div>Add User</div>
                            <div
                              css={`
                                margin-top: 20px;
                              `}
                            >
                              <SelectExt
                                placeholder={'User'}
                                options={optionsUsers}
                                onChange={(option1) => {
                                  this.groupUserId = option1?.value;
                                }}
                                isSearchable={true}
                              />
                            </div>
                          </div>
                        }
                        okText={'Add'}
                        cancelText={'Cancel'}
                      >
                        <span
                          css={`
                            margin-left: 8px;
                            padding: 3px 8px;
                            background: rgba(255, 255, 255, 0.1);
                            border: rgba(255, 255, 255, 0.4);
                            border-radius: 3px;
                          `}
                        >
                          <FontAwesomeIcon icon={require('@fortawesome/pro-regular-svg-icons/faPlus').faPlus} transform={{ size: 18, x: 0, y: 0 }} style={{ color: 'green', cursor: 'pointer' }} />
                        </span>
                      </ModalConfirm>
                    </div>
                    <div
                      css={`
                        position: absolute;
                        top: ${topHH}px;
                        left: 5px;
                        right: 0;
                        bottom: 0;
                      `}
                    >
                      <TableExt isVirtual height={allHH} defaultSort={{ field: 'email', isAsc: true }} dataSource={usersList} columns={columnsUsers} calcKey={(r1) => r1.userId} />
                    </div>
                  </div>
                )}

                {this.state.selType === GroupsType.FeatureGroups && (
                  <div>
                    <div
                      css={`
                        margin: 8px 0;
                        text-align: center;
                        font-size: 14px;
                      `}
                    >
                      Feature Groups - (Count: {fgsList?.length ?? '0'})
                      <ModalConfirm
                        okType={'primary'}
                        onConfirmPromise={this.onConfirmAddFG.bind(this, groupSel?.organizationGroupId)}
                        title={
                          <div className={'useDark'}>
                            <div>Add Feature Group</div>
                            <div
                              css={`
                                margin-top: 20px;
                              `}
                            >
                              <SelectExt
                                placeholder={'Feature Group'}
                                options={optionsFGs}
                                onChange={(option1) => {
                                  this.groupFGId = option1?.value;
                                }}
                                isSearchable={true}
                              />
                            </div>
                          </div>
                        }
                        okText={'Add'}
                        cancelText={'Cancel'}
                      >
                        <span
                          css={`
                            margin-left: 8px;
                            padding: 3px 8px;
                            background: rgba(255, 255, 255, 0.1);
                            border: rgba(255, 255, 255, 0.4);
                            border-radius: 3px;
                          `}
                        >
                          <FontAwesomeIcon icon={require('@fortawesome/pro-regular-svg-icons/faPlus').faPlus} transform={{ size: 18, x: 0, y: 0 }} style={{ color: 'green', cursor: 'pointer' }} />
                        </span>
                      </ModalConfirm>
                    </div>
                    <div
                      css={`
                        position: absolute;
                        top: ${topHH}px;
                        left: 5px;
                        right: 0;
                        bottom: 0;
                      `}
                    >
                      <TableExt isVirtual height={allHH} defaultSort={{ field: 'tableName', isAsc: true }} dataSource={fgsList} columns={columnsFGs} calcKey={(r1) => r1.featureGroupId} />
                    </div>
                  </div>
                )}
              </div>
            </SplitPane>
          </SplitPane>
        </div>

        {/*<div style={{ marginTop: '50px', width: '400px', margin: '0 auto', }}>*/}
        {/*  <div style={{ fontSize: '16px', margin: '4px 0', }}>Invite a team member</div>*/}
        {/*  <div style={{ marginTop: '20px', }}>*/}
        {/*    <Link to={'/'+PartsLink.profile+'/'+UserProfileSection.invites}><Button htmlType="submit" type={'primary'} style={{ width: '100%', }}>Invite...</Button></Link>*/}
        {/*  </div>*/}
        {/*</div>*/}
      </div>
    );
  }
}

export default connect(
  (state: any) => ({
    paramsProp: state.paramsProp,
    authUser: state.authUser,
  }),
  null,
)(ProfileGroups);
