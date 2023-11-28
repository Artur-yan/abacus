import * as _ from 'lodash';
import * as React from 'react';
import { PropsWithChildren, useEffect, useMemo, useReducer, useState } from 'react';
import PivotTableUI from 'react-pivottable/PivotTableUI';
import createPlotlyRenderers from 'react-pivottable/PlotlyRenderers';
import TableRenderers from 'react-pivottable/TableRenderers';
import Plot from 'react-plotly.js';
import { useSelector } from 'react-redux';
import 'style-loader!css-loader!react-pivottable/pivottable.css';
import Utils from '../../../core/Utils';
import REClient_ from '../../api/REClient';
import StoreActions from '../../stores/actions/StoreActions';
import { calcFileDataUseByDatasetIdProjectId } from '../../stores/reducers/defDatasets';
import RefreshAndProgress from '../RefreshAndProgress/RefreshAndProgress';
const s = require('./DatasetVisualize.module.css');
const sd = require('../antdUseDark.module.css');

// create Plotly renderers via dependency injection
const PlotlyRenderers = createPlotlyRenderers(Plot);

interface IDatasetVisualizeProps {}

const DatasetVisualize = React.memo((props: PropsWithChildren<IDatasetVisualizeProps>) => {
  const { paramsProp, defDatasets } = useSelector((state: any) => ({
    paramsProp: state.paramsProp,
    defDatasets: state.defDatasets,
  }));
  const [ignored, forceUpdate] = useReducer((x) => x + 1, 0);

  const [isDownload, setIsDownload] = useState(true);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadProgressTotal, setDownloadProgressTotal] = useState(null);
  const [data, setData] = useState(null);

  const projectId = paramsProp?.get('projectId');
  const datasetId = paramsProp?.get('datasetId');
  const batchPredictionId = paramsProp?.get('batchPredId');
  const modelVersion = paramsProp?.get('modelVersion');

  const doDownload = (maxRows: number) => {
    if (!projectId || !datasetId) {
      return;
    }

    let lastDatasetId = datasetId;
    REClient_.client_().get_dataset_data(
      projectId,
      datasetId,
      null,
      0,
      maxRows,
      0,
      9999,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      (err, res) => {
        if (err) {
          Utils.error('Error: ' + err);
        }

        if (lastDatasetId !== datasetId) {
          return;
        }

        if (!err && res && res.result && res.result.data) {
          setData(res.result.data);
          setIsDownload(false);
        }
      },
      (actual, total) => {
        setDownloadProgress(actual);
        setDownloadProgressTotal(total);
      },
    );
  };

  useEffect(() => {
    doDownload(10000);
  }, [projectId, datasetId]);

  const downProg = useMemo(() => {
    if (downloadProgressTotal == null) {
      return Utils.prettyPrintNumber(downloadProgress || 0);
    } else {
      return '' + (((downloadProgress || 0) / (downloadProgressTotal || 1)) * 100)?.toFixed(1) + '%';
    }
  }, [downloadProgress, downloadProgressTotal]);

  const [plotState, setPlotState] = useState({});

  const renderersMemo = useMemo(() => {
    return _.assign({}, TableRenderers, PlotlyRenderers);
  }, []);

  const memDatasetSchema = (doCall, defDatasets, projectId, datasetId) => {
    if (defDatasets && projectId && datasetId) {
      let dsSchema1 = calcFileDataUseByDatasetIdProjectId(undefined, datasetId, projectId);
      if (dsSchema1 == null) {
        if (defDatasets.get('isRefreshing') === 0) {
          if (doCall) {
            StoreActions.schemaGetFileDataUse_(projectId, datasetId);
          }
        }
      } else {
        return dsSchema1;
      }
    }
  };

  useEffect(() => {
    if (projectId && datasetId) {
      memDatasetSchema(true, defDatasets, projectId, datasetId);
    }
  }, [projectId, datasetId, defDatasets]);

  const columns = useMemo(() => {
    if (!projectId || !datasetId) {
      return null;
    }

    let dataset1 = memDatasetSchema(false, defDatasets, projectId, datasetId);
    if (dataset1) {
      return dataset1.get('schema')?.toJS();
    }
  }, [defDatasets, projectId, datasetId]);

  const dataUse = useMemo(() => {
    let res = [];
    data?.some((d1) => {
      let res1: any = {};
      columns?.some((c1, c1ind) => {
        if (!Utils.isNullOrEmpty(c1?.name)) {
          res1[c1?.name] = d1[c1ind];
        }
      });
      res.push(res1);
    });
    return res;
  }, [data, columns]);

  return (
    <div style={{}}>
      {isDownload && <RefreshAndProgress msgMsg={'Downloading Data... (' + downProg + ')'} isMsgAnimRefresh={true}></RefreshAndProgress>}
      {!isDownload && (
        <div style={{ margin: '40px 30px' }}>
          <PivotTableUI data={dataUse} onChange={(s) => setPlotState(s)} renderers={renderersMemo} {...plotState} />
        </div>
      )}
    </div>
  );
});

export default DatasetVisualize;
