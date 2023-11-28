import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Progress from 'antd/lib/progress';
import _ from 'lodash';
import * as moment from 'moment';
import * as React from 'react';
import Utils from '../../../core/Utils';
import REActions from '../../actions/REActions';
import memoizeOne from '../../libs/memoizeOne';
import { IStorageBrowserNode, IStorageUploadOne } from '../StorageBrowser/StorageBrowser';
const s = require('./StorageFileOne.module.css');

interface IStorageFileOneProps {
  data?: IStorageBrowserNode;
  onClick?: (e: any) => void;
  onDoubleClick?: (e: any) => void;
  isUpload?: boolean;
  isVersion?: boolean;
  isSelected?: boolean;
  selectedFile?: any;
}

interface IStorageFileOneState {
  versionExpanded?: boolean;
}

export const calcNameWithoutUuid = (name1) => {
  if (name1 && _.isString(name1)) {
    if (/^____[0-9a-zA-Z]{1,40}_/.test(name1)) {
      let ind = name1.indexOf('_', 5);
      if (ind > -1) {
        name1 = name1.substring(ind + 1);
      }
    }
  }
  return name1;
};

class StorageFileOne extends React.PureComponent<IStorageFileOneProps, IStorageFileOneState> {
  private unDark: any;

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

  onDoubleClickRoot = (...args) => {
    // @ts-ignore
    this.props.onDoubleClick && this.props.onDoubleClick(...args);
  };

  onClickRoot = (...args) => {
    // @ts-ignore
    this.props.onClick && this.props.onClick(...args);
  };

  onClickVersions = (e) => {
    this.setState({
      versionExpanded: !this.state.versionExpanded,
    });
  };

  memVersionList = memoizeOne((data, versions) => {
    if (!versions || versions.length === 0) {
      return null;
    }

    let list = [data, ...versions];
    return list.map((f1) => ({ dataVersion: f1, onClick: this.onClickRoot.bind(this, f1), onDoubleClick: this.onDoubleClickRoot.bind(this, f1) }));
  }, _.isEqual);

  calcIsSelected = (selectedFile, data) => {
    return selectedFile && data && selectedFile.get('name') === data.name && selectedFile.get('date') === data.date && selectedFile.get('size') === data.size;
  };

  render() {
    let { data, isUpload, isVersion, isSelected, selectedFile } = this.props;
    if (!data) {
      data = {};
    }

    if (selectedFile != null) {
      isSelected = this.calcIsSelected(selectedFile, data);
    }

    let iconElem = null;
    if (isUpload || !data.isFolder) {
      iconElem = <FontAwesomeIcon icon={['far', 'file']} transform={{ size: 15 }} style={{ marginRight: '5px', minWidth: '18px' }} className={s.icon} />;
    } else {
      iconElem = <FontAwesomeIcon icon={['far', 'folder']} transform={{ size: 15 }} style={{ marginRight: '5px', minWidth: '18px' }} className={s.icon} />;
    }

    let extra = null;
    let versionsCount = 0;
    if (!isVersion && data.versions && data.versions.length > 0) {
      versionsCount = data.versions.length + 1;
    }
    extra = (
      <span>
        {versionsCount != null && versionsCount !== 0 && (
          <span>
            <span style={{ padding: '2px 4px', marginLeft: '6px', borderRadius: '3px', border: '1px solid ' + Utils.colorA(0.2), color: Utils.colorA(0.6) }} className={s.slideDown} onClick={this.onClickVersions}>
              <FontAwesomeIcon icon={this.state.versionExpanded ? 'chevron-up' : 'chevron-down'} transform={{ size: 16 }} />
              <span style={{ marginLeft: '4px' }} className={s.versionsText}>
                (<span style={{ fontWeight: 400 }}>{versionsCount}</span> Version{versionsCount === 1 ? '' : 's'})
              </span>
            </span>
          </span>
        )}
        {data.date != null && (
          <span style={{ marginLeft: '8px' }} className={s.extra}>
            {moment(data.date).format('YYYY-MM-DD h:mm a')}
          </span>
        )}
      </span>
    );

    if (isUpload) {
      extra = (
        <span style={{ marginLeft: '8px' }} className={s.extra}>
          <span style={{ fontSize: '11px', opacity: 0.65 }}>Uploading:</span>
          <Progress showInfo={false} percent={(data as IStorageUploadOne).percent} status="active" style={{ maxWidth: '220px', marginLeft: '5px' }} />
        </span>
      );
    }

    let name1 = <span style={{ fontWeight: 400 }}>{calcNameWithoutUuid(data.name)}</span>;

    let versionsElem = null;
    if (this.state.versionExpanded && versionsCount > 0) {
      let versionsList = this.memVersionList(data, data.versions);

      if (versionsList) {
        versionsElem = (
          <div style={{ border: '1px dotted ' + Utils.colorA(0.2), borderBottom: 'none', margin: '5px 5px 3px 5px' }}>
            {versionsList.map((f1: { dataVersion: IStorageBrowserNode; onClick; onDoubleClick }) => (
              <StorageFileOne key={'vers_' + f1.dataVersion.name} data={f1.dataVersion} isVersion onClick={f1.onClick} onDoubleClick={f1.onDoubleClick} isSelected={this.calcIsSelected(selectedFile, f1.dataVersion)} />
            ))}
          </div>
        );
      }
    }

    let indentElem = isVersion ? <span style={{ width: '14px', display: 'inline-block' }}>&nbsp;</span> : null;

    return (
      <div style={{}} className={s.root + ' ' + (this.state.versionExpanded ? s.expanded : '') + ' clearfix ' + (isSelected ? s.rootSel : '')} onClick={this.onClickRoot} onDoubleClick={this.onDoubleClickRoot}>
        {data.isFolder === true && (
          <div style={{ float: 'right' }}>
            <FontAwesomeIcon icon={'chevron-right'} transform={{ size: 15 }} style={{ marginRight: '8px' }} className={s.chevron} />
          </div>
        )}

        <div>
          {indentElem}
          {iconElem}
          {name1}
          {extra}
        </div>

        {versionsElem}
      </div>
    );
  }
}

export default StorageFileOne;
