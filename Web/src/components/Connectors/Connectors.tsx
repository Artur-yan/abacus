import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Button from 'antd/lib/button';
import Checkbox from 'antd/lib/checkbox';
import Form, { FormInstance } from 'antd/lib/form';
import Input from 'antd/lib/input';
import Steps from 'antd/lib/steps';
import Switch from 'antd/lib/switch';
import Tabs from 'antd/lib/tabs';
import color from 'color';
import _ from 'lodash';
import * as React from 'react';
import { CSSProperties } from 'react';
import { connect } from 'react-redux';
import { LightAsync as SyntaxHighlighter } from 'react-syntax-highlighter';
import dark from 'react-syntax-highlighter/dist/esm/styles/hljs/tomorrow-night';
import Utils, { calcStaticUrl } from '../../../core/Utils';
import REActions from '../../actions/REActions';
import REClient_ from '../../api/REClient';
import Constants from '../../constants/Constants';
import memoizeOne, { memoizeOneCurry } from '../../libs/memoizeOne';
import StoreActions from '../../stores/actions/StoreActions';
import applicationConnectorOptions from '../../stores/reducers/applicationConnectorOptions';
import applicationConnectors from '../../stores/reducers/applicationConnectors';
import databaseConnectorOptions from '../../stores/reducers/databaseConnectorOptions';
import databaseConnectors from '../../stores/reducers/databaseConnectors';
import fileConnectorOptions from '../../stores/reducers/fileConnectorOptions';
import fileConnectors from '../../stores/reducers/fileConnectors';
import streamingConnectorOptions from '../../stores/reducers/streamingConnectorOptions';
import streamingConnectors from '../../stores/reducers/streamingConnectors';
import CopyText from '../CopyText/CopyText';
import FormExt from '../FormExt/FormExt';
import HelpIcon from '../HelpIcon/HelpIcon';
import ModalAlert from '../ModalAlert/ModalAlert';
import NanoScroller from '../NanoScroller/NanoScroller';
import Oauth from '../Oauth/Oauth';
import SelectExt from '../SelectExt/SelectExt';
import WindowResizeListener from '../WindowResizeListener/WindowResizeListener';
const s = require('./Connectors.module.css');
const sd = require('../antdUseDark.module.css');
const { Step } = Steps;
const { TabPane } = Tabs;

interface IConnectorsProps {
  paramsProp?: any;
  databaseConnectors?: any;
  databaseConnectorOptions?: any;
  applicationConnectors?: any;
  applicationConnectorOptions?: any;
  streamingConnectors?: any;
  streamingConnectorOptions?: any;
  fileConnectorOptions?: any;
  fileConnectors?: any;
  refSelf?: (elem: any) => void;
  style?: CSSProperties;
  isRefreshingChange?: (isRef: boolean) => void;
  isFile?: boolean;
  isGit?: boolean;
}

interface IConnectorsState {
  isRefreshing?: boolean;
  resInstructions?: any;
  roleArn?: string;
  streamingConnectorId?: any;
  sasUrl?: string;
  usedBucket?: string;
  dimensions?: { width; height };
  askArn?: boolean;
  askSasUrl?: boolean;
  connectorInstructions?: any;
  service?: string;
  sandbox?: boolean;
  auth?: any;
  searchKey?: string;
  connectorType?: string;
  verify?: any;
  databaseConnectorId?: string;
  applicationConnectorId?: string;
  isTabFileConnectors?: boolean;
  prefixIndex?: number;
  filterIsFile?: boolean;
  filterIsGit?: boolean;
}

export const FileServicesList = ['AWS', 'GCS', 'AZURE', 'SFTP'];
export const GitServicesList = ['GIT'];

class Connectors extends React.PureComponent<React.PropsWithChildren<IConnectorsProps>, IConnectorsState> {
  private isM: boolean;
  private oauth_handler: Oauth;
  formRef = React.createRef<FormInstance>();
  formRef2 = React.createRef<FormInstance>();
  formRef3 = React.createRef<FormInstance>();

  constructor(props) {
    super(props);

    let windowWidth = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
    let windowHeight = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;

    this.state = {
      dimensions: { width: windowWidth, height: windowHeight },
      isRefreshing: false,
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
    this.memApplicationConnectorOptions(true)(this.props.applicationConnectorOptions);
    this.memStreamingConnectorOptions(true)(this.props.streamingConnectorOptions);
    this.memFileConnectorOptions(true)(this.props.fileConnectorOptions);
    this.memFileConnectors(true)(this.props.fileConnectors);
    this.memDatabaseConnectors(true)(this.props.databaseConnectors);
    this.memApplicationConnectors(true)(this.props.applicationConnectors);
    this.memStreamingConnectors(true)(this.props.streamingConnectors);
  };

  memDatabaseConnectorOptions = memoizeOneCurry((doCall, databaseConnectorOptionsParam) => {
    return databaseConnectorOptions.memDatabaseConnectorOptions(doCall, databaseConnectorOptionsParam);
  });

  memApplicationConnectorOptions = memoizeOneCurry((doCall, applicationConnectorOptionsParam) => {
    return applicationConnectorOptions.memApplicationConnectorOptions(doCall, applicationConnectorOptionsParam);
  });

  memStreamingConnectorOptions = memoizeOneCurry((doCall, streamingConnectorOptionsParam) => {
    return streamingConnectorOptions.memStreamingConnectorOptions(doCall, streamingConnectorOptionsParam);
  });

  memFileConnectorOptions = memoizeOneCurry((doCall, fileConnectorOptionsParam) => {
    return fileConnectorOptions.memFileConnectorOptions(doCall, fileConnectorOptionsParam);
  });

  memFileConnectors = memoizeOneCurry((doCall, fileConnectorsParam) => {
    return fileConnectors.memFileConnectors(doCall, fileConnectorsParam);
  });

  memDatabaseConnectors = memoizeOneCurry((doCall, databaseConnectorsParam) => {
    return databaseConnectors.memDatabaseConnectors(doCall, databaseConnectorsParam);
  });

  memApplicationConnectors = memoizeOneCurry((doCall, applicationConnectorsParam) => {
    return applicationConnectors.memApplicationConnectors(doCall, applicationConnectorsParam);
  });

  memStreamingConnectors = memoizeOneCurry((doCall, streamingConnectorsParam) => {
    return streamingConnectors.memStreamingConnectors(doCall, streamingConnectorsParam);
  });

  refreshList = () => {
    StoreActions.getDatabaseConnectorOptions();
    StoreActions.getFileConnectorOptions();
    StoreActions.getApplicationConnectorOptions();
    StoreActions.getStreamingConnectorOptions();
    StoreActions.getFileConnectors();
    StoreActions.getDatabaseConnectors();
    StoreActions.getApplicationConnectors();
    StoreActions.getStreamingConnectors();
  };

  componentDidMount() {
    this.isM = true;
    this.oauth_handler = new Oauth();
    this.refreshList();

    this.props.refSelf?.(this);
  }

  componentWillUnmount() {
    this.props.refSelf?.(null);
    this.isM = false;
  }

  componentDidUpdate(prevProps: Readonly<IConnectorsProps>, prevState: Readonly<IConnectorsState>, snapshot?: any): void {
    this.doMem();
  }

  handleSubmitChangeArn = (values) => {
    let bucket = this.state.usedBucket;
    let arn = values.arn;

    REClient_.client_().addExternalBucketAWSRole(bucket, arn, (errInvite, resInvite) => {
      if (errInvite || !resInvite) {
        REActions.addNotificationError(errInvite || Constants.errorDefault);
      } else {
        // @ts-ignore
        this.refs.modalInst.close();

        this.refreshList();
        this.formRef?.current?.resetFields?.();
        REActions.addNotification('Bucket added!');
      }
    });
  };

  handleSubmitChangeSasUrl = (values) => {
    let bucket = this.state.usedBucket;
    let connectionString = values.connectionString;

    REClient_.client_().setAzureBlobConnectionString(bucket, connectionString, (errInvite, resInvite) => {
      if (errInvite || !resInvite) {
        REActions.addNotificationError(errInvite || Constants.errorDefault);
      } else {
        // @ts-ignore
        this.refs.modalInst.close();

        this.refreshList();
        this.formRef?.current?.resetFields?.();
        REActions.addNotification('Connection String Updated');
      }
    });
  };

  handleSubmitBucket = (values) => {
    let bucket = values.bucket;
    if (!bucket.startsWith(values.prefix.label)) {
      bucket = values.prefix.label + values.bucket;
    }
    this.setState(
      {
        usedBucket: bucket,
      },
      () => {
        // @ts-ignore
        this.refs.modalDatabaseInst.close();

        this.refreshList();
        this.formRef2?.current?.resetFields?.();
        this.onClickInstructions(bucket, false, '', null);
      },
    );
  };

  handleSubmitDatabase = (options, isCreate, values) => {
    // let bucket = values.bucket;
    this.setState({
      isRefreshing: true,
    });
    this.props.isRefreshingChange?.(true);

    if (!isCreate) {
      values['databaseConnectorId'] = this.state.databaseConnectorId;
    }
    Object.keys(values).forEach((key) => {
      if (typeof values[key] === 'object') values[key] = values[key].value;
    });
    REClient_.client_()._genericEndpoint(isCreate ? options.configurationEndpoint : options.updateEndpoint, values, (err, res) => {
      if (err || !res) {
        REActions.addNotificationError(err || Constants.errorDefault);
        this.setState({
          isRefreshing: false,
        });
        this.props.isRefreshingChange?.(false);
      } else {
        this.refreshList();
        this.setState({
          isRefreshing: false,
          verify: res.result?.auth,
          auth: res.result?.auth,
        });
        if (!Utils.isNullOrEmpty(res.result?.databaseConnectorId)) {
          this.setState({
            databaseConnectorId: res.result?.databaseConnectorId,
          });
        }
        this.props.isRefreshingChange?.(false);
      }
    });
  };

  handleSubmitApplication = (options, isCreate, values) => {
    this.setState({
      isRefreshing: true,
    });
    this.props.isRefreshingChange?.(true);

    if (!isCreate) {
      values['applicationConnectorId'] = this.state.applicationConnectorId;
    }
    REClient_.client_()._genericEndpoint(isCreate ? options.configurationEndpoint : options.updateEndpoint, values, (err, res) => {
      if (err || !res) {
        REActions.addNotificationError(err || Constants.errorDefault);
        this.setState({
          isRefreshing: false,
        });
        this.props.isRefreshingChange?.(false);
      } else {
        this.refreshList();
        this.setState({
          isRefreshing: false,
          verify: res.result?.auth,
          auth: res.result?.auth,
        });
        if (!Utils.isNullOrEmpty(res.result?.applicationConnectorId)) {
          this.setState({
            applicationConnectorId: res.result?.applicationConnectorId,
          });
        }
        this.props.isRefreshingChange?.(false);
      }
    });
  };

  handleSubmitStreaming = (options, isCreate, values) => {
    this.setState({
      isRefreshing: true,
    });
    this.props.isRefreshingChange?.(true);

    if (!isCreate) {
      values['streamingConnectorId'] = this.state.streamingConnectorId;
    }
    Object.keys(values).forEach((key) => {
      if (typeof values[key] === 'object') values[key] = values[key].value;
    });
    REClient_.client_()._genericEndpoint(isCreate ? options.configurationEndpoint : options.updateEndpoint, values, (err, res) => {
      if (err || !res) {
        REActions.addNotificationError(err || Constants.errorDefault);
        this.setState({
          isRefreshing: false,
        });
        this.props.isRefreshingChange?.(false);
      } else {
        this.refreshList();
        this.setState({
          isRefreshing: false,
          verify: res.result?.auth,
          auth: res.result?.auth,
        });
        if (!Utils.isNullOrEmpty(res.result?.streamingConnectorId)) {
          this.setState({
            streamingConnectorId: res.result?.streamingConnectorId,
          });
        }
        this.props.isRefreshingChange?.(false);
      }
    });
  };

  onClickDelete = (row, e) => {
    e && e.preventDefault();

    if (row && row.bucket) {
      this.setState({
        isRefreshing: true,
      });
      this.props.isRefreshingChange?.(true);

      REClient_.client_().removeExternalBucket(row.bucket, (err, res) => {
        this.setState({
          isRefreshing: false,
        });
        this.props.isRefreshingChange?.(false);

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
      this.props.isRefreshingChange?.(true);

      REClient_.client_().removeDatabaseConnector(row.databaseConnectorId, (err, res) => {
        this.setState({
          isRefreshing: false,
        });
        this.props.isRefreshingChange?.(false);

        if (err || !res) {
          REActions.addNotificationError(err || Constants.errorDefault);
        } else {
          REActions.addNotification('Database Connector Removed');
          this.refreshList();
        }
      });
    }
  };

  onClickConfig = (service, auth, fileOptions, databaseOptions, applicationOptions, streamingOptions, databaseConnectorId, applicationConnectorId, streamingConnectorId, e) => {
    if (service.toLowerCase() in fileOptions) {
      this.setState(
        {
          service,
          sandbox: auth?.sandbox,
        },
        () => {
          // @ts-ignore
          this.refs.modalDatabaseInst.open();
        },
      );
    } else if (service.toLowerCase() in applicationOptions) {
      this.setState({
        isRefreshing: true,
      });
      this.props.isRefreshingChange?.(true);

      REClient_.client_().getApplicationConnectorInstructions(service, (err, res) => {
        this.setState({
          isRefreshing: false,
        });
        this.props.isRefreshingChange?.(false);

        if (err || !res) {
          REActions.addNotificationError(err || Constants.errorDefault);
        } else {
          if (e == null) {
            this.refreshList();
          }

          res = res?.result;

          if (res) {
            this.setState(
              {
                connectorInstructions: res,
                service,
                sandbox: auth?.sandbox,
                auth,
                applicationConnectorId,
                verify: applicationOptions[service.toLowerCase()].oauthConfig ? null : auth,
              },
              () => {
                // @ts-ignore
                this.refs.modalDatabaseInst.open();
              },
            );
          }
        }
      });
    } else if (service.toLowerCase() in streamingOptions) {
      this.setState({
        isRefreshing: true,
      });
      this.props.isRefreshingChange?.(true);

      REClient_.client_().getStreamingConnectorInstructions(service, (err, res) => {
        this.setState({
          isRefreshing: false,
        });
        this.props.isRefreshingChange?.(false);

        if (err || !res) {
          REActions.addNotificationError(err || Constants.errorDefault);
        } else {
          if (e == null) {
            this.refreshList();
          }

          res = res?.result;

          if (res) {
            this.setState(
              {
                connectorInstructions: res,
                service,
                sandbox: auth?.sandbox,
                auth,
                streamingConnectorId,
                verify: streamingOptions[service.toLowerCase()].oauthConfig ? null : auth,
              },
              () => {
                // @ts-ignore
                this.refs.modalDatabaseInst.open();
              },
            );
          }
        }
      });
    } else {
      this.setState({
        isRefreshing: true,
      });
      this.props.isRefreshingChange?.(true);

      REClient_.client_().getDatabaseConnectorInstructions(service, auth == null ? null : JSON.stringify(auth), (err, res) => {
        this.setState({
          isRefreshing: false,
        });
        this.props.isRefreshingChange?.(false);

        if (err || !res) {
          REActions.addNotificationError(err || Constants.errorDefault);
        } else {
          if (e == null) {
            this.refreshList();
          }

          res = res?.result;

          if (res) {
            this.setState(
              {
                connectorInstructions: res,
                service,
                sandbox: auth?.sandbox,
                auth,
                databaseConnectorId,
                verify: databaseOptions[service.toLowerCase()].oauthConfig ? null : auth,
              },
              () => {
                // @ts-ignore
                this.refs.modalDatabaseInst.open();
              },
            );
          }
        }
      });
    }
  };

  onUpdateSwitch = (val, key, forceRefresh) => {
    this.formRef3?.current?.setFieldsValue?.({ [key]: val });
    if (forceRefresh) {
      this.onUpdateForceRefreshConfig(val);
    }
  };

  onUpdateForceRefreshConfig = (e) => {
    if (this.formRef3?.current == null) {
      return;
    }
    this.setState({
      isRefreshing: true,
    });
    setTimeout(() => {
      let formValues = this.formRef3?.current?.getFieldsValue?.();
      let currentAuth = {};
      Object.keys(formValues ?? {}).forEach((key) => {
        currentAuth[key] = formValues[key]?.value || formValues[key];
      });
      REClient_.client_().getDatabaseConnectorInstructions(this.state.service, JSON.stringify(currentAuth), (err, res) => {
        this.setState({
          isRefreshing: false,
        });
        this.props.isRefreshingChange?.(false);

        if (err || !res) {
          REActions.addNotificationError(err || Constants.errorDefault);
        } else {
          if (e == null) {
            this.refreshList();
          }

          res = res?.result;

          if (res) {
            this.setState(
              {
                connectorInstructions: res,
              },
              () => {},
            );
          }
        }
      });
    }, 0);
  };

  onClickNewDatabaseConnection = (e) => {
    e && e.preventDefault();
    e && e.stopPropagation();
    this.setState(
      {
        connectorInstructions: null,
        service: null,
        sandbox: false,
        auth: null,
        filterIsFile: this.props.isFile ?? null,
        filterIsGit: this.props.isGit ?? null,
      },
      () => {
        // @ts-ignore
        this.refs.modalDatabaseInst.open();
      },
    );
  };

  paramAddAuto = (addService, isFile = null, isGit = null) => {
    if (Utils.isNullOrEmpty(addService)) {
      return;
    }

    this.setState(
      {
        filterIsFile: isFile,
        filterIsGit: isGit,
      },
      () => {
        let fileOptions = this.memFileConnectorOptions(false)(this.props.fileConnectorOptions);
        let databaseOptions = this.memDatabaseConnectorOptions(false)(this.props.databaseConnectorOptions);
        let applicationOptions = this.memApplicationConnectorOptions(false)(this.props.applicationConnectorOptions);
        let streamingOptions = this.memStreamingConnectorOptions(false)(this.props.streamingConnectorOptions);
        if (fileOptions && databaseOptions && applicationOptions && streamingOptions) {
          if (!Utils.isNullOrEmpty(addService)) {
            this.setState(
              {
                connectorInstructions: null,
                service: null,
                sandbox: false,
                auth: null,
              },
              () => {
                this.onClickConfig(addService.toUpperCase(), null, fileOptions, databaseOptions, applicationOptions, streamingOptions, null, null, null, null);
              },
            );
          }
        }
      },
    );
  };

  onClickInstructions = (bucket, writePermission, roleArn, e) => {
    e && e.preventDefault();
    e && e.stopPropagation();

    if (bucket) {
      this.setState({
        isRefreshing: true,
      });
      this.props.isRefreshingChange?.(true);

      REClient_.client_().getExternalBucketOwnershipTest(bucket, writePermission, (err, res) => {
        this.setState({
          isRefreshing: false,
        });
        this.props.isRefreshingChange?.(false);

        if (err || !res) {
          REActions.addNotificationError(err || Constants.errorDefault);
        } else {
          if (e == null) {
            this.refreshList();
          }

          res = res?.result;

          if (res) {
            this.setState(
              {
                resInstructions: res,
                usedBucket: bucket,
                roleArn: roleArn,
                sasUrl: roleArn,
              },
              () => {
                // @ts-ignore
                this.onChangeTabs('0');
                // @ts-ignore
                this.refs.modalInst.open();
              },
            );
          }
        }
      });
    }
  };

  renderAuthPrompts: (prompts?, auth?, serviceConfig?, isCreate?) => { res; initValues } = (prompts, auth, serviceConfig, isCreate) => {
    let initValues: any = {};
    if (auth != null) {
      initValues = { ...auth };
    }

    let rendered = [];
    // let serviceImage = calcStaticUrl('app/imgs/' + serviceConfig?.logo);
    let addButton = false;
    if (auth == null) {
      // @ts-ignore
      rendered.push(
        <Button
          key={'button1'}
          css={`
            position: absolute;
            top: calc(100% + 14px);
            left: 10px;
          `}
          onClick={() => this.setState({ service: null, sandbox: false })}
          type={'secondary' as any}
          style={{ marginTop: '5px', marginBottom: '5px', backgroundColor: 'rgba(209, 228, 245, 0.2)', borderRadius: '3px', color: 'white', border: 'none' }}
        >
          Back
        </Button>,
      );
    }
    prompts?.forEach((prompt) => {
      let help_icon = (
        <span>
          <HelpIcon isModal={true} tooltipText={prompt.description} />
        </span>
      );
      switch (prompt.type) {
        case 'oAuthButton':
          let oauthConfig = serviceConfig.oauthConfig;
          let oauthCallbackFunction = (token) => {
            const callbackValues = { [prompt.value]: token };
            if (this.state?.sandbox) {
              callbackValues['sandbox'] = true;
            }
            this.doOauthSignin(serviceConfig.configurationEndpoint, callbackValues);
          };
          let onClickHandler = (e) => {
            let url = oauthConfig.url;
            let extras = [...(oauthConfig.extras ?? [])];
            if (this.state?.sandbox) {
              url = oauthConfig.sandboxUrl;
              extras.push('state=sandbox');
            }
            this.oauth_handler.openOauth(url, oauthConfig.clientId, oauthConfig.scopes, extras, oauthCallbackFunction);
          };

          let icon1 = oauthConfig.icon;
          if (icon1 != null && _.isString(icon1)) {
            if (_.startsWith(icon1?.toLowerCase(), 'fa') && icon1?.[2] === icon1?.[2]?.toUpperCase()) {
              icon1 = icon1.substring(2);
              icon1 = icon1.toLowerCase();
            }
          }

          rendered.push(
            <div id={serviceConfig.name + 'connect_container'} key={prompt.value} style={{ width: '300px', margin: '10px auto' }}>
              {oauthConfig?.supportsSandbox && (
                <Checkbox
                  key={prompt.value + '_checkbox'}
                  onChange={(e) => {
                    this.setState({ sandbox: e.target.checked });
                  }}
                  checked={this.state?.sandbox}
                >
                  <span style={{ color: Utils.colorAall(1) }}>
                    {oauthConfig?.sandboxTitle}
                    <HelpIcon isModal={true} tooltipText={oauthConfig?.sandboxTooltip} />
                  </span>
                </Checkbox>
              )}
              <div id={serviceConfig.name + 'connect'} key={prompt.value + '_button'} style={{ marginTop: '10px' }} onClick={onClickHandler}>
                <div className={s.connectButton}>
                  <span className={s.connectIcon}>
                    <FontAwesomeIcon icon={['fab', icon1]} transform={{ size: 22, x: 6, y: 0 }} style={{ margin: '1px 5px 1px 1px', color: oauthConfig.color }} />
                  </span>
                  <span style={{ flex: 1, textAlign: 'center', color: oauthConfig.color, fontFamily: 'Roboto', fontSize: '12px', paddingRight: '6px', paddingTop: '1px' }}>
                    Connect {serviceConfig.name + (this.state?.sandbox ? ' Sandbox' : '')}
                  </span>
                </div>
              </div>
            </div>,
          );
          break;

        case 'text':
          addButton = true;
          rendered.push(
            <Form.Item
              style={{ width: '100%' }}
              className={sd.darkdate}
              name={prompt.value}
              key={'form_item_' + prompt.value}
              label={
                <span
                  css={`
                    text-transform: uppercase;
                    font-family: Roboto;
                    font-size: 12px;
                    font-weight: bold;
                    letter-spacing: 1.12px;
                    color: white;
                  `}
                >
                  {prompt.title}
                  {help_icon}
                </span>
              }
            >
              <Input style={{ width: '100%' }} placeholder={prompt.default} required={!prompt.optional} />
            </Form.Item>,
          );
          break;

        case 'secret':
          addButton = true;
          rendered.push(
            <Form.Item
              style={{ width: '100%' }}
              className={sd.darkdate}
              name={prompt.value}
              key={'form_item_' + prompt.value}
              label={
                <span
                  css={`
                    text-transform: uppercase;
                    font-family: Roboto;
                    font-size: 12px;
                    font-weight: bold;
                    letter-spacing: 1.12px;
                    color: white;
                  `}
                >
                  {prompt.title}
                  {help_icon}
                </span>
              }
            >
              <Input.Password style={{ width: '100%' }} placeholder={prompt.default} required={!prompt.optional && isCreate} />
            </Form.Item>,
          );
          break;

        case 'radio':
          addButton = true;
          rendered.push(
            <Form.Item
              style={{ width: '100%' }}
              className={sd.darkdate}
              name={prompt.value}
              key={'form_item_' + prompt.value}
              valuePropName="checked"
              label={
                <span
                  css={`
                    text-transform: uppercase;
                    font-family: Roboto;
                    font-size: 12px;
                    font-weight: bold;
                    letter-spacing: 1.12px;
                    color: white;
                  `}
                >
                  {prompt.title}
                  {help_icon}
                </span>
              }
            >
              <Switch
                checkedChildren="Yes"
                unCheckedChildren="No"
                onChange={(e) => this.onUpdateSwitch(e, prompt.value, prompt.refreshFormOnUpdate)}
                defaultChecked={auth?.[prompt.value] != undefined ? auth?.[prompt.value] : prompt.default}
              />
              ;
            </Form.Item>,
          );
          break;

        case 'enum':
          addButton = true;
          let options = [];
          let kkNames = Object.keys(prompt.names ?? {});
          kkNames?.some((k1) => {
            let v1 = prompt.names?.[k1];
            options.push({ label: v1, value: prompt.values?.[k1] });
          });

          initValues[prompt.value] = options?.find((o1) => o1.value === initValues[prompt.value]);
          rendered.push(
            <Form.Item
              style={{ width: '100%' }}
              className={sd.darkdate}
              name={prompt.value}
              key={'form_item_' + prompt.value}
              label={
                <span
                  css={`
                    text-transform: uppercase;
                    font-family: Roboto;
                    font-size: 12px;
                    font-weight: bold;
                    letter-spacing: 1.12px;
                    color: white;
                  `}
                >
                  {prompt.title}
                  {help_icon}
                </span>
              }
            >
              <SelectExt onChange={prompt.refreshFormOnUpdate ? this.onUpdateForceRefreshConfig : null} style={{ fontWeight: 400, color: Utils.colorA(1) }} options={options} />
            </Form.Item>,
          );
          break;

        default:
          break;
      }
    });
    if (addButton) {
      rendered.push(
        <Button key={'button22'} htmlType="submit" type={'primary'} style={{ width: '100%' }}>
          Save
        </Button>,
      );
    }
    return { res: rendered, initValues };
  };

  renderConnectorOptions(databaseOptions, fileOptions, applicationOptions, streamingOptions) {
    const { searchKey = '', connectorType } = this.state;
    if (databaseOptions === null || fileOptions === null || applicationOptions === null || streamingOptions === null) {
      return;
    }
    const combinedOptions = { ...databaseOptions, ...fileOptions, ...applicationOptions, ...streamingOptions };

    let list = Object.keys(combinedOptions ?? {})?.map((key) => {
      return {
        service: key.toUpperCase(),
        data: combinedOptions[key],
      };
    });

    if (this.state.filterIsFile != null) {
      const isIn = (v1) => {
        if (this.state.filterIsFile === true) {
          return FileServicesList.includes(v1?.service);
        } else {
          return !FileServicesList.includes(v1?.service);
        }
      };

      list = list?.filter((v1) => isIn(v1));
    }
    if (this.state.filterIsGit != null) {
      const isIn = (v1) => {
        if (this.state.filterIsGit === true) {
          return GitServicesList.includes(v1?.service);
        } else {
          return !GitServicesList.includes(v1?.service);
        }
      };

      list = list?.filter((v1) => isIn(v1));
    }

    let res = (
      <ul className={s.connector_list}>
        {list?.map(({ service, data }, ind1) => (
          <li key={'kk' + ind1} className={s.connector_list_item} onClick={this.onClickConfig.bind(this, service, null, fileOptions, databaseOptions, applicationOptions, streamingOptions, null, null, null)}>
            <img
              alt={''}
              src={calcStaticUrl('/static/imgs/' + data.logo)}
              css={`
                height: 25px;
                width: 70px;
                object-fit: contain;
                object-position: center;
              `}
            />
            <span
              css={`
                font-family: Roboto;
                font-size: 12px;
                font-weight: 500;
                line-height: 1.33;
                text-align: center;
                color: #bfc5d2;
                margin-top: 11px;
              `}
            >
              {data.name}
            </span>
          </li>
        ))}
      </ul>
    );

    return (
      <div
        css={`
          height: 300px;
          position: relative;
        `}
      >
        <NanoScroller onlyVertical noHide>
          {res}
        </NanoScroller>
      </div>
    );
  }

  renderConnectorForm(databaseOptionsList, applicationOptionsList, streamingOptionsList, connectorInstructions, currentServiceOptions, isCreate) {
    if (this.state.service?.toLowerCase() in databaseOptionsList) {
      let { res, initValues } = this.renderAuthPrompts(connectorInstructions, this.state.auth, currentServiceOptions, isCreate) ?? {};
      return (
        <FormExt layout={'vertical'} ref={this.formRef3} onFinish={this.handleSubmitDatabase.bind(this, currentServiceOptions, isCreate)} className="login-form" initialValues={initValues}>
          {res}
        </FormExt>
      );
    } else if (this.state.service?.toLowerCase() in applicationOptionsList) {
      let { res, initValues } = this.renderAuthPrompts(connectorInstructions, this.state.auth, currentServiceOptions, isCreate) ?? {};
      return (
        <FormExt layout={'vertical'} ref={this.formRef3} onFinish={this.handleSubmitApplication.bind(this, currentServiceOptions, isCreate)} className="login-form" initialValues={initValues}>
          {res}
        </FormExt>
      );
    } else if (this.state.service?.toLowerCase() in streamingOptionsList) {
      let { res, initValues } = this.renderAuthPrompts(connectorInstructions, this.state.auth, currentServiceOptions, isCreate) ?? {};
      return (
        <FormExt layout={'vertical'} ref={this.formRef3} onFinish={this.handleSubmitStreaming.bind(this, currentServiceOptions, isCreate)} className="login-form" initialValues={initValues}>
          {res}
        </FormExt>
      );
    } else {
      const onChangePrefixSel = (option1) => {
        this.setState({
          prefixIndex: option1.value ?? 0,
        });
      };
      const prefixOptions = currentServiceOptions?.prefixes?.map((x, index) => ({ label: x.prefix + '://', value: index }));
      const prefixSelector = (
        <span
          css={`
            display: inline-block;
            width: 160px;
          `}
        >
          {/*// @ts-ignore*/}
          <Form.Item noStyle name="prefix" style={{ width: 120 }} onChange={onChangePrefixSel}>
            <SelectExt options={prefixOptions} style={{ width: 120 }} onChange={onChangePrefixSel} />
          </Form.Item>
        </span>
      );

      return (
        <div>
          {/*// @ts-ignore*/}
          <Button
            css={`
              position: absolute;
              top: calc(100% + 14px);
              left: 10px;
            `}
            onClick={() => this.setState({ service: null, sandbox: false })}
            type={'secondary' as any}
            style={{ marginTop: '5px', marginBottom: '5px', backgroundColor: 'rgba(209, 228, 245, 0.2)', borderRadius: '3px', color: 'white', border: 'none' }}
          >
            Back
          </Button>
          <div style={{ marginTop: '50px', width: '600px', margin: '0 auto' }}>
            <div style={{ fontSize: '16px', margin: '4px 0' }}>Add new Bucket</div>
            <FormExt layout={'vertical'} ref={this.formRef2} onFinish={this.handleSubmitBucket.bind(this)} className="login-form" initialValues={{ bucket: '', prefix: prefixOptions?.[0] }}>
              <Form.Item name={'bucket'} rules={[{ required: true, message: 'Bucket required' }]} style={{ marginBottom: '10px' }} hasFeedback>
                <Input
                  css={`
                    & input {
                      height: 36px;
                    }
                  `}
                  placeholder={currentServiceOptions?.prefixes?.[this.state.prefixIndex ?? 0]?.example}
                  addonBefore={prefixSelector}
                />
              </Form.Item>
              <div style={{ marginTop: '20px' }}>
                <Button htmlType="submit" type={'primary'} style={{ width: '100%' }}>
                  Add Bucket
                </Button>
              </div>
            </FormExt>
          </div>
        </div>
      );
    }
  }

  renderVerifyDetails(instructions, isVerifiedService) {
    let styleCodeRoot: CSSProperties = {
      borderRadius: '4px',
      padding: '10px 14px',
    };

    return (
      <div
        css={`
          color: white;
        `}
        className={sd.codeSyntax}
      >
        {/*// @ts-ignore*/}
        <Button
          ghost
          className={sd.detailbuttonblueBorder}
          style={{ marginBottom: '4px' }}
          onClick={(e) => {
            this.setState({ verify: null });
          }}
        >
          <FontAwesomeIcon icon={['far', 'edit']} transform={{ size: 18, y: -1.5 }} style={{ marginRight: '6px' }} />
          Edit Details
        </Button>
        <SyntaxHighlighter
          css={`
            margin-top: 10px;
          `}
          language={'json'}
          style={dark}
          showLineNumbers={false}
          customStyle={styleCodeRoot}
          wrapLines={true}
        >
          {JSON.stringify(this.state.verify ?? '', undefined, 2)}
        </SyntaxHighlighter>
        <span className={sd.styleTextGreen}>Instructions</span>
        <ul
          css={`
            color: white;
            margin-top: 10px;
          `}
        >
          {instructions != null &&
            this.state.auth != null &&
            instructions?.map((instruction, instInd) => {
              Object.keys(this.state.auth)?.forEach((authItem) => {
                instruction = instruction
                  .replace(new RegExp('\\$' + authItem, 'g'), this.state.auth[authItem])
                  .replace(/\n/g, '\\n')
                  .replace(/\r/g, '\\r');
              });

              let copyText = null;
              if (instruction?.indexOf('```') > -1) {
                copyText = instruction?.match(/```([^`]+)```/g)?.[0];
                while (copyText != null && copyText !== '' && _.startsWith(copyText, '`')) {
                  copyText = copyText.substring(1);
                }
                while (copyText != null && copyText !== '' && _.endsWith(copyText, '`')) {
                  copyText = copyText.substring(0, copyText.length - 1);
                }

                instruction = instruction?.replace(/```/, '<h>')?.replace(/```/, '</h>');
              }

              let lighten1 = null;
              if (instruction != null && /^(\*\*\*([0-9.]+)\*\*\*)/g.test(instruction || '')) {
                instruction = instruction.substring(RegExp.$1?.length ?? 0);
                lighten1 = Utils.tryParseFloat(RegExp.$2, null);
              }

              return (
                <li key={'instr' + instInd}>
                  <div
                    css={`
                      background: ${lighten1 == null ? '#1d1f21' : color('#1d1f21').lighten(lighten1)};
                      padding: 10px 14px;
                      border-radius: 4px;
                      margin-bottom: 10px;
                    `}
                    style={styleCodeRoot}
                  >
                    {Utils.addLinksSpans(
                      instruction,
                      ['h'],
                      (tagName) => {
                        return `color: white; border-radius: 4px; background: #646413; padding: 0 3px;`;
                      },
                      ['h'],
                      (value) => {
                        return (
                          <CopyText noText iconColor={'white'}>
                            {value}
                          </CopyText>
                        );
                      },
                    )}
                  </div>
                </li>
              );
            })}
        </ul>
        <div
          css={`
            margin-top: 20px;
            text-align: center;
          `}
        >
          <div
            css={`
              font-size: 14px;
            `}
          >
            Status:
          </div>
          <div
            css={`
              font-weight: bold;
            `}
          >
            {isVerifiedService ? 'Verified' : 'Unverified'}
          </div>
          {!isVerifiedService && (
            <div
              css={`
                margin-top: 5px;
              `}
            >
              <Button
                style={{ marginLeft: '8px' }}
                type={'default'}
                ghost
                onClick={
                  this.state.streamingConnectorId
                    ? this.onClickStreamingVerify.bind(this, this.state.streamingConnectorId)
                    : this.state.databaseConnectorId
                    ? this.onClickDatabaseVerify.bind(this, this.state.databaseConnectorId)
                    : this.onClickApplicationVerify.bind(this, this.state.applicationConnectorId)
                }
              >
                Verify
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  onSwitch = (checked) => {
    this.setState({
      isRefreshing: true,
    });
    this.props.isRefreshingChange?.(true);

    REClient_.client_().getExternalBucketOwnershipTest(this.state.usedBucket, checked, (err, res) => {
      this.setState({
        isRefreshing: false,
      });
      this.props.isRefreshingChange?.(false);

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
      this.props.isRefreshingChange?.(true);

      REClient_.client_().verifyExternalBucket(row.bucket, (err, res) => {
        this.setState({
          isRefreshing: false,
        });
        this.props.isRefreshingChange?.(false);

        if (err || !res) {
          REActions.addNotificationError(err || Constants.errorDefault);
        } else if (!res?.result?.verified) {
          REActions.addNotificationError(Constants.flags.product_name + ' could not access this bucket');
        } else {
          this.refreshList();
        }
      });
    }
  };

  onClickDatabaseVerify = (databaseConnectorId, e) => {
    e && e.preventDefault();
    e && e.stopPropagation();

    if (!databaseConnectorId) {
      REActions.addNotificationError('Invalid Connector ID');
      return;
    }

    this.setState({
      isRefreshing: true,
    });
    this.props.isRefreshingChange?.(true);

    REClient_.client_().verifyExternalDatabase(databaseConnectorId, (err, res) => {
      this.setState({
        isRefreshing: false,
      });
      this.props.isRefreshingChange?.(false);

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
      REActions.addNotificationError('Invalid Connector ID');
      return;
    }

    this.setState({
      isRefreshing: true,
    });
    this.props.isRefreshingChange?.(true);

    REClient_.client_().verifyStreamingConnector(streamingConnectorId, (err, res) => {
      this.setState({
        isRefreshing: false,
      });
      this.props.isRefreshingChange?.(false);

      if (err || !res) {
        REActions.addNotificationError(err || Constants.errorDefault);
        // } else if(!res?.result?.verified) {
        //   REActions.addNotificationError(Constants.flags.product_name+' could not access this database');
      } else {
        this.refreshList();
      }
    });
  };

  onClickApplicationVerify = (applicationConnectorId, e) => {
    e && e.preventDefault();
    e && e.stopPropagation();

    if (!applicationConnectorId) {
      REActions.addNotificationError('Invalid Connector ID');
      return;
    }

    this.setState({
      isRefreshing: true,
    });
    this.props.isRefreshingChange?.(true);

    REClient_.client_().verifyApplicationConnector(applicationConnectorId, (err, res) => {
      this.setState({
        isRefreshing: false,
      });
      this.props.isRefreshingChange?.(false);

      if (err || !res) {
        REActions.addNotificationError(err || Constants.errorDefault);
        // } else if(!res?.result?.verified) {
        //   REActions.addNotificationError(Constants.flags.product_name+' could not access this database');
      } else {
        this.refreshList();
      }
    });
  };

  onClickDownloadFile = (e) => {
    //TODO
  };

  doOauthSignin = (endpoint, code_obj) => {
    if (code_obj != null) {
      this.setState({
        isRefreshing: true,
      });
      this.props.isRefreshingChange?.(true);

      REClient_.client_()._genericEndpoint(endpoint, code_obj, (err, res) => {
        this.setState({
          isRefreshing: false,
        });
        this.props.isRefreshingChange?.(false);

        if (err || !res) {
          REActions.addNotificationError(err || Constants.errorDefault);
        } else {
          // this.onClickDatabaseVerify(res?.result?.databaseConnectorId, null);
          this.refreshList();
          // @ts-ignore
          this.refs.modalDatabaseInst?.close();
        }
      });
    }
  };

  onChangeTabs = (key) => {
    let v1 = false;
    v1 = !!this.state.resInstructions?.authOptions[Utils.tryParseInt(key)]?.requiresArn;
    let v2 = true;
    v2 = !!this.state.resInstructions?.authOptions[Utils.tryParseInt(key)]?.requiresConnectionString;
    this.setState({
      askArn: v1,
      askSasUrl: v2,
      isTabFileConnectors: key === '1',
    });
  };

  memCurrentServiceOptions = memoizeOne((databaseList, databaseOptionsList, fileOptionsList, applicationList, applicationOptionsList, streamingList, streamingOptionsList, service) => {
    if (databaseOptionsList && fileOptionsList && applicationOptionsList && streamingOptionsList) {
      Object.keys(databaseList ?? {})?.some((k1) => {
        let obj = databaseList[k1];
        obj.serviceName = databaseOptionsList[obj.service.toLowerCase()]?.name || obj.service;
      });
      Object.keys(applicationList ?? {})?.some((k1) => {
        let obj = applicationList[k1];
        obj.serviceName = applicationOptionsList[obj.service.toLowerCase()]?.name || obj.service;
      });
      Object.keys(streamingList ?? {})?.some((k1) => {
        let obj = streamingList[k1];
        obj.serviceName = streamingOptionsList[obj.service.toLowerCase()]?.name || obj.service;
      });
      let allOptions = { ...databaseOptionsList, ...fileOptionsList, ...applicationOptionsList, ...streamingOptionsList };
      return allOptions[this.state.service?.toLowerCase()];
    }
  });

  render() {
    let databaseList = this.memDatabaseConnectors(false)(this.props.databaseConnectors);
    let applicationList = this.memApplicationConnectors(false)(this.props.applicationConnectors);
    let streamingList = this.memStreamingConnectors(false)(this.props.streamingConnectors);
    let databaseOptionsList = this.memDatabaseConnectorOptions(false)(this.props.databaseConnectorOptions);
    let applicationOptionsList = this.memApplicationConnectorOptions(false)(this.props.applicationConnectorOptions);
    let streamingOptionsList = this.memStreamingConnectorOptions(false)(this.props.streamingConnectorOptions);
    let fileOptionsList = this.memFileConnectorOptions(false)(this.props.fileConnectorOptions);
    let currentServiceOption = this.memCurrentServiceOptions(databaseList, databaseOptionsList, fileOptionsList, applicationList, applicationOptionsList, streamingList, streamingOptionsList, this.state.service);
    let showSelectService = this.state.auth == null;
    let currentStage = this.state.service ? (this.state.verify ? 2 : 1) : 0;

    let isVerifiedService = false;
    if (this.state.databaseConnectorId && databaseList?.find((c1) => c1?.databaseConnectorId === this.state.databaseConnectorId)?.status?.toUpperCase() === 'ACTIVE') {
      isVerifiedService = true;
    }

    if (this.state.applicationConnectorId && applicationList?.find((c1) => c1?.applicationConnectorId === this.state.applicationConnectorId)?.status?.toUpperCase() === 'ACTIVE') {
      isVerifiedService = true;
    }

    let resInst = this.state.resInstructions;
    let connectorInstructions = this.state.connectorInstructions;
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
              <div style={{ position: 'relative', height: tabsHH + 'px', color: 'white' }}>
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
              <div style={{ position: 'relative', height: tabsHH + 'px', color: 'white' }}>
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
                        <b>Add the {Constants.flags.product_name} Service Account</b>: <CopyText>{a1.email}</CopyText>{' '}
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
              <div style={{ position: 'relative', height: tabsHH + 'px', color: 'white' }}>
                <NanoScroller onlyVertical={true}>
                  <div>
                    <div style={{ marginTop: '5px' }}>
                      <b>Navigate to the Azure Blob Storage Console</b>:{' '}
                      <a href={a1.url} rel={'noreferrer noopener'} target={'_blank'}>
                        {a1.url}
                      </a>
                    </div>
                    <div style={{ marginTop: '5px' }}>
                      <b>Click on the bucket</b>: <b>{a1.bucket}</b>
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
                        {'"'} under {'"'}Allowed Permissions{'"'}
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
                  </div>
                </NanoScroller>
              </div>
            </TabPane>,
          );
        });
      }
    }
    return (
      <>
        <WindowResizeListener onResize={this.onResize} />
        <ModalAlert dontHideOnClick={true} ref="modalInst" title={'Instructions'} yesText={'Close'} dialogClass={s.width60 + ' ' + sd.modalAlertDark}>
          <div style={{ fontSize: '14px' }}>
            <div style={{ marginTop: '5px' }}>
              Write Permission <Switch onChange={this.onSwitch} defaultChecked={resInst?.writePermission} />{' '}
              <HelpIcon isModal tooltipText={'Enabling write permissions allows ' + Constants.flags.product_name + ' to write the results of Batch Predictions to this bucket.'} />
            </div>

            <div style={{ marginTop: '15px', marginBottom: '25px' }}>
              <Tabs defaultActiveKey="0" onChange={this.onChangeTabs}>
                {authOptions}
              </Tabs>
            </div>

            {this.state.askArn && (
              <FormExt layout={'vertical'} ref={this.formRef} onFinish={this.handleSubmitChangeArn} className="login-form" initialValues={{ arn: this.state.roleArn || '' }}>
                <Form.Item name={'arn'} rules={[{ required: true, message: 'ARN required!' }]} style={{ marginBottom: '10px' }} hasFeedback>
                  <Input placeholder={'ARN'} />
                </Form.Item>

                <div style={{ marginTop: '20px' }}>
                  <Button htmlType="submit" type={'primary'} style={{ width: '100%' }}>
                    Set/Update ARN
                  </Button>
                </div>
              </FormExt>
            )}

            {this.state.askSasUrl && (
              <FormExt layout={'vertical'} ref={this.formRef} onFinish={this.handleSubmitChangeSasUrl} className="login-form" initialValues={{ connectionString: this.state.sasUrl || '' }}>
                <span style={{ color: 'white' }}>Connection String or SAS Token</span>
                <Form.Item name={'connectionString'} rules={[{ required: true, message: 'Connection String Required' }]} style={{ marginBottom: '10px' }} hasFeedback>
                  <Input placeholder={'BlobEndpoint=https://<bucket>.blob.core.windows.net/...'} />
                </Form.Item>

                <div style={{ marginTop: '20px' }}>
                  <Button htmlType="submit" type={'primary'} style={{ width: '100%' }}>
                    Set/Update Connection String
                  </Button>
                </div>
              </FormExt>
            )}
          </div>
        </ModalAlert>
        <ModalAlert
          dontHideOnClick={true}
          ref="modalDatabaseInst"
          title={this.state.service ? currentServiceOption?.name + ' Configuration' : 'Select a Service'}
          yesText={this.state.verify ? 'Close' : 'Cancel'}
          dialogClass={s.width60 + ' ' + sd.modalAlertDark}
          onHideAlert={() => {
            this.setState({ verify: null, service: null, sandbox: false, filterIsFile: null });
          }}
        >
          <div style={{ fontSize: '14px' }}>
            <div
              css={`
                margin: 15px 20px 15px 15px;
              `}
            >
              {/*// @ts-ignore*/}
              {showSelectService ? (
                <Steps current={currentStage} className={sd.stepsDark} labelPlacement={'vertical'}>
                  <Step key={'select'} title={'Select a Service'} />
                  <Step key={'configure'} title={'Configure Service'} />
                  <Step key={'verify'} title={'Verify Service'} />
                </Steps>
              ) : null}
              <div
                css={`
                  margin-top: 20px;
                `}
              >
                {this.state.service
                  ? this.state.verify
                    ? this.renderVerifyDetails(currentServiceOption?.instructions, isVerifiedService)
                    : this.renderConnectorForm(databaseOptionsList, applicationOptionsList, streamingOptionsList, connectorInstructions, currentServiceOption, showSelectService)
                  : this.renderConnectorOptions(databaseOptionsList, fileOptionsList, applicationOptionsList, streamingOptionsList)}
              </div>
            </div>
          </div>
        </ModalAlert>

        <span style={this.props.style ?? { fontSize: '16px' }} onClick={this.onClickNewDatabaseConnection}>
          {this.props.children == null && <Button type={'primary'}>Add New Connector</Button>}
          {this.props.children}
        </span>
      </>
    );
  }
}

export default connect(
  (state: any) => ({
    paramsProp: state.paramsProp,
    authUser: state.authUser,
    applicationConnectors: state.applicationConnectors,
    applicationConnectorOptions: state.applicationConnectorOptions,
    streamingConnectors: state.streamingConnectors,
    streamingConnectorOptions: state.streamingConnectorOptions,
    databaseConnectors: state.databaseConnectors,
    databaseConnectorOptions: state.databaseConnectorOptions,
    fileConnectorOptions: state.fileConnectorOptions,
    fileConnectors: state.fileConnectors,
  }),
  null,
)(Connectors);
