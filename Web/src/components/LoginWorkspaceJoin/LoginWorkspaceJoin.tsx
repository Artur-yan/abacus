import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Button from 'antd/lib/button';
import Form, { FormInstance } from 'antd/lib/form';
import Input from 'antd/lib/input';
import * as React from 'react';
import { connect } from 'react-redux';
import Location from '../../../core/Location';
import Utils from '../../../core/Utils';
import REActions from '../../actions/REActions';
import REClient_ from '../../api/REClient';
import Constants from '../../constants/Constants';
import memoizeOne from '../../libs/memoizeOne';
import StoreActions from '../../stores/actions/StoreActions';
import FormExt from '../FormExt/FormExt';
import Link from '../Link/Link';
import PartsLink from '../NavLeft/PartsLink';
import RefreshAndProgress from '../RefreshAndProgress/RefreshAndProgress';
const s = require('./LoginWorkspaceJoin.module.css');
const sd = require('../antdUseDark.module.css');

interface ILoginWorkspaceJoinProps {
  paramsProp?: any;
  isNew?: boolean;
}

interface ILoginWorkspaceJoinState {
  isRefreshing?: boolean;
  listWorkspaces?: any[];
  showCreateNew?: boolean;
}

class LoginWorkspaceJoin extends React.PureComponent<ILoginWorkspaceJoinProps, ILoginWorkspaceJoinState> {
  private isM: boolean;
  formRef = React.createRef<FormInstance>();

  constructor(props) {
    super(props);

    this.state = {
      isRefreshing: false,
      showCreateNew: false,
    };
  }

  componentDidMount() {
    this.isM = true;

    REClient_.client_().listOrganizations((err, res) => {
      if (!this.isM) {
        return;
      }

      if (!err && res && res.result) {
        setTimeout(() => {
          this.setState({
            listWorkspaces: res.result,
          });
        }, 0);
      }
    });
  }

  componentWillUnmount() {
    this.isM = false;
  }

  handleSubmit = (values) => {
    if (this.props.isNew) {
      return;
    }

    let name = values.name;

    this.setState({
      isRefreshing: true,
    });

    REClient_.client_().createOrganization(name, null, false, (errOrg, resOrg) => {
      this.setState({
        isRefreshing: false,
      });
      if (errOrg || !resOrg) {
        REActions.addNotificationError(errOrg || Constants.errorDefault);
      } else {
        StoreActions.getAuthUser_(() => {
          Utils.rediretToOrSaved('/app/' + PartsLink.welcome);
        });
      }
    });
  };

  onClickJoinWorkspace = (workspace1) => {
    if (workspace1) {
      this.setState({
        isRefreshing: true,
      });

      REClient_.client_().joinOrganization(workspace1.organizationId, (errOrg, resOrg) => {
        this.setState({
          isRefreshing: false,
        });
        if (errOrg || !resOrg) {
          REActions.addNotificationError(errOrg || Constants.errorDefault);
        } else {
          StoreActions.getAuthUser_(() => {
            Utils.rediretToOrSaved('/app/' + PartsLink.welcome);
          });
        }
      });
    }
  };

  memWorkspacesList = memoizeOne((listWorkspaces) => {
    if (!listWorkspaces) {
      return null;
    }

    return listWorkspaces
      .filter((w1) => w1 != null && !w1.joined)
      .map((w1) => {
        return (
          <div
            key={'ws_' + w1.organizationId}
            style={{ textAlign: 'center', cursor: 'pointer', marginBottom: '5px', padding: '8px 0', fontSize: '14px', color: 'white', backgroundColor: 'rgba(255,255,255,0.1)' }}
            onClick={this.onClickJoinWorkspace.bind(this, w1)}
          >
            <span style={{ opacity: 0.7 }}>Join:&nbsp;</span>
            {w1.name}&nbsp;-&nbsp;{w1.workspace}
          </div>
        );
      });
  });

  onClickCreateNewToggle = (e) => {
    this.setState({
      showCreateNew: !this.state.showCreateNew,
    });
  };

  onClickSkipThis = (e) => {
    this.setState({
      isRefreshing: true,
    });

    REClient_.client_()._createPlaceholderOrganization((err, res) => {
      this.setState({
        isRefreshing: false,
      });

      if (err || !res) {
        REActions.addNotificationError(err || Constants.errorDefault);
      } else {
        StoreActions.getAuthUser_(() => {
          Utils.rediretToOrSaved('/app/' + PartsLink.welcome);
        });
      }
    });
  };

  onClickBack = (e) => {
    window.history.back();
  };

  onClickCreateOrgIsNew = (e) => {
    Location.push('/' + PartsLink.finish_billing, undefined, 'create=1');
  };

  render() {
    let { paramsProp, isNew } = this.props;
    let { listWorkspaces } = this.state;

    let workspacesElem = <div></div>;
    let showJoin = listWorkspaces && listWorkspaces.length > 0;
    if (showJoin) {
      workspacesElem = <div style={{ marginTop: '20px' }}>{this.memWorkspacesList(listWorkspaces)}</div>;
    }

    let showCreateNew = this.state.showCreateNew;
    if (!workspacesElem || !showJoin || isNew) {
      showCreateNew = true;
    }

    let allowBack = !!paramsProp?.get('allowBack');

    return (
      <div style={{ position: 'absolute', paddingTop: '100px', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', justifyContent: 'center' }}>
        <RefreshAndProgress isRelative={true} isRefreshing={this.state.isRefreshing}>
          <div style={{ color: Utils.isDark() ? 'white' : 'black', fontSize: '26px', marginBottom: 30 + 'px', position: 'relative' }}>
            {allowBack && (
              <div style={{ textAlign: 'center', fontSize: '14px', marginBottom: '10px', opacity: 0.8 }}>
                <span style={{ cursor: 'pointer' }} onClick={this.onClickBack}>
                  <FontAwesomeIcon icon={['far', 'arrow-left']} transform={{ size: 13, x: 0, y: 1.5 }} style={{ color: 'white', marginRight: '6px' }} />
                  Go Back
                </span>
              </div>
            )}
            {!allowBack && !isNew && (
              <div
                css={`
                  position: absolute;
                  top: -48px;
                  right: -50px;
                  background: rgba(0, 0, 0, 0.33);
                  border-radius: 15px;
                  border: 1px solid #282828;
                  padding: 0 12px 2px 12px;
                  line-height: 1;
                  height: 26px;
                `}
              >
                <div
                  onClick={() => {
                    REClient_.client_()._signOut(() => {
                      StoreActions.userLogout_();
                      /**
                       * Manual redirection to the signin page is not
                       * required because:
                       *
                       * 1. After the store action on the line above runs,
                       *    it re-renders the MainPage component.
                       * 2. This component checks for logged in user, if
                       *    the user is not logged in, it redirects to the
                       *    signin page.
                       *
                       *    Link: https://github.com/realityengines/code/blob/3f79ea9c5b7f1a9a1e86d156e0b89a88326b04a8/react/Web/src/components/MainPage/MainPage.tsx#L830
                       *    > Location.push('/' + PartsLink.signin);
                       */
                    });
                  }}
                >
                  <span
                    css={`
                      display: inline-block;
                      margin: 4px 0 0 0;
                      padding: 0;
                      height: 24px;
                      vertical-align: top;
                      line-height: 1;
                      font-size: 12px !important;
                      color: rgba(255, 255, 255, 0.3);
                      font-weight: 200 !important;
                      :hover {
                        color: rgba(255, 255, 255, 0.6);
                      }
                    `}
                    style={{ cursor: 'pointer' }}
                    className={sd.styleTextBlue}
                  >
                    Log out
                  </span>
                </div>
              </div>
            )}
            <div style={{ display: 'table', margin: '0 auto' }}>
              <span style={{ display: 'table-cell' }}>
                <div style={{ textAlign: 'left', lineHeight: '32px' }}>{showJoin ? 'Create or Join an Organization' : 'Create an Organization'}</div>
              </span>
            </div>
          </div>

          <div style={{ padding: '40px', width: '420px' }} className={sd.grayPanel}>
            <FormExt
              layout={'vertical'}
              ref={this.formRef}
              onFinish={this.handleSubmit}
              className="login-form"
              initialValues={{
                name: (paramsProp && paramsProp.get('workspacename')) || '',
              }}
            >
              {showJoin && <div style={{ color: 'white', margin: '5px 0', textAlign: 'center' }}>Please select the organization you belong to:</div>}
              {workspacesElem}
              {showJoin && <div style={{ color: 'white', margin: '10px 0', textAlign: 'center' }}>&nbsp;</div>}

              {showJoin && (
                <div onClick={this.onClickCreateNewToggle} style={{ margin: '5px 0', textAlign: 'center' }} className={sd.linkBlue}>
                  Don{"'"}t belong to the above organization(s)?
                  <br />
                  Create a new Organization
                </div>
              )}
              {showCreateNew && !isNew && (
                <Form.Item rules={[{ required: true, message: 'Name required!' }]} name={'name'} style={{ marginBottom: '1px' }} hasFeedback label={<span style={{ color: Utils.isDark() ? 'white' : 'black' }}>Organization Name</span>}>
                  <Input placeholder="" />
                </Form.Item>
              )}

              {showCreateNew && (
                <div style={{ marginTop: '20px' }}>
                  <Button onClick={isNew ? this.onClickCreateOrgIsNew : null} htmlType="submit" type={'primary'} style={{ width: '100%' }}>
                    Create New Organization
                  </Button>
                </div>
              )}
            </FormExt>
          </div>
          <div style={{ marginTop: '14px', textAlign: 'center' }} className={sd.styleTextGrayLight}>
            <Button type={'primary'} ghost style={{ cursor: 'pointer', fontSize: '15px' }} onClick={this.onClickSkipThis}>
              Skip this for now
            </Button>
          </div>
        </RefreshAndProgress>
      </div>
    );
  }
}

export default connect(
  (state: any) => ({
    paramsProp: state.paramsProp,
  }),
  null,
)(LoginWorkspaceJoin);
