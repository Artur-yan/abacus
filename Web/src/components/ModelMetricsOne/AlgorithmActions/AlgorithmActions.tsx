// Module imports
import React, { useState, PropsWithChildren, useMemo, useEffect, useRef } from 'react';

// Local imports
import REClient_ from '../../../api/REClient';
import StoreActions from '../../../stores/actions/StoreActions';
import SelectExt from '../../SelectExt/SelectExt';
import REActions from '../../../actions/REActions';
import HelpIcon from '../../HelpIcon/HelpIcon';
import GLOBAL_CONST from '../../../constants/Constants';
import PartsLink from '../../NavLeft/PartsLink';
import Constants from '../../../constants/Constants';
import { Button } from '../../../DesignSystem/Button/Button';
import { useProject } from '../../../api/REUses';
import { memUseCasesSchemasInfo } from '../../../stores/reducers/useCases';

const styles = require('./AlgorithmActions.module.css');

interface IAlgorithmActionsProps {
  metrics: any;
  detailModelVersion: string;
  updateSortPreference: any;
  recreateFolderCache: any;
  projectId: string;
}

const ACTIONS = {
  SORT_BY_METRIC: 'SORT_BY_METRIC',
  WINNING_MODEL_BY_METRIC: 'WINNING_MODEL_BY_METRIC',
};

const CONSTANTS = {
  SORT_BY_METRIC_TITLE: 'Sort models by metric:',
  WINNING_MODEL_BY_METRIC: 'Winning model chosen based on best:',
  METRIC_UPDATE_FAILED: 'Operation failed!!',
};

const AlgorithmActions = ({ metrics, detailModelVersion, updateSortPreference = () => {}, recreateFolderCache = () => {}, projectId }: PropsWithChildren<IAlgorithmActionsProps>) => {
  const [isActionBeingPerformed, setActionPerformed] = useState('');
  const project = useProject(projectId);
  let useCaseInfo = memUseCasesSchemasInfo(true, project?.useCase, true);
  let metrics_analysis_button_visible = useCaseInfo?.uiCustom?.metrics_analysis_button;
  const sortOptions = useMemo(() => metrics?.[0]?.sortableMetrics?.map(({ key, name }) => ({ value: key, label: name })), [metrics]);
  const modelConfig = metrics?.[0]?.modelConfig;
  const selectedSortMetric = useRef(modelConfig?.SORTObjective || '');
  const selectedWinningMetric = useRef(modelConfig?.OBJECTIVE || '');
  const _createModelMetricsAnalysisFileInNotebook = async (modelVersion) => {
    try {
      const response = await REClient_.promises_()._createModelMetricsAnalysisFileInNotebook(modelVersion);
      if (!response?.success || response?.error || !response?.result?.notebookId) {
        throw new Error(response?.error);
      }
      window.open(`/app/${PartsLink.fast_notebook}/${projectId || '-'}/${response?.result?.notebookId}?selectedNbFile=Metrics Analysis ${detailModelVersion}.ipynb`, '_blank');
    } catch (e) {
      REActions.addNotificationError(e?.message || Constants.errorDefault);
    }
  };

  useEffect(() => {
    if (modelConfig) {
      selectedSortMetric.current = modelConfig?.SORTObjective;
      selectedWinningMetric.current = modelConfig?.OBJECTIVE;
    }
  }, [modelConfig]);

  if (!sortOptions?.length) return <></>;

  const updateAction = async (selectedValue, selectedAction) => {
    let updatedMetric = null;
    if (selectedAction === ACTIONS.SORT_BY_METRIC) {
      updatedMetric = await REClient_.promises_()._setMetricsSortObjectiveForUi(detailModelVersion, selectedValue);
    } else if (selectedAction === ACTIONS.WINNING_MODEL_BY_METRIC) {
      updatedMetric = await REClient_.promises_().setModelObjective(detailModelVersion, selectedValue);
    }
    return updatedMetric;
  };

  const onSortMetricChange = async (selectedOption, selectedAction) => {
    recreateFolderCache();
    const selectedValue = selectedOption?.value;
    setActionPerformed(selectedAction);
    try {
      const updatedSortMetric = await updateAction(selectedValue, selectedAction);
      if (!updatedSortMetric?.success) {
        REActions.addNotificationError(CONSTANTS.METRIC_UPDATE_FAILED);
      }
      updateSortPreference(`${selectedSortMetric.current || ''}-${selectedWinningMetric.current || ''}`);
      setActionPerformed('');
    } catch (e) {
      REActions.addNotificationError(e?.message || GLOBAL_CONST.errorDefault);
      setActionPerformed('');
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.containerItem}>
        <p className={styles.selectTitle}>{CONSTANTS.SORT_BY_METRIC_TITLE}</p>
        <SelectExt
          className={styles.selectSample}
          isDisabled={isActionBeingPerformed === ACTIONS.SORT_BY_METRIC}
          options={sortOptions}
          value={sortOptions?.find((o1) => o1?.value === metrics?.[0]?.modelConfig?.SORTObjective)}
          onChange={(e) => {
            selectedSortMetric.current = e?.value;
            onSortMetricChange(e, ACTIONS.SORT_BY_METRIC);
          }}
          {...(isActionBeingPerformed === ACTIONS.SORT_BY_METRIC && { isLoading: true })}
        />
        <HelpIcon id={'metrics_page_sort_models_by_metric_dropdown'} />
      </div>
      <div className={styles.containerItem}>
        <p className={styles.selectTitle}>{CONSTANTS.WINNING_MODEL_BY_METRIC}</p>
        <SelectExt
          className={styles.selectSample}
          isDisabled={isActionBeingPerformed === ACTIONS.WINNING_MODEL_BY_METRIC}
          options={sortOptions}
          value={sortOptions?.find((o1) => o1?.value === metrics?.[0]?.modelConfig?.OBJECTIVE)}
          onChange={(e) => {
            selectedWinningMetric.current = e?.value;
            selectedSortMetric.current = e?.value;
            onSortMetricChange(e, ACTIONS.WINNING_MODEL_BY_METRIC);
          }}
          {...(isActionBeingPerformed === ACTIONS.WINNING_MODEL_BY_METRIC && { isLoading: true })}
        />
        <HelpIcon id={'metrics_page_winning_model_by_metric_dropdown'} />
      </div>
      {metrics_analysis_button_visible && (
        <div className={styles.containerItem}>
          <Button type="primary" className={styles.analyzeButton} onClick={() => _createModelMetricsAnalysisFileInNotebook(detailModelVersion)}>
            Analyze Metrics
          </Button>
        </div>
      )}
    </div>
  );
};

export default React.memo(AlgorithmActions);
