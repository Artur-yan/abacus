import _ from 'lodash';
import * as React from 'react';
import { connect } from 'react-redux';
import Location from '../../../core/Location';
import memoizeOne, { memoizeOneCurry } from '../../libs/memoizeOne';
import eda, { EdaLifecycle } from '../../stores/reducers/eda';
import { memProjectById } from '../../stores/reducers/projects';
import HelpIcon from '../HelpIcon/HelpIcon';
import PartsLink from '../NavLeft/PartsLink';
import { topAfterHeaderHH } from '../ProjectsList/ProjectsList';
import RefreshAndProgress from '../RefreshAndProgress/RefreshAndProgress';
import SelectExt from '../SelectExt/SelectExt';
import TableExt, { ITableExtColumn } from '../TableExt/TableExt';
import AutoSizer from 'react-virtualized/dist/commonjs/AutoSizer';
import NanoScroller from '../NanoScroller/NanoScroller';

const s = require('./EDADataConsistency.module.css');
const sd = require('../antdUseDark.module.css');

interface IEDADataConsistencyProps {
  projects?: any;
  paramsProp?: any;
  eda?: any;
}

interface IEDADataConsistencyState {
  selectedVersion?: any;
}

class EDADataConsistency extends React.PureComponent<IEDADataConsistencyProps, IEDADataConsistencyState> {
  private isMount: boolean;

  constructor(props) {
    super(props);

    this.state = {};
  }

  componentDidMount() {
    this.isMount = true;
    this.doMem(false);
  }

  componentWillUnmount() {
    this.isMount = false;
  }

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
    if (!this.isMount) {
      return;
    }

    let projectId = this.calcProjectId();
    let foundProject1 = this.memProjectId(true)(projectId, this.props.projects);
    const edaId = this.calcEdaId();
    const edaOne = this.memEDAById(true)(this.props.eda, edaId);
    const edaVersion = this.calcEdaVersion();
    let curVersion = this.state.selectedVersion ?? edaVersion ?? edaOne?.latestEdaVersion?.edaVersion;

    let listEda = this.memEDAList(true)(this.props.eda, projectId);
    let edaVersions = this.memEdaVersions(true)(this.props.eda, edaId);

    let edaVersionOne = null;
    if (edaVersions) {
      edaVersionOne = edaVersions.find((p1) => p1.edaVersion === curVersion);
      if (!edaVersionOne && edaVersions.length > 0) {
        edaVersionOne = edaVersions[0];
        curVersion = edaVersions[0].edaVersion;
      }
    }

    const edaDataConsistencyDetection = this.memEDADataConsistencyDetection(true)(this.props.eda, curVersion);
  };

  componentDidUpdate(prevProps: Readonly<IEDADataConsistencyProps>, prevState: Readonly<IEDADataConsistencyState>, snapshot?: any): void {
    this.doMem();
  }

  calcEdaVersion = () => {
    let edaVersion = this.props.paramsProp?.get('edaVersion');
    if (edaVersion === '-') {
      return null;
    } else {
      return edaVersion;
    }
  };

  calcProjectId = () => {
    let projectId = this.props.paramsProp?.get('projectId');
    if (projectId === '-') {
      return null;
    } else {
      return projectId;
    }
  };

  calcEdaId = () => {
    let edaId = this.props.paramsProp?.get('edaId');
    if (edaId === '-') {
      return null;
    } else {
      return edaId;
    }
  };

  memEdaVersions = memoizeOneCurry((doCall, edaParam, edaId) => {
    return eda.memEdaVersionsById(doCall, edaId);
  });

  memEDAList = memoizeOneCurry((doCall, edaParam, projectId) => {
    return eda.memEdasByProjectId(doCall, projectId);
  });

  memEdaOptions = memoizeOne((listEdas) => {
    return listEdas?.filter((item) => _.isArray(item.edaConfigs) && item.edaConfigs.map((config) => config.edaType)?.includes('DATA_CONSISTENCY'))?.map((f1) => ({ label: f1.name, value: f1.edaId })) ?? [];
  });

  memVersionOptions = memoizeOne((listVersions) => {
    return listVersions?.map((f1) => ({ label: f1.edaVersion, value: f1.edaVersion })) ?? [];
  });

  memEDAById = memoizeOneCurry((doCall, edaParam, edaId) => {
    return eda.memEdaById(doCall, edaId);
  });

  memEDADataConsistencyDetection = memoizeOneCurry((doCall, edaParam, edaVersion) => {
    return eda.memEdaDataConsistencyByEdaVersion(doCall, edaVersion);
  });

  memProjectId = memoizeOneCurry((doCall?: boolean, projectId?: any, projects?: any) => {
    return memProjectById(projectId, doCall);
  });

  memDuplicatePKColumns = memoizeOne((projectId, foundProject1) => {
    let columns: ITableExtColumn[] = [
      {
        title: '',
        field: 'keyName',
        width: 200,
      },
      {
        title: 'Total Primary Keys',
        field: 'totalPrimaryKeys',
        width: 200,
      },
      {
        title: 'Duplicate Keys',
        field: 'duplicateKeys',
      },
      {
        title: 'Sample Rows',
        field: 'sampleRows',
        render: (text, row, index) => {
          return (
            <span className={sd.linkBlue} onClick={this.onTableViewClick.bind(this, '1')}>
              View
            </span>
          );
        },
        width: 200,
      },
    ];

    columns = columns.filter((c1) => !c1.hidden);

    return columns;
  });

  memDuplicatePKList = memoizeOne((testDuplicates, referenceDuplicates) => {
    if (testDuplicates == null || referenceDuplicates == null) {
      return [];
    }

    return [
      {
        keyName: 'Test Version',
        totalPrimaryKeys: testDuplicates?.totalCount ?? 0,
        duplicateKeys: `${testDuplicates?.numDuplicates ?? 0} (${testDuplicates?.totalCount ? Math.floor(((testDuplicates?.numDuplicates ?? 0) / testDuplicates?.totalCount) * 100) : 0}%)`,
        sampleRows: testDuplicates?.sample,
      },
      {
        keyName: 'Reference Version',
        totalPrimaryKeys: referenceDuplicates?.totalCount ?? 0,
        duplicateKeys: `${referenceDuplicates?.numDuplicates ?? 0} (${referenceDuplicates?.totalCount ? Math.floor(((referenceDuplicates?.numDuplicates ?? 0) / referenceDuplicates?.totalCount) * 100) : 0}%)`,
        sampleRows: referenceDuplicates?.sample,
      },
    ];
  });

  memDeletionColumns = memoizeOne((projectId, foundProject1) => {
    let columns: ITableExtColumn[] = [
      {
        title: 'Unique rows from reference version',
        field: 'totalRows',
        width: 350,
      },
      {
        title: 'Deleted rows',
        field: 'modifiedRows',
      },
      {
        title: 'Sample Rows',
        field: 'sampleRows',
        render: (text, row, index) => {
          return (
            <span className={sd.linkBlue} onClick={this.onTableViewClick.bind(this, '2')}>
              View
            </span>
          );
        },
        width: 200,
      },
    ];

    columns = columns.filter((c1) => !c1.hidden);

    return columns;
  });

  onTableViewClick = (tableType, e) => {
    e.stopPropagation();
    e.preventDefault();

    const projectId = this.calcProjectId();
    const edaId = this.calcEdaId();

    Location.push('/' + PartsLink.exploratory_data_analysis_data_consistency_analysis + '/' + projectId + '/' + edaId + '?tableType=' + tableType);
  };

  onDataVariationClick = (featureName, e) => {
    e.stopPropagation();
    e.preventDefault();

    const projectId = this.calcProjectId();
    const edaId = this.calcEdaId();

    Location.push('/' + PartsLink.exploratory_data_analysis_data_consistency_analysis + '/' + projectId + '/' + edaId + '?tableType=3&featureName=' + featureName);
  };

  memDeletionList = memoizeOne((deletions) => {
    if (deletions == null) {
      return [];
    }

    return [
      {
        totalRows: deletions?.totalCount ?? 0,
        modifiedRows: `${deletions?.numDeletions ?? 0} (${deletions?.totalCount ? Math.floor(((deletions?.numDeletions ?? 0) / deletions?.totalCount) * 100) : 0}%)`,
        sampleRows: deletions?.sample,
      },
    ];
  });

  memDataVariationColumns = memoizeOne((projectId, foundProject1) => {
    let columns: ITableExtColumn[] = [
      {
        title: 'Feature Name',
        field: 'featureName',
        width: 200,
      },
      {
        title: 'Changed Rows',
        field: 'changedRows',
        width: 200,
      },
      {
        title: 'Null -> Non Null',
        field: 'nullToNonNull',
        helpId: 'eda_null_to_no_null',
        width: 200,
      },
      {
        title: 'Non Null -> Null',
        field: 'nonNullToNull',
        helpId: 'eda_no_null_to_null',
        width: 200,
      },
      {
        title: 'Top Changes',
        field: 'topChanges',
      },
      {
        title: 'Sample Data',
        field: 'sampleData',
        render: (text, row, index) => {
          return (
            <span className={sd.linkBlue} onClick={this.onDataVariationClick.bind(this, row.featureName)}>
              View
            </span>
          );
        },
        width: 200,
      },
    ];

    columns = columns.filter((c1) => !c1.hidden);

    return columns;
  });

  memDataVariationList = memoizeOne((transformation) => {
    if (transformation == null) {
      return [];
    }

    const res = [];
    if (transformation) {
      for (const [key, value] of Object.entries<any>(transformation)) {
        res.push({
          featureName: key,
          changedRows: value.total_transformation_count ?? 0,
          nullToNonNull: `${value.null_to_non_null ?? 0} (${value?.total_count ? Math.floor(((value?.null_to_non_null ?? 0) / value?.total_count) * 100) : 0}%)`,
          nonNullToNull: `${value.non_null_to_null ?? 0} (${value?.total_count ? Math.floor(((value?.non_null_to_null ?? 0) / value?.total_count) * 100) : 0}%)`,
          topChanges: value.top_changes ?? '',
          sampleData: value.samples,
        });
      }
    }

    return res;
  });

  onChangeDropdownEDASel = (option1) => {
    if (option1?.value) {
      let p1 = this.calcProjectId();
      if (p1) {
        p1 = '/' + p1;
      } else {
        p1 = '/-';
      }

      this.setState({ selectedVersion: null });
      Location.push('/' + PartsLink.exploratory_data_analysis_data_consistency + p1 + '/' + option1?.value);
    }
  };

  onChangeDropdownVersionSel = (option) => {
    this.setState({ selectedVersion: option?.value });
  };

  render() {
    let projectId = this.calcProjectId();
    let foundProject1 = this.memProjectId(false)(projectId, this.props.projects);

    const edaVersion = this.calcEdaVersion();

    const edaId = this.calcEdaId();
    const edaOne = this.memEDAById(false)(this.props.eda, edaId);
    let curVersion = this.state.selectedVersion ?? edaVersion ?? edaOne?.latestEdaVersion?.edaVersion;

    let optionsEDASel = null;
    let optionsEDA = [];
    let listEdas = this.memEDAList(false)(this.props.eda, projectId);
    optionsEDA = this.memEdaOptions(listEdas);
    if (optionsEDA && edaId) {
      optionsEDASel = optionsEDA.find((p1) => p1.value === edaId);
    }

    let optionsVersionSel = null;
    let optionsVersion = [];
    let edaVersionOne = null;
    let listVersions = this.memEdaVersions(false)(this.props.eda, edaId);
    optionsVersion = this.memVersionOptions(listVersions);
    if (optionsVersion) {
      optionsVersionSel = optionsVersion.find((p1) => p1.value === curVersion);
      edaVersionOne = listVersions?.find((p1) => p1.edaVersion === curVersion);
      if (!optionsVersionSel && optionsVersion.length > 0) {
        edaVersionOne = listVersions?.[0];
        optionsVersionSel = optionsVersion[0];
        curVersion = optionsVersion[0].value;
      }
    }

    const isProcessing = [EdaLifecycle.MONITORING, EdaLifecycle.PENDING].includes(edaVersionOne?.status);

    const edaDataConsistencyDetection = this.memEDADataConsistencyDetection(false)(this.props.eda, curVersion);

    const duplicatePKColumns = this.memDuplicatePKColumns(projectId, foundProject1);
    let duplicatePKDataList = this.memDuplicatePKList(edaDataConsistencyDetection?.baseDuplicates, edaDataConsistencyDetection?.compareDuplicates);

    const deletionColumns = this.memDeletionColumns(projectId, foundProject1);
    let deletionDataList = this.memDeletionList(edaDataConsistencyDetection?.deletions);

    const dataVariationColumns = this.memDataVariationColumns(projectId, foundProject1);
    let dataVariationDataList = this.memDataVariationList(edaDataConsistencyDetection?.transformations);

    const isRefreshing = !edaDataConsistencyDetection || isProcessing;

    let duplicatePKTableHH = (hh) => (
      <div style={hh == null ? {} : { top: topAfterHeaderHH + 'px' }}>
        <TableExt showEmptyIcon={true} height={hh} dataSource={duplicatePKDataList} columns={duplicatePKColumns} />
      </div>
    );

    let duplicatePKTable = duplicatePKTableHH(null);

    let deletionTableHH = (hh) => (
      <div style={hh == null ? {} : { top: topAfterHeaderHH + 'px' }}>
        <TableExt showEmptyIcon={true} height={hh} dataSource={deletionDataList} columns={deletionColumns} />
      </div>
    );

    let deletionTable = deletionTableHH(null);

    let dataVariationTableHH = (hh) => (
      <div style={hh == null ? {} : { top: topAfterHeaderHH + 'px' }}>
        <TableExt showEmptyIcon={true} height={hh} dataSource={dataVariationDataList} columns={dataVariationColumns} />
      </div>
    );

    let dataVariationTable = dataVariationTableHH(null);

    return (
      <div
        css={`
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
        `}
      >
        <div css="display: flex; align-items: center; margin: 20px;">
          <span css="font-size: 14px">EDA:</span>
          <span style={{ marginLeft: '10px', marginRight: '20px', width: '300px', display: 'inline-block', fontSize: '12px' }}>
            <SelectExt value={optionsEDASel} options={optionsEDA} onChange={this.onChangeDropdownEDASel} />
          </span>
          <span css="font-size: 14px">Version:</span>
          <span style={{ marginLeft: '10px', marginRight: '20px', width: '200px', display: 'inline-block', fontSize: '12px' }}>
            <SelectExt value={optionsVersionSel} options={optionsVersion} onChange={this.onChangeDropdownVersionSel} />
          </span>
        </div>
        <div
          css={`
            position: absolute;
            top: ${topAfterHeaderHH + 20}px;
            left: 0;
            right: 0;
            bottom: 0;
          `}
        >
          <RefreshAndProgress isMsgAnimRefresh={isRefreshing} msgMsg={isRefreshing ? 'Processing...' : undefined} isDim={isRefreshing}>
            <AutoSizer>
              {({ height, width }) => {
                return (
                  <NanoScroller onlyVertical>
                    <div
                      css={`
                        width: ${width - 60}px;
                        height: ${height}px;
                        margin-left: 30px;
                      `}
                    >
                      <div className={sd.titleTopHeaderAfter} style={{ height: topAfterHeaderHH }}>
                        <span>
                          Duplicate Primary Keys <HelpIcon id={'eda_duplicate_primary_keys'} style={{ marginLeft: '4px' }} />
                        </span>
                      </div>
                      {duplicatePKTable}

                      <div className={sd.titleTopHeaderAfter} style={{ marginTop: '25px', height: topAfterHeaderHH }}>
                        <span>
                          Deletions <HelpIcon id={'eda_deletions'} style={{ marginLeft: '4px' }} />
                        </span>
                      </div>
                      {deletionTable}

                      <div className={sd.titleTopHeaderAfter} style={{ marginTop: '25px', height: topAfterHeaderHH }}>
                        <span>
                          Data Variation Between Test and Reference Version by Feature <HelpIcon id={'eda_data_variation'} style={{ marginLeft: '4px' }} />
                        </span>
                      </div>
                      {dataVariationTable}
                    </div>
                  </NanoScroller>
                );
              }}
            </AutoSizer>
          </RefreshAndProgress>
        </div>
      </div>
    );
  }
}

export default connect(
  (state: any) => ({
    paramsProp: state.paramsProp,
    projects: state.projects,
    eda: state.eda,
  }),
  null,
)(EDADataConsistency);
