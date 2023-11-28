import QuestionCircleOutlined from '@ant-design/icons/QuestionCircleOutlined';
import Button from 'antd/lib/button';
import Checkbox from 'antd/lib/checkbox';
import { FormInstance } from 'antd/lib/form';
import Input from 'antd/lib/input';
import Modal from 'antd/lib/modal';
import Steps from 'antd/lib/steps';
import Tabs from 'antd/lib/tabs';
import * as React from 'react';
import { connect } from 'react-redux';
import styled from 'styled-components';
import Location from '../../../core/Location';
import Utils from '../../../core/Utils';
import REActions from '../../actions/REActions';
import REClient_ from '../../api/REClient';
import Constants from '../../constants/Constants';
import { memoizeOneCurry } from '../../libs/memoizeOne';
import StoreActions from '../../stores/actions/StoreActions';
import applicationConnectorOptions from '../../stores/reducers/applicationConnectorOptions';
import applicationConnectors from '../../stores/reducers/applicationConnectors';
import databaseConnectorOptions from '../../stores/reducers/databaseConnectorOptions';
import databaseConnectors from '../../stores/reducers/databaseConnectors';
import fileConnectorOptions from '../../stores/reducers/fileConnectorOptions';
import fileConnectors from '../../stores/reducers/fileConnectors';
import streamingConnectorOptions from '../../stores/reducers/streamingConnectorOptions';
import streamingConnectors from '../../stores/reducers/streamingConnectors';
import Connectors from '../Connectors/Connectors';
import CopyText from '../CopyText/CopyText';
import ModalConfirm from '../ModalConfirm/ModalConfirm';
import NanoScroller from '../NanoScroller/NanoScroller';
import PartsLink from '../NavLeft/PartsLink';
import Oauth from '../Oauth/Oauth';
import TableExt, { ITableExtColumn } from '../TableExt/TableExt';
import { UserProfileSection } from '../UserProfile/UserProfile';
import WindowResizeListener from '../WindowResizeListener/WindowResizeListener';
const s = require('./CloudOwnership.module.css');
const sd = require('../antdUseDark.module.css');
const { Step } = Steps;
const { TabPane } = Tabs;
const { confirm } = Modal;

interface ICloudOwnershipProps {
  paramsProp?: any;
  databaseConnectors?: any;
  databaseConnectorOptions?: any;
  fileConnectorOptions?: any;
  fileConnectors?: any;
  applicationConnectors?: any;
  applicationConnectorOptions?: any;
  streamingConnectors?: any;
  streamingConnectorOptions?: any;
}

interface ICloudOwnershipState {
  isRefreshing?: boolean;
  resInstructions?: any;
  roleArn?: string;
  usedBucket?: string;
  dimensions?: { width; height };
  askArn?: boolean;
  databaseInstructions?: any;
  service?: string;
  auth?: any;
  searchKey?: string;
  connectorType?: string;
  verify?: any;
  databaseConnectorId?: string;
  isTabFileConnectors?: boolean;
  isTabDatabaseConnectors?: boolean;
  isTabApplicationConnectors?: boolean;
  isTabStreamingConnectors?: boolean;
}

const StyleTabOne = styled.span`
  font-family: Matter;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.7px;
  color: ${(props) => (props.isSelected ? '#00f8c5' : 'white')};
  padding: 4px 10px 5px;
  border-radius: 17.5px;
  border: 1px solid ${(props) => (props.isSelected ? 'white' /*'#38bfa1'*/ : 'transparent')};
  margin-right: 26px;
  cursor: pointer;
`;

class CloudOwnership extends React.PureComponent<ICloudOwnershipProps, ICloudOwnershipState> {
  private isM: boolean;
  private oauth_handler: Oauth;
  formRef = React.createRef<FormInstance>();
  formRef2 = React.createRef<FormInstance>();
  formRef3 = React.createRef<FormInstance>();
  usedParam: boolean;
  connectors: any;
  private editNameValue: any;

  constructor(props) {
    super(props);
    let windowWidth = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
    let windowHeight = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;

    let key = this.props.paramsProp?.get('tab') || '0';
    if (!['0', '1', '2', '3'].includes(key)) {
      key = '0';
    }

    this.state = {
      dimensions: { width: windowWidth, height: windowHeight },
      isRefreshing: false,

      isTabFileConnectors: key === '1',
      isTabApplicationConnectors: key === '2',
      isTabDatabaseConnectors: key === '0',
      isTabStreamingConnectors: key === '3',
    };
  }

  onResize = (windowSize) => {
    if (this.isM) {
      this.setState({ dimensions: { width: windowSize.windowWidth, height: windowSize.windowHeight } });
    }
  };

  doMem = (doNow = true) => {
    if (doNow) {
      this.doMemTime();
    } else {
      setTimeout(() => {
        this.doMemTime();
      }, 0);
    }
  };

  doMemTime = () => {
    if (!this.isM) {
      return;
    }

    this.memDatabaseConnectorOptions(true)(this.props.databaseConnectorOptions);
    this.memFileConnectorOptions(true)(this.props.fileConnectorOptions);
    this.memApplicationConnectorOptions(true)(this.props.applicationConnectorOptions);
    this.memFileConnectors(true)(this.props.fileConnectors);
    this.memApplicationConnectors(true)(this.props.applicationConnectors);
    this.memStreamingConnectorOptions(true)(this.props.streamingConnectorOptions);
    this.memStreamingConnectors(true)(this.props.streamingConnectors);
    this.memDatabaseConnectors(true)(this.props.databaseConnectors);
  };

  memDatabaseConnectorOptions = memoizeOneCurry((doCall, databaseConnectorOptionsParam) => {
    return databaseConnectorOptions.memDatabaseConnectorOptions(doCall, databaseConnectorOptionsParam);
  });

  memFileConnectorOptions = memoizeOneCurry((doCall, fileConnectorOptionsParam) => {
    return fileConnectorOptions.memFileConnectorOptions(doCall, fileConnectorOptionsParam);
  });

  memFileConnectors = memoizeOneCurry((doCall, fileConnectorsParam) => {
    return fileConnectors.memFileConnectors(doCall, fileConnectorsParam);
  });

  memApplicationConnectors = memoizeOneCurry((doCall, applicationConnectorsParam) => {
    return applicationConnectors.memApplicationConnectors(doCall, applicationConnectorsParam);
  });

  memApplicationConnectorOptions = memoizeOneCurry((doCall, applicationConnectorOptionsParam) => {
    return applicationConnectorOptions.memApplicationConnectorOptions(doCall, applicationConnectorOptionsParam);
  });

  memStreamingConnectors = memoizeOneCurry((doCall, streamingConnectorsParam) => {
    return streamingConnectors.memStreamingConnectors(doCall, streamingConnectorsParam);
  });

  memStreamingConnectorOptions = memoizeOneCurry((doCall, streamingConnectorOptionsParam) => {
    return streamingConnectorOptions.memStreamingConnectorOptions(doCall, streamingConnectorOptionsParam);
  });

  memDatabaseConnectors = memoizeOneCurry((doCall, databaseConnectorsParam) => {
    return databaseConnectors.memDatabaseConnectors(doCall, databaseConnectorsParam);
  });

  refreshList = () => {
    StoreActions.getDatabaseConnectorOptions();
    StoreActions.getFileConnectorOptions();
    StoreActions.getApplicationConnectorOptions();
    StoreActions.getApplicationConnectors();
    StoreActions.getFileConnectors();
    StoreActions.getDatabaseConnectors();
  };

  componentDidMount() {
    this.isM = true;
    this.oauth_handler = new Oauth();
    this.refreshList();
  }

  componentWillUnmount() {
    this.isM = false;
  }

  componentDidUpdate(prevProps: Readonly<ICloudOwnershipProps>, prevState: Readonly<ICloudOwnershipState>, snapshot?: any): void {
    this.doMem();
  }

  onClickDelete = (row, e) => {
    e && e.preventDefault();

    if (row && row.bucket) {
      this.setState({
        isRefreshing: true,
      });

      REClient_.client_().removeExternalBucket(row.bucket, (err, res) => {
        this.setState({
          isRefreshing: false,
        });

        if (err || !res) {
          REActions.addNotificationError(err || Constants.errorDefault);
        } else {
          REActions.addNotification('Bucket removed');
          this.refreshList();
        }
      });
    }
  };

  onClickDeleteDatabase = (row, e) => {
    e && e.preventDefault();

    if (row && row.databaseConnectorId) {
      this.setState({
        isRefreshing: true,
      });

      REClient_.client_().removeDatabaseConnector(row.databaseConnectorId, (err, res) => {
        this.setState({
          isRefreshing: false,
        });

        if (err || !res) {
          REActions.addNotificationError(err || Constants.errorDefault);
        } else {
          REActions.addNotification('Database Connector Removed');
          this.refreshList();
        }
      });
    }
  };

  onClickDeleteApplication = (row, e) => {
    e && e.preventDefault();

    if (row && row.applicationConnectorId) {
      this.setState({
        isRefreshing: true,
      });

      REClient_.client_().removeDatabaseConnector(row.applicationConnectorId, (err, res) => {
        this.setState({
          isRefreshing: false,
        });

        if (err || !res) {
          REActions.addNotificationError(err || Constants.errorDefault);
        } else {
          REActions.addNotification('Application Connector Removed');
          this.refreshList();
        }
      });
    }
  };

  onClickDeleteStreaming = (row, e) => {
    e && e.preventDefault();

    if (row && row.streamingConnectorId) {
      this.setState({
        isRefreshing: true,
      });

      REClient_.client_().removeStreamingConnector(row.streamingConnectorId, (err, res) => {
        this.setState({
          isRefreshing: false,
        });

        if (err || !res) {
          REActions.addNotificationError(err || Constants.errorDefault);
        } else {
          REActions.addNotification('Streaming Connector Removed');
          this.refreshList();
        }
      });
    }
  };

  onClickInstructions = (bucket, writePermission, roleArn, e) => {
    e && e.preventDefault();
    e && e.stopPropagation();

    this.connectors?.onClickInstructions(bucket, writePermission, roleArn, e);
  };

  onSwitch = (checked) => {
    this.setState({
      isRefreshing: true,
    });

    REClient_.client_().getExternalBucketOwnershipTest(this.state.usedBucket, checked, (err, res) => {
      this.setState({
        isRefreshing: false,
      });

      if (err || !res) {
        REActions.addNotificationError(err || Constants.errorDefault);
      } else {
        res = res?.result;

        if (res) {
          this.setState(
            {
              resInstructions: res,
            },
            () => {},
          );
        }
      }
    });
  };

  onClickVerify = (row, e) => {
    e.preventDefault();
    e.stopPropagation();

    if (row && row.bucket) {
      this.setState({
        isRefreshing: true,
      });

      REClient_.client_().verifyExternalBucket(row.bucket, (err, res) => {
        this.setState({
          isRefreshing: false,
        });

        if (err || !res) {
          REActions.addNotificationError(err || Constants.errorDefault);
        } else if (!res?.result?.verified) {
          REActions.addNotificationError(Constants.flags.product_name + ' could not access this bucket');
        } else {
          REActions.addNotification('Done!');
          this.refreshList();
        }
      });
    }
  };

  onClickApplicationVerify = (applicationConnectorId, e) => {
    e && e.preventDefault();
    e && e.stopPropagation();

    if (!applicationConnectorId) {
      return;
    }

    this.setState({
      isRefreshing: true,
    });

    REClient_.client_().verifyApplicationConnector(applicationConnectorId, (err, res) => {
      this.setState({
        isRefreshing: false,
      });

      if (err || !res) {
        REActions.addNotificationError(err || Constants.errorDefault);
        // } else if(!res?.result?.verified) {
        //   REActions.addNotificationError(Constants.flags.product_name+' could not access this database');
      } else {
        this.refreshList();
      }
    });
  };

  onClickStreamingVerify = (streamingConnectorId, e) => {
    e && e.preventDefault();
    e && e.stopPropagation();

    if (!streamingConnectorId) {
      return;
    }

    this.setState({
      isRefreshing: true,
    });

    REClient_.client_().verifyStreamingConnector(streamingConnectorId, (err, res) => {
      this.setState({
        isRefreshing: false,
      });

      if (err || !res) {
        REActions.addNotificationError(err || Constants.errorDefault);
        // } else if(!res?.result?.verified) {
        //   REActions.addNotificationError(Constants.flags.product_name+' could not access this database');
      } else {
        this.refreshList();
      }
    });
  };

  onClickRenameDatabaseConnector = (databaseConnectorId, databaseConnectorName, e) => {
    e && e.preventDefault();
    e && e.stopPropagation();
    this.editNameValue = databaseConnectorName;

    confirm({
      title: 'Rename Database Connector',
      okText: 'Rename',
      cancelText: 'Cancel',
      maskClosable: true,
      content: (
        <div>
          <div>{'Current Name: "' + databaseConnectorName + '"'}</div>
          <Input
            style={{ marginTop: '8px' }}
            placeholder={databaseConnectorName}
            defaultValue={databaseConnectorName}
            onChange={(e) => {
              this.editNameValue = e.target.value;
            }}
          />
        </div>
      ),
      onOk: () => {
        if (this.editNameValue != databaseConnectorName) {
          REActions.addNotification('Renaming connector to "' + this.editNameValue + '"');

          REClient_.client_().renameDatabaseConnector(databaseConnectorId, this.editNameValue, (err, res) => {
            if (err) {
              REActions.addNotificationError(err);
            } else {
              REActions.addNotification('Database Connector Renamed!');
              this.refreshList();
            }
          });
        }
      },
      onCancel: () => {
        //
      },
    });
  };

  onClickRenameApplicationConnector = (applicationConnectorId, applicationConnectorName, e) => {
    e && e.preventDefault();
    e && e.stopPropagation();
    this.editNameValue = applicationConnectorName;

    confirm({
      title: 'Rename Application Connector',
      okText: 'Rename',
      cancelText: 'Cancel',
      maskClosable: true,
      content: (
        <div>
          <div>{'Current Name: "' + applicationConnectorName + '"'}</div>
          <Input
            style={{ marginTop: '8px' }}
            placeholder={applicationConnectorName}
            defaultValue={applicationConnectorName}
            onChange={(e) => {
              this.editNameValue = e.target.value;
            }}
          />
        </div>
      ),
      onOk: () => {
        if (this.editNameValue != applicationConnectorName) {
          REActions.addNotification('Renaming connector to "' + this.editNameValue + '"');

          REClient_.client_().renameApplicationConnector(applicationConnectorId, this.editNameValue, (err, res) => {
            if (err) {
              REActions.addNotificationError(err);
            } else {
              REActions.addNotification('Application Connector Renamed!');
              this.refreshList();
            }
          });
        }
      },
      onCancel: () => {
        //
      },
    });
  };

  onClickRenameStreamingConnector = (streamingConnectorId, streamingConnectorName, e) => {
    e && e.preventDefault();
    e && e.stopPropagation();
    this.editNameValue = streamingConnectorName;

    confirm({
      title: 'Rename Streaming Connector',
      okText: 'Rename',
      cancelText: 'Cancel',
      maskClosable: true,
      content: (
        <div>
          <div>{'Current Name: "' + streamingConnectorName + '"'}</div>
          <Input
            style={{ marginTop: '8px' }}
            placeholder={streamingConnectorName}
            defaultValue={streamingConnectorName}
            onChange={(e) => {
              this.editNameValue = e.target.value;
            }}
          />
        </div>
      ),
      onOk: () => {
        if (this.editNameValue != streamingConnectorName) {
          REActions.addNotification('Renaming connector to "' + this.editNameValue + '"');

          REClient_.client_().renameStreamingConnector(streamingConnectorId, this.editNameValue, (err, res) => {
            if (err) {
              REActions.addNotificationError(err);
            } else {
              REActions.addNotification('Streaming Connector Renamed');
              this.refreshList();
            }
          });
        }
      },
      onCancel: () => {
        //
      },
    });
  };

  onClickDatabaseVerify = (databaseConnectorId, e) => {
    e && e.preventDefault();
    e && e.stopPropagation();

    if (!databaseConnectorId) {
      return;
    }

    this.setState({
      isRefreshing: true,
    });

    REClient_.client_().verifyExternalDatabase(databaseConnectorId, (err, res) => {
      this.setState({
        isRefreshing: false,
      });

      if (err || !res) {
        REActions.addNotificationError(err || Constants.errorDefault);
        // } else if(!res?.result?.verified) {
        //   REActions.addNotificationError(Constants.flags.product_name+' could not access this database');
      } else {
        this.refreshList();
      }
    });
  };

  onChangeTabs = (key) => {
    let v1 = false;
    v1 = !!this.state.resInstructions?.authOptions?.[Utils.tryParseInt(key)]?.requiresArn;

    this.setState(
      {
        askArn: v1,
        isTabFileConnectors: key === '1',
        isTabApplicationConnectors: key === '2',
        isTabDatabaseConnectors: key === '0',
        isTabStreamingConnectors: key === '3',
      },
      () => {
        Location.push('/' + PartsLink.profile + '/' + UserProfileSection.connected_services, undefined, Utils.processParamsAsQuery({ tab: key || '0' }, window.location.search));
      },
    );
  };

  onClickConfig = (service, auth, fileOptions, databaseOptions, applicationOptions, streamingOptions, databaseConnectorId, applicationConnectorId, streamingConnectorId, e) => {
    this.connectors?.onClickConfig(service, auth, fileOptions, databaseOptions, applicationOptions, streamingOptions, databaseConnectorId, applicationConnectorId, streamingConnectorId, e);
  };

  isRefreshingChange = (isRef) => {
    this.setState({
      isRefreshing: isRef,
    });
  };

  render() {
    const fileColumns: ITableExtColumn[] = [
      {
        field: 'bucket',
        title: 'Bucket',
        isLinked: true,
      },
      {
        field: 'verified',
        title: 'Verified',
        width: '10%',
        render: (text, row, index) => {
          return <Checkbox checked={('' + text || '').toLowerCase() === 'true'} />;
        },
        align: 'center',
      },
      {
        field: 'writePermission',
        title: 'Write Permission',
        width: '10%',
        render: (text, row, index) => {
          return <Checkbox checked={('' + text || '').toLowerCase() === 'true'} />;
        },
        align: 'center',
      },
      {
        field: 'authExpiresAt',
        title: 'Auth Expires',
        width: '10%',
        align: 'center',
        render: (text, row, index) => {
          if (text != null) {
            const expires_date = new Date(text);
            return expires_date.toUTCString();
          }
          return '-';
        },
      },
      {
        width: '320px',
        noAutoTooltip: true,
        noLink: true,
        title: 'Actions',
        render: (text, row, index) => {
          let showVerify = !row.verified;
          if (!showVerify) {
            if (!row.writePermission) {
              showVerify = true;
            }
          }

          return (
            <span>
              <Button type={'default'} ghost onClick={this.onClickInstructions.bind(this, row?.bucket, row?.writePermission, row?.roleArn || row?.connectionString)}>
                Instructions
              </Button>
              {showVerify && (
                <Button style={{ marginLeft: '8px' }} type={'default'} ghost onClick={this.onClickVerify.bind(this, row)}>
                  Verify
                </Button>
              )}
              <ModalConfirm
                onConfirm={this.onClickDelete.bind(this, row)}
                title={`Do you want to remove access to cloud storage '${row.bucket}'?`}
                icon={<QuestionCircleOutlined style={{ color: 'red' }} />}
                okText={'Remove'}
                cancelText={'Cancel'}
                okType={'danger'}
              >
                <Button style={{ marginLeft: '8px' }} danger ghost>
                  Remove
                </Button>
              </ModalConfirm>
            </span>
          );
        },
      },
    ];

    let databaseList = this.memDatabaseConnectors(false)(this.props.databaseConnectors);
    let databaseOptionsList = this.memDatabaseConnectorOptions(false)(this.props.databaseConnectorOptions);
    let applicationOptionsList = this.memApplicationConnectorOptions(false)(this.props.applicationConnectorOptions);
    let fileOptionsList = this.memFileConnectorOptions(false)(this.props.fileConnectorOptions);
    let fileList = this.memFileConnectors(false)(this.props.fileConnectors);
    let applicationList = this.memApplicationConnectors(false)(this.props.applicationConnectors);
    let streamingOptionsList = this.memStreamingConnectorOptions(false)(this.props.streamingConnectorOptions);
    let streamingList = this.memStreamingConnectors(false)(this.props.streamingConnectors);

    const storageColumns: ITableExtColumn[] = [
      {
        field: 'databaseConnectorId',
        title: 'Database Connector ID',
        isLinked: true,
        render: (text, row, index) => {
          return <CopyText>{text}</CopyText>;
        },
      },
      {
        field: 'serviceName',
        title: 'Service',
        isLinked: true,
      },
      {
        field: 'name',
        title: 'Connection Name',
      },
      {
        field: 'status',
        title: 'Status',
      },
      {
        width: '380px',
        noAutoTooltip: true,
        noLink: true,
        title: 'Actions',
        render: (text, row, index) => {
          let showVerify = row.status != 'ACTIVE';
          return (
            <span
              css={`
                display: flex;
                gap: 12px;
                flex-wrap: wrap;
              `}
            >
              <Button type={'default'} ghost onClick={this.onClickRenameDatabaseConnector.bind(this, row?.databaseConnectorId, row?.name)}>
                Rename
              </Button>
              <Button type={'default'} ghost onClick={this.onClickConfig.bind(this, row?.service, row?.auth, fileOptionsList, databaseOptionsList, applicationOptionsList, streamingOptionsList, row?.databaseConnectorId, null, null)}>
                Configuration
              </Button>
              {showVerify && (
                <Button type={'default'} ghost onClick={this.onClickDatabaseVerify.bind(this, row.databaseConnectorId)}>
                  Verify
                </Button>
              )}
              <ModalConfirm
                onConfirm={this.onClickDeleteDatabase.bind(this, row)}
                title={`Do you want to remove access to '${row.service}'?`}
                icon={<QuestionCircleOutlined style={{ color: 'red' }} />}
                okText={'Remove'}
                cancelText={'Cancel'}
                okType={'danger'}
              >
                <Button danger ghost>
                  Remove
                </Button>
              </ModalConfirm>
            </span>
          );
        },
      },
    ];

    const applicationColumns: ITableExtColumn[] = [
      {
        field: 'applicationConnectorId',
        title: 'Application Connector ID',
        isLinked: true,
        render: (text, row, index) => {
          return <CopyText>{text}</CopyText>;
        },
      },
      {
        field: 'serviceName',
        title: 'Service',
        isLinked: true,
      },
      {
        field: 'name',
        title: 'Connection Name',
      },
      {
        field: 'status',
        title: 'Status',
      },
      {
        width: '380px',
        noAutoTooltip: true,
        noLink: true,
        title: 'Actions',
        render: (text, row, index) => {
          let showVerify = row.status != 'ACTIVE';
          return (
            <span
              css={`
                display: flex;
                gap: 12px;
                flex-wrap: wrap;
              `}
            >
              <Button type={'default'} ghost onClick={this.onClickRenameApplicationConnector.bind(this, row?.applicationConnectorId, row?.name)}>
                Rename
              </Button>
              <Button type={'default'} ghost onClick={this.onClickConfig.bind(this, row?.service, row?.auth, fileOptionsList, databaseOptionsList, applicationOptionsList, streamingOptionsList, null, row?.applicationConnectorId, null)}>
                Configuration
              </Button>
              {showVerify && (
                <Button type={'default'} ghost onClick={this.onClickApplicationVerify.bind(this, row.applicationConnectorId)}>
                  Verify
                </Button>
              )}
              <ModalConfirm
                onConfirm={this.onClickDeleteApplication.bind(this, row)}
                title={`Do you want to remove access to '${row.service}'?`}
                icon={<QuestionCircleOutlined style={{ color: 'red' }} />}
                okText={'Remove'}
                cancelText={'Cancel'}
                okType={'danger'}
              >
                <Button danger ghost>
                  Remove
                </Button>
              </ModalConfirm>
            </span>
          );
        },
      },
    ];

    const streamingColumns: ITableExtColumn[] = [
      {
        field: 'streamingConnectorId',
        title: 'Streaming Connector ID',
        isLinked: true,
        render: (text, row, index) => {
          return <CopyText>{text}</CopyText>;
        },
      },
      {
        field: 'serviceName',
        title: 'Service',
        isLinked: true,
      },
      {
        field: 'name',
        title: 'Connection Name',
      },
      {
        field: 'status',
        title: 'Status',
      },
      {
        width: '380px',
        noAutoTooltip: true,
        noLink: true,
        title: 'Actions',
        render: (text, row, index) => {
          let showVerify = row.status != 'ACTIVE';
          return (
            <span
              css={`
                display: flex;
                gap: 12px;
                flex-wrap: wrap;
              `}
            >
              <Button type={'default'} ghost onClick={this.onClickRenameStreamingConnector.bind(this, row?.streamingConnectorId, row?.name)}>
                Rename
              </Button>
              <Button type={'default'} ghost onClick={this.onClickConfig.bind(this, row?.service, row?.auth, fileOptionsList, databaseOptionsList, applicationOptionsList, streamingOptionsList, null, null, row?.streamingConnectorId)}>
                Configuration
              </Button>
              {showVerify && (
                <Button type={'default'} ghost onClick={this.onClickStreamingVerify.bind(this, row.streamingConnectorId)}>
                  Verify
                </Button>
              )}
              <ModalConfirm
                onConfirm={this.onClickDeleteStreaming.bind(this, row)}
                title={`Do you want to remove access to '${row.service}'?`}
                icon={<QuestionCircleOutlined style={{ color: 'red' }} />}
                okText={'Remove'}
                cancelText={'Cancel'}
                okType={'danger'}
              >
                <Button danger ghost>
                  Remove
                </Button>
              </ModalConfirm>
            </span>
          );
        },
      },
    ];

    let resInst = this.state.resInstructions;
    let authOptions = null;
    if (resInst && resInst.authOptions) {
      let source = resInst.service.toLowerCase();
      let tabsHH = 280;
      tabsHH = Math.max(tabsHH, Math.trunc((this.state.dimensions?.height ?? 0) * 0.4));

      authOptions = [];
      if (source === 's3') {
        resInst.authOptions.some((a1, ind) => {
          authOptions.push(
            <TabPane tab={'Verification Method ' + (ind + 1)} key={'' + ind} forceRender={true}>
              <div style={{ position: 'relative', height: tabsHH + 'px' }}>
                <NanoScroller onlyVertical={true}>
                  <div>
                    <div style={{ marginTop: '5px' }}>
                      <b>Navigate to the AWS Console</b>:{' '}
                      <a href={a1.url} rel={'noreferrer noopener'} target={'_blank'}>
                        {a1.url}
                      </a>
                    </div>
                    {a1.accountId && (
                      <div style={{ marginTop: '5px' }}>
                        <b>Account ID</b>: {a1.accountId}
                      </div>
                    )}
                    {a1.externalId && (
                      <div style={{ marginTop: '5px' }}>
                        <b>External ID</b>: {a1.externalId}
                      </div>
                    )}
                    {a1.bucketPolicy && (
                      <div style={{ marginTop: '5px' }}>
                        <b>Attach Bucket Policy</b>: <pre>{JSON.stringify(Utils.tryJsonParse(a1.bucketPolicy) ?? '', undefined, 2)}</pre>
                      </div>
                    )}
                    {a1.kmsPolicy && (
                      <div style={{ marginTop: '5px' }}>
                        If your bucket uses a KMS encryption key, you must also grant Abacus.AI access to the key to decrypt the files.
                        <br />
                        <b>Attach the Key Policy to your KMS Key</b>: <pre>{JSON.stringify(Utils.tryJsonParse(a1.kmsPolicy) ?? '', undefined, 2)}</pre>
                      </div>
                    )}
                    {a1.rolePolicy && (
                      <div style={{ marginTop: '5px' }}>
                        <b>Role Policy</b>: <pre>{JSON.stringify(Utils.tryJsonParse(a1.rolePolicy) ?? '', undefined, 2)}</pre>
                      </div>
                    )}
                    {a1.roleTrustRelationship && (
                      <div style={{ marginTop: '5px' }}>
                        <b>Role Trust Relationship</b>: <pre>{JSON.stringify(Utils.tryJsonParse(a1.roleTrustRelationship) ?? '', undefined, 2)}</pre>
                      </div>
                    )}
                  </div>
                </NanoScroller>
              </div>
            </TabPane>,
          );
        });
      } else if (source === 'gcs') {
        resInst.authOptions.some((a1, ind) => {
          authOptions.push(
            <TabPane tab={'Verification Method ' + (ind + 1)} key={'' + ind} forceRender={true}>
              <div style={{ position: 'relative', height: tabsHH + 'px' }}>
                <NanoScroller onlyVertical={true}>
                  <div>
                    <div style={{ marginTop: '5px' }}>
                      <b>Navigate to the Google Cloud Console</b>:{' '}
                      <a href={a1.url} rel={'noreferrer noopener'} target={'_blank'}>
                        {a1.url}
                      </a>
                    </div>
                    <div style={{ marginTop: '5px' }}>
                      <b>
                        {'"'}Permissions{'"'} -{'>'} {'"'}Add members{'"'}
                      </b>
                    </div>
                    {a1.email && (
                      <div style={{ marginTop: '5px' }}>
                        <b>Add the {Constants.flags.product_name} Service Account</b>: {a1.email}
                      </div>
                    )}
                    {a1.roles && (
                      <div style={{ marginTop: '5px' }}>
                        <b>Give the {Constants.flags.product_name} the following Roles</b>: {'"'}
                        {a1.roles.join('", "')}
                        {'"'}
                      </div>
                    )}
                  </div>
                </NanoScroller>
              </div>
            </TabPane>,
          );
        });
      } else if (source === 'azure') {
        resInst.authOptions.some((a1, ind) => {
          authOptions.push(
            <TabPane tab={'Verification Method ' + (ind + 1)} key={'' + ind} forceRender={true}>
              <div style={{ position: 'relative', height: tabsHH + 'px' }}>
                <NanoScroller onlyVertical={true}>
                  <div>
                    <div style={{ marginTop: '5px' }}>
                      <b>Navigate to the Azure Blob Storage Console</b>:{' '}
                      <a href={a1.url} rel={'noreferrer noopener'} target={'_blank'}>
                        {a1.url}
                      </a>
                    </div>
                    <div style={{ marginTop: '5px' }}>
                      <b>Click on your Storage Account</b>
                    </div>
                    <div style={{ marginTop: '5px' }}>
                      <b>
                        Open the {'"'}Shared access signature{'"'} pane under {'"'}Settings{'"'}
                      </b>
                    </div>
                    <div style={{ marginTop: '5px' }}>
                      <b>
                        Grant {'"'}Blob{'"'} under {'"'}Allowed Services{'"'}
                      </b>
                    </div>
                    <div style={{ marginTop: '5px' }}>
                      <b>
                        Grant {'"'}Container{'"'} and {'"'}Object{'"'} under {'"'}Allowed resource types{'"'}
                      </b>
                    </div>
                    <div style={{ marginTop: '5px' }}>
                      <b>
                        Grant {'"'}
                        {a1.permissions.join('", "')}
                        {'"'} under {'"'}Permissions{'"'}
                      </b>
                    </div>
                    <div style={{ marginTop: '5px' }}>
                      <b>Set the expiration time; once the time expires, you{"'"}ll need to redo these steps.</b>
                    </div>
                    <div style={{ marginTop: '5px' }}>
                      <b>
                        Click {'"'}Generate SAS and connection string{'"'}
                      </b>
                    </div>
                    <div style={{ marginTop: '5px' }}>
                      <b>
                        Copy the {'"'}Connection string{'"'} and paste it below
                      </b>
                    </div>
                  </div>
                </NanoScroller>
              </div>
            </TabPane>,
          );
        });
      }
    }

    return (
      <div style={{}}>
        <WindowResizeListener onResize={this.onResize} />

        <div style={{ fontSize: '16px', margin: '4px 0', textAlign: 'right' }}>
          <Connectors
            refSelf={(r1) => {
              this.connectors = r1;
            }}
            isRefreshingChange={this.isRefreshingChange}
          />
        </div>

        <div>
          <span onClick={this.onChangeTabs.bind(this, '0')}>
            <StyleTabOne isSelected={this.state.isTabDatabaseConnectors === true}>{'Database Connector' + (databaseList?.length === 1 ? '' : 's') + (databaseList?.length ? ' (' + databaseList.length + ')' : '')}</StyleTabOne>
          </span>
          <span onClick={this.onChangeTabs.bind(this, '1')}>
            <StyleTabOne isSelected={this.state.isTabFileConnectors === true}>{'File Connector' + (fileList?.length === 1 ? '' : 's') + (fileList?.length ? ' (' + fileList.length + ')' : '')}</StyleTabOne>
          </span>
          <span onClick={this.onChangeTabs.bind(this, '2')}>
            <StyleTabOne isSelected={this.state.isTabApplicationConnectors === true}>{'Application Connector' + (applicationList?.length === 1 ? '' : 's') + (applicationList?.length ? ' (' + applicationList.length + ')' : '')}</StyleTabOne>
          </span>
          <span onClick={this.onChangeTabs.bind(this, '3')}>
            <StyleTabOne isSelected={this.state.isTabStreamingConnectors === true}>{'Streaming Connector' + (streamingList?.length === 1 ? '' : 's') + (streamingList?.length ? ' (' + streamingList.length + ')' : '')}</StyleTabOne>
          </span>
        </div>

        <div
          css={`
            display: ${this.state.isTabDatabaseConnectors === true ? 'block' : 'none'};
          `}
        >
          <div style={{ margin: '40px 0' }}>
            <TableExt defaultSort={{ field: 'databaseConnectorId' }} notsaveSortState={'cloud_database_ownership_list'} dataSource={databaseList} columns={storageColumns} calcKey={(r1) => r1.databaseConnectorId} />
          </div>
        </div>
        <div
          css={`
            display: ${this.state.isTabFileConnectors === true ? 'block' : 'none'};
          `}
        >
          <div style={{ margin: '40px 0' }}>
            <TableExt defaultSort={{ field: 'bucket' }} notsaveSortState={'cloud_ownership_list'} dataSource={fileList} columns={fileColumns} calcKey={(r1) => r1.bucket} />
          </div>
        </div>
        <div
          css={`
            display: ${this.state.isTabApplicationConnectors === true ? 'block' : 'none'};
          `}
        >
          <div style={{ margin: '40px 0' }}>
            <TableExt defaultSort={{ field: 'applicationConnectorId' }} notsaveSortState={'cloud_application_ownership_list'} dataSource={applicationList} columns={applicationColumns} calcKey={(r1) => r1.applicationConnectorId} />
          </div>
        </div>
        <div
          css={`
            display: ${this.state.isTabStreamingConnectors === true ? 'block' : 'none'};
          `}
        >
          <div style={{ margin: '40px 0' }}>
            <TableExt defaultSort={{ field: 'streamingConnectorId' }} notsaveSortState={'cloud_streaming_ownership_list'} dataSource={streamingList} columns={streamingColumns} calcKey={(r1) => r1.streamingConnectorId} />
          </div>
        </div>
      </div>
    );
  }
}

export default connect(
  (state: any) => ({
    paramsProp: state.paramsProp,
    authUser: state.authUser,
    databaseConnectors: state.databaseConnectors,
    databaseConnectorOptions: state.databaseConnectorOptions,
    applicationConnectors: state.applicationConnectors,
    applicationConnectorOptions: state.applicationConnectorOptions,
    streamingConnectors: state.streamingConnectors,
    streamingConnectorOptions: state.streamingConnectorOptions,
    fileConnectorOptions: state.fileConnectorOptions,
    fileConnectors: state.fileConnectors,
  }),
  null,
)(CloudOwnership);
