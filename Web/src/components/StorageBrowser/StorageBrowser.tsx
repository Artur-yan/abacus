import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Button from 'antd/lib/button';
import Input from 'antd/lib/input';
import Popover from 'antd/lib/popover';
import Spin from 'antd/lib/spin';
import * as Immutable from 'immutable';
import _ from 'lodash';
import * as moment from 'moment';
import * as React from 'react';
import { CSSProperties } from 'react';
import { NativeTypes } from 'react-dnd-html5-backend';
import { connect } from 'react-redux';
import * as uuid from 'uuid';
import Utils from '../../../core/Utils';
import REActions from '../../actions/REActions';
import memoizeOne from '../../libs/memoizeOne';
import StoreActions from '../../stores/actions/StoreActions';
import DropFiles from '../DropFiles/DropFiles';
import NanoScroller from '../NanoScroller/NanoScroller';
import StorageFileOne, { calcNameWithoutUuid } from '../StorageFileOne/StorageFileOne';
const s = require('./StorageBrowser.module.css');
const { FILE } = NativeTypes;

export interface IStorageUploadOne {
  id?: string;
  usedFolder?: string;

  file?: any;
  name?: string;
  size?: number;
  percent?: number;
  isUploading?: boolean;
  isFinish?: boolean;
  error?: any;

  s3already?: boolean;
  s3url?: string;
  fileuuid?: string;
}

export interface IStorageFolderNode {
  key?: string;
  name?: string;
  folders?: IStorageFolderNode[];
  files?: IStorageFileNode[];
  isFetched?: boolean;
}

export interface IStorageFileNode {
  key?: string;
  name?: string;
  size?: number;
  date?: any;

  versions?: IStorageFileNode[];

  onClick?: (file: any) => void;
  onDoubleClick?: (file: any) => void;
}

export interface IStorageBrowserNode extends IStorageFileNode, IStorageFolderNode {
  isFolder?: boolean;
  folderName?: string;
}

interface IStorageBrowserProps {
  storageBrowser?: any;
  paramsProp?: any;
  authUser?: any;

  height?: number;
  showSelect?: boolean;
  onSelectFile?: (folder: string, filename: string, e: any) => void;
  onCancel?: (e: any) => void;
}

interface IStorageBrowserState {
  actualFolderIn?: any[];
  isAddFolderVisible?: boolean;
  newFolderName?: string;
  uploadingFiles?: any[];
  selectedFolderString?: string;
  selectedFile?: any;
}

class StorageBrowser extends React.PureComponent<IStorageBrowserProps, IStorageBrowserState> {
  private unDark: any;
  dropfiles = React.createRef<any>();

  constructor(props) {
    super(props);

    this.state = {};
  }

  onDarkModeChanged = (isDark) => {
    this.forceUpdate();
  };

  componentDidMount() {
    this.unDark = REActions.onDarkModeChanged.listen(this.onDarkModeChanged);
  }

  componentWillUnmount() {
    this.unDark();
  }

  onDoubleClick = (item1, item2?, e?, ...args) => {
    if (e === undefined) {
      e = item2;
    }

    e.preventDefault();
    e.stopPropagation();

    if (item2 && _.isObject(item2 as any) && item2.name && item2.date && item2.size) {
      item1 = Immutable.fromJS(item2);
    }

    if (item1) {
      if (item1.get('isFolder')) {
        //
      } else {
        this.onClickBottomSelect(e);
      }
    }
  };

  onClickItem = (item1, item2?, e?, ...args) => {
    if (e === undefined) {
      e = item2;
    }

    e.preventDefault();
    e.stopPropagation();

    if (item2 && _.isObject(item2 as any) && item2.name && item2.date && item2.size) {
      item1 = Immutable.fromJS(item2);
    }

    if (item1) {
      if (item1.get('isFolder')) {
        let newIn = [...(this.state.actualFolderIn || []), item1.get('name')];
        this.setState({
          actualFolderIn: newIn,
          selectedFolderString: null,
          selectedFile: null,
        });
      } else {
        this.setState({
          selectedFolderString: this.calcActualFolderString(),
          selectedFile: item1,
        });
      }
    }
  };

  memNeedRetrieve = memoizeOne((storageBrowser, actualFolderIn) => {
    if (!storageBrowser || storageBrowser.get('isRefreshing')) {
      return;
    }

    if (storageBrowser) {
      let folderName = '/';
      let needUpdate = false;
      let nodes = storageBrowser.get('nodes');
      (actualFolderIn || []).some((value, index, array) => {
        nodes = nodes.get('folders');
        if (nodes) {
          nodes = nodes.find((f1) => f1.get('name') === value);
        }
        folderName += value + '/';

        if (!nodes) {
          needUpdate = true;
          return true;
        }

        return false;
      });

      if (needUpdate || !nodes || nodes.get('isFetched') === false) {
        // StoreActions.storageListFolder(folderName);
      }
    }
  });

  memListItems = memoizeOne((storageBrowser, actualFolderIn) => {
    let listItems = null;

    if (storageBrowser) {
      let nodes = storageBrowser.get('nodes');
      (actualFolderIn || []).some((value, index, array) => {
        nodes = nodes.get('folders');
        if (nodes) {
          nodes = nodes.find((f1) => f1.get('name') === value);
        }
        if (!nodes) {
          return true;
        }

        return false;
      });

      if (nodes) {
        listItems = [] as IStorageBrowserNode[];
        if (nodes.get('folders')) {
          nodes.get('folders').some((f1) => {
            listItems.push({ isFetched: f1.get('isFetched'), key: f1.get('key'), name: f1.get('name'), isFolder: true, onClick: this.onClickItem.bind(this, f1) } as IStorageBrowserNode);
          });
        }
        if (nodes.get('files')) {
          nodes.get('files').some((f1) => {
            listItems.push({ name: f1.get('name'), isFolder: false, size: f1.get('size'), date: f1.get('date'), onClick: this.onClickItem.bind(this, f1), onDoubleClick: this.onDoubleClick.bind(this, f1) } as IStorageBrowserNode);
          });
        }

        let itemsFolders = [];
        let itemsGrouped = {};
        listItems.some((f1: IStorageBrowserNode) => {
          if (f1.isFolder) {
            itemsFolders.push(f1);
            return;
          }

          let name1 = calcNameWithoutUuid(f1.name);

          let group1 = itemsGrouped[name1];
          if (!group1) {
            group1 = [f1];
            itemsGrouped[name1] = group1;
          } else {
            group1.push(f1);
          }
        });

        listItems = itemsFolders;
        let kk = Object.keys(itemsGrouped);
        kk.some((k1) => {
          let group1 = itemsGrouped[k1];
          group1.sort((a: IStorageBrowserNode, b: IStorageBrowserNode) => {
            if (!a.date || !b.date) {
              return 0;
            }

            let am = moment(a.date);
            let bm = moment(b.date);
            if (am.isSame(bm)) {
              return 0;
            } else if (am.isBefore(bm)) {
              return 1;
            } else {
              return -1;
            }
          });

          let itemN: IStorageBrowserNode = null;
          if (group1.length === 0) {
            return false;
          } else if (group1.length === 1) {
            itemN = group1[0];
          } else {
            itemN = group1[0];
            group1.splice(0, 1);
            itemN.versions = group1;
          }

          listItems.push(itemN);

          return false;
        });

        listItems.sort((a: IStorageBrowserNode, b: IStorageBrowserNode) => {
          if (a.isFolder && !b.isFolder) {
            return -1;
          } else if (!a.isFolder && b.isFolder) {
            return 1;
          } else {
            return calcNameWithoutUuid(a.name || '')
              .toLowerCase()
              .localeCompare(calcNameWithoutUuid(b.name || '').toLowerCase());
          }
        });
      }
    }

    return listItems;
  });

  onClickNewFolderCancel = (e) => {
    this.setState({
      isAddFolderVisible: false,
      newFolderName: '',
    });
  };

  calcActualFolderString = () => {
    let { actualFolderIn } = this.state;
    let folderNew = '/';
    if (actualFolderIn != null) {
      actualFolderIn.some((value, index, array) => {
        folderNew += value + '/';
        return false;
      });
    }
    return folderNew;
  };

  onClickNewFolderCreate = (e) => {
    let nameNew = this.state.newFolderName;
    if (_.trim(nameNew || '') === '') {
      REActions.addNotificationError('Name is invalid');
      return;
    }
    nameNew = _.trim(nameNew);

    StoreActions.storageRefreshBegin_();

    let folderNew = this.calcActualFolderString();

    // REClient_.client_().storage_add_folder(folderNew + nameNew + '/', (err, res) => {
    //   StoreActions.storageRefreshEnd_();
    //   if(err) {
    //     REActions.addNotificationError(err || Constants.errorDefault);
    //   } else {
    //     REActions.addNotification('Folder created!');
    //     // StoreActions.storageListFolder(folderNew);
    //   }
    // });

    this.setState({
      isAddFolderVisible: false,
      newFolderName: '',
    });
  };

  onClickGoBack = (e) => {
    let { actualFolderIn } = this.state;
    if (actualFolderIn && actualFolderIn.length > 0) {
      let hh = [...actualFolderIn];
      hh.pop();

      this.setState({
        actualFolderIn: hh,

        selectedFolderString: null,
        selectedFile: null,
      });
    }
  };

  onVisibleChangeNewFolder = (v1) => {
    this.setState({
      isAddFolderVisible: v1,
    });
  };

  onChangeNewFolderName = (e) => {
    this.setState({
      newFolderName: e.target.value,
    });
  };

  onRefreshFolder = (e) => {
    let actualFolder = this.calcActualFolderString();
    // StoreActions.storageListFolder(actualFolder);
  };

  onDropFiles = (filesList) => {
    if (filesList && filesList.length > 0) {
      filesList.some((f1) => {
        if (f1) {
          this.startUploadForFile(f1);
        }
      });
    }
  };

  refreshUploads = (newItem?: any) => {
    this.setState((state, props) => {
      let ind = newItem ? (state.uploadingFiles || []).findIndex((n1) => n1.id === newItem.id) : -1;
      let list = [...(state.uploadingFiles || [])];

      let needSetState = false;
      if (ind === -1) {
        if (newItem) {
          list.push(newItem);
        }
      } else {
        if (list && !list.find((u1: IStorageUploadOne) => u1.isUploading)) {
          //finished
          // StoreActions.storageListFolder(this.calcActualFolderString());

          list = list.filter((u1: IStorageUploadOne) => !u1.isFinish);
          needSetState = true;
        }

        let fileOne: any = this.refs['upload_' + newItem.id];
        if (fileOne) {
          fileOne.forceUpdate();
        }

        if (!needSetState) {
          return;
        }
      }

      return {
        uploadingFiles: list,
      };
    });
  };

  startUploadForFile = (file1: any) => {
    let fileObj: IStorageUploadOne = {
      id: uuid.v1(),
      usedFolder: this.calcActualFolderString(),

      file: file1,
      name: file1.name,
      size: file1.size,
      percent: 0,
      isUploading: true,
      isFinish: false,
      error: null,

      s3already: false,
      s3url: null,
      fileuuid: null,
    };

    this.refreshUploads(fileObj);

    // REClient_.client_().storage_upload_start(this.calcActualFolderString(), file1.name, file1.type, (err, res) => {
    //   if(err || !res || !res.result) {
    //     fileObj.error = err || Constants.errorDefault;
    //     fileObj.isUploading = false;
    //
    //     this.refreshUploads(fileObj);
    //
    //   } else {
    //     let result = res.result;
    //     let fileuuid = result.fileuuid;
    //     let s3url = result.url;
    //
    //     fileObj = _.assign(fileObj, {
    //       s3already: true,
    //       s3url: s3url,
    //       fileuuid: fileuuid,
    //     });
    //
    //     this.refreshUploads(fileObj);
    //
    //     REClient_.client_().uploadFile(s3url, file1, file1.type, (progress, percent) => {
    //       if(!fileObj.isUploading) {
    //         return;
    //       }
    //
    //       fileObj.percent = percent;
    //
    //       this.refreshUploads(fileObj);
    //
    //     }, (err1, res1) => {
    //       if(err1) {
    //         REActions.addNotificationError(err1 || Constants.errorDefault);
    //         fileObj.error = err1 || Constants.errorDefault;
    //         fileObj.isUploading = false;
    //
    //         this.refreshUploads(fileObj);
    //
    //       } else {
    //         fileObj.isFinish = true;
    //         fileObj.isUploading = false;
    //
    //         this.refreshUploads(fileObj);
    //       }
    //     });
    //   }
    // });
  };

  onClickUploadFile = (e) => {
    this.dropfiles.current?.openDialog?.();
  };

  onClickBottomSelect = (e) => {
    if (!this.state.selectedFile || !this.state.selectedFolderString) {
      return;
    }

    this.props.onSelectFile && this.props.onSelectFile(this.state.selectedFolderString, this.state.selectedFile.get('name'), e);
  };

  onClickBottomCancel = (e) => {
    this.props.onCancel && this.props.onCancel(e);
  };

  render() {
    let { storageBrowser, showSelect } = this.props;
    let { actualFolderIn, uploadingFiles } = this.state;

    let canGoBack = actualFolderIn && actualFolderIn.length > 0;
    let styleBack = {} as CSSProperties;
    if (!canGoBack) {
      styleBack.opacity = 0.4;
      styleBack.cursor = 'not-allowed';
    }

    this.memNeedRetrieve(storageBrowser, actualFolderIn);

    let styleRoot: CSSProperties = {
      position: 'relative',
    };
    let hh = this.props.height || 400;
    styleRoot.height = hh + 'px';

    const espRoot = 5;
    const hhTop = 33;

    let listItems = this.memListItems(storageBrowser, actualFolderIn);

    let isRefreshing = !!(storageBrowser && storageBrowser.get('isRefreshing'));
    let folderName = this.calcActualFolderString();

    const accepts = [FILE];

    let bottomHH = 0;
    if (showSelect) {
      bottomHH = 32;
    }

    return (
      <div style={styleRoot}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, border: '1px solid ' + Utils.colorA(0.2), borderRadius: '4px' }}>
          <DropFiles ref={this.dropfiles} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} useBorder onDrop={this.onDropFiles} accepts={accepts}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, margin: espRoot + 'px' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: hhTop + 'px', border: '1px solid ' + Utils.colorA(0.3), backgroundColor: Utils.colorA(0.04), padding: '5px 11px', fontSize: '14px' }}>
                <span style={{ marginRight: '10px' }} onClick={this.onClickGoBack}>
                  <FontAwesomeIcon icon={['far', 'arrow-left']} transform={{ size: 14 }} style={styleBack} className={s.backIcon} />
                </span>
                <span style={{ color: Utils.colorA(0.7) }}>
                  Storage for <span style={{ fontWeight: 400 }}>Organization</span>&nbsp;-&nbsp;
                </span>
                <span style={{ fontWeight: 400 }}>Folder:&nbsp;{folderName}</span>
              </div>

              <div style={{ position: 'absolute', top: hhTop + 'px', left: 0, right: 0, bottom: bottomHH + 'px', border: '1px solid ' + Utils.colorA(0.3) }}>
                <NanoScroller>
                  {/*// @ts-ignore*/}
                  <Spin spinning={isRefreshing} style={{ paddingTop: hh / 2 - hhTop - 20 + 'px', display: 'block' }} size={'large'}>
                    {listItems && listItems.map((f1) => <StorageFileOne key={'item_' + (f1.name || uuid.v1()).replace(/ /g, '_')} data={f1} selectedFile={this.state.selectedFile} onClick={f1.onClick} onDoubleClick={f1.onDoubleClick} />)}
                    {uploadingFiles &&
                      uploadingFiles.filter((f1: IStorageUploadOne) => f1.usedFolder === folderName).map((f1: IStorageUploadOne) => <StorageFileOne key={'upload_' + f1.id} ref={'upload_' + f1.id} data={f1} isUpload={true} />)}

                    <div style={{ textAlign: 'center', marginTop: '12px' }}>
                      <Popover
                        title={'Name of new folder'}
                        open={this.state.isAddFolderVisible}
                        onOpenChange={this.onVisibleChangeNewFolder}
                        content={
                          <div style={{ whiteSpace: 'nowrap' }}>
                            <Input style={{ width: '180px', marginRight: '5px' }} placeholder={'Folder Name'} size={'small'} value={this.state.newFolderName} onChange={this.onChangeNewFolderName} />
                            <Button style={{ fontSize: '12px', marginRight: '4px' }} type={'primary'} size={'small'} onClick={this.onClickNewFolderCreate}>
                              Create
                            </Button>
                            <Button style={{ fontSize: '12px' }} type={'default'} size={'small'}>
                              Cancel
                            </Button>
                          </div>
                        }
                        trigger={'click'}
                      >
                        <Button type={'default'} style={{ fontSize: '12px' }} size={'small'}>
                          &nbsp;Add Folder...&nbsp;
                        </Button>
                      </Popover>
                      <Button type={'default'} style={{ fontSize: '12px', marginLeft: '8px' }} size={'small'} onClick={this.onClickUploadFile}>
                        &nbsp;Upload File...&nbsp;
                      </Button>
                      <Button type={'default'} style={{ fontSize: '12px', marginLeft: '8px' }} size={'small'} onClick={this.onRefreshFolder}>
                        &nbsp;Refresh Folder&nbsp;
                      </Button>
                    </div>
                    <div style={{ fontSize: '11px', color: Utils.colorA(0.41), margin: '5px 0', textAlign: 'center' }}>You can also drop files here to upload them...</div>
                  </Spin>
                </NanoScroller>
              </div>

              {showSelect === true && (
                <div style={{ position: 'absolute', bottom: 0, height: bottomHH + 'px', left: 0, right: 0 }}>
                  <div style={{ margin: '8px 0 6px 0', textAlign: 'center' }}>
                    <Button size={'small'} type={'primary'} disabled={this.state.selectedFile == null} style={{ fontSize: '12px', marginRight: '5px' }} onClick={this.onClickBottomSelect}>
                      Select File
                    </Button>
                    <Button size={'small'} type={'default'} style={{ fontSize: '12px' }} onClick={this.onClickBottomCancel}>
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </DropFiles>
        </div>
      </div>
    );
  }
}

export default connect(
  (state: any) => ({
    paramsProp: state.paramsProp,
    authUser: state.authUser,
    storageBrowser: state.storageBrowser,
  }),
  null,
)(StorageBrowser);
