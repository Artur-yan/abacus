import _ from 'lodash';
import * as React from 'react';
import Utils from '../../core/Utils';
import AnnotationEditorImages, { calcRealId } from '../components/AnnotationEditorImages/AnnotationEditorImages';
import DocStoreRenderImage, { DocStoreImageSizePxWW } from '../components/DocStoreRenderImage/DocStoreRenderImage';
import { calcSchemaForFeature } from '../components/FeaturesOneAdd/FeatureType';
import PartsLink from '../components/NavLeft/PartsLink';
import { ITableExtColumn } from '../components/TableExt/TableExt';
import memoizeOne from '../libs/memoizeOne';
import REClient_ from './REClient';

export enum DocStoreType {
  vision = 'vision',
  pdf = 'pdf',
  pdf_project = 'pdf_project',
}

export interface IDocStoreHelper {}

export interface IDocStoreDef {
  type?: DocStoreType;

  featureGroupTypes?: string[];
  featureGroupFeatureTypesNeeded?: string[];

  annotationTypeKey?: string;
  annotationSupport?: boolean;
  annotationRender?: ({ readonly, extractedFeatures, docId, pageNumber, isProcessingOCR, isLoadingImage, selRectListOri, onNeedCurrentLabel, onChangeAnnotations, onMouseEnterLabel, data, showReviewNotStartedWarning }) => any;

  shadowFGMinColumnsLeft?: number;
  shodowFGColumns?: string[];
  shadowFGCustomRender: (row: any) => boolean | null;

  useCases?: string[];
  problemTypes?: string[];
  rowIdentifierFeatureMapping?: string;

  //Allow
  allowRawData?: boolean;
  allowRawDataFilters?: boolean;
  allowRawDataSqlFilters?: boolean;
  allowRawDataFiltersColumns?: boolean;
  allowRawDataNumberOfColumns?: boolean;
  allowRawDataPrompts?: boolean;
  allowPredDash?: boolean;
  allowPredAPI?: boolean;

  useNewMonitoring?: boolean;
  monitorsTypesListHide?: string[] | null;
  monitorsTypesListSelect?: string[] | null;
  navLeftHidePartsLinks?: PartsLink[] | null;

  outliersShowImagesForMappings?: string[] | null;
  columnSqlFeatureMapping?: string;
  calcSqlForFilter?: (text: string, colFilterName: string) => string | null;
  showIsDocumentCheckboxForDatasets?: boolean;
  extractBoundingBoxesForDataset?: boolean;
  hideDatasetS3forIsDocument?: boolean;
  hideDatasetDBConnectorforIsDocument?: boolean;
  hideEDANavLeft?: boolean;

  monitorsHideFeatureGroupRadio?: boolean;
  monitorsCreateAPIMethod?: (
    projectId,
    modelId,
    name,
    trainingFeatureGroupId,
    predictionFeatureGroupId,
    refreshSchedule,
    featureMappings,
    targetValue,
    targetValueBias,
    targetValuePerformance,
    trainingFeatureMappings,
    featureGroupBaseMonitorConfig,
    featureGroupComparisonMonitorConfig,
    cbFinish: (err: any, res: any) => void,
  ) => void;

  //Render
  rawDataSupportGrid?: boolean;
  renderFeatureType?: string[];
  renderFeatureMapping?: string[];
  renderFeatureMapping2?: string[];
  renderOne?: (data?: any, cols?: string[], extras?: { maxWW?: number; maxHH?: number; showBottomElem?: boolean; annotationsEditBaseLink?: string; rowId?: any }) => any;
  rawDataColumns?: (width?: number, isGrid?: boolean, cols?: string[], annotationsEditBaseLink?: string) => ITableExtColumn[];
  renderRawData?: (docStoreHelper: IDocStoreHelper, row: any) => any;
  renderRawDataGrid?: (docStoreHelper: IDocStoreHelper, row: any) => any;

  renderPreview?: (docStoreHelper: IDocStoreHelper, row: any) => any;
}

export const DocStoreDefForcedVision = {
  renderOne: (data, cols, extras) => {
    return <DocStoreRenderImage data={data} cols={cols} maxWW={extras?.maxWW} maxHH={extras?.maxHH} showBottomElem={extras?.showBottomElem === true} />;
  },

  featureGroupTypes: ['IMAGE_TABLE'],

  monitorsCreateAPIMethod: REClient_.client_().createVisionDriftMonitor,
  outliersShowImagesForMappings: ['IMAGE'],

  shadowFGMinColumnsLeft: 20,
  shodowFGColumns: ['doc_id'],
  shadowFGCustomRender: (row: any) => {
    if (row != null) {
      if (!Utils.isNullOrEmpty(row?.doc_id) && _.startsWith(row?.mime_type?.toLowerCase(), 'image/')) {
        return true;
      }
    }
    return false;
  },

  renderFeatureMapping: ['IMAGE'],
  renderFeatureMapping2: ['ACTUAL', 'TARGET'],

  showIsDocumentCheckboxForDatasets: true,
  useNewMonitoring: true,
  monitorsTypesListHide: ['dataIntegrity', 'bias'],
  monitorsTypesListSelect: ['drift'],

  navLeftHidePartsLinks: [PartsLink.monitor_data_integrity, PartsLink.monitor_drift_analysis],
} as IDocStoreDef;

export const DocStoreDefs: IDocStoreDef[] = (
  [
    {
      type: DocStoreType.pdf_project, //Repeated for projects Definitions

      useCases: ['NAMED_ENTITY_RECOGNITION'],
      showIsDocumentCheckboxForDatasets: false,
      extractBoundingBoxesForDataset: true,
    },
    {
      type: DocStoreType.pdf_project, //Repeated for projects Definitions

      useCases: ['NLP_SEARCH', 'NLP_CHAT'],
      showIsDocumentCheckboxForDatasets: true,
      extractBoundingBoxesForDataset: false,
    },
    {
      type: DocStoreType.pdf, //Repeated for useCase Definitions

      featureGroupTypes: ['DOCUMENTS'],
      featureGroupFeatureTypesNeeded: ['OBJECT_REFERENCE'],
      showIsDocumentCheckboxForDatasets: true,
      extractBoundingBoxesForDataset: true,

      annotationTypeKey: 'bounding_box',
      annotationSupport: true,
      annotationRender: ({ readonly, extractedFeatures, docId, pageNumber, isProcessingOCR, isLoadingImage, selRectListOri, onNeedCurrentLabel, onChangeAnnotations, onMouseEnterLabel, data, showReviewNotStartedWarning }) => {
        return (
          <AnnotationEditorImages
            readonly={readonly}
            extractedFeatures={extractedFeatures}
            onMouseEnterLabel={onMouseEnterLabel}
            data={data}
            docId={docId}
            pageNumber={pageNumber}
            selRectListOri={selRectListOri}
            onNeedCurrentLabel={onNeedCurrentLabel}
            onIsProcessingOCR={isProcessingOCR}
            onIsLoadingImage={isLoadingImage}
            onChangeAnnotations={onChangeAnnotations}
            showReviewNotStartedWarning={showReviewNotStartedWarning}
          />
        );
      },

      renderFeatureMapping: ['DOCUMENT_ID'],
      rowIdentifierFeatureMapping: 'ROW_ID',
      renderFeatureType: ['OBJECT_REFERENCE'],
      renderOne: (data, cols, extras) => {
        return (
          <DocStoreRenderImage
            data={data}
            cols={cols}
            showBottomElem={extras?.showBottomElem === true}
            calcDocId={(id1) => calcRealId(id1, 0)}
            maxWW={extras?.maxWW}
            maxHH={extras?.maxHH}
            annotationsEditBaseLink={extras?.annotationsEditBaseLink}
            rowId={extras?.rowId}
          />
        );
      },
      rawDataSupportGrid: true,
      rawDataColumns: memoizeOne((width, isGrid, cols, annotationsEditBaseLink) => {
        let colsCount = !isGrid ? 1 : width == null ? 1 : Math.trunc(width / DocStoreImageSizePxWW);

        let res = [];

        for (let i = 0; i < (colsCount ?? 1); i++) {
          res.push({
            noAutoTooltip: true,
            disableSort: true,
            forceNoWrap: true,
            title: 'PDF',
            render: (text, row, index) => {
              return <DocStoreRenderImage data={colsCount <= 1 ? row : row?.[i]} cols={cols} showBottomElem={true} calcDocId={(id1) => calcRealId(id1, 0)} annotationsEditBaseLink={annotationsEditBaseLink} />;
            },
          } as ITableExtColumn);
        }

        return res;
      }),
    },
    {
      type: DocStoreType.vision,

      useCases: ['VISION', 'VISION_OBJECT_DETECTION', 'VISION_CLASSIFICATION', 'VISION_REGRESSION'],
      featureGroupTypes: ['IMAGE_TABLE'],

      shadowFGMinColumnsLeft: 20,
      shodowFGColumns: ['doc_id'],
      shadowFGCustomRender: (row: any) => {
        if (row != null) {
          if (!Utils.isNullOrEmpty(row?.doc_id) && _.startsWith(row?.mime_type?.toLowerCase(), 'image/')) {
            return true;
          }
        }
        return false;
      },

      columnSqlFeatureMapping: 'TARGET',
      outliersShowImagesForMappings: ['IMAGE'],

      showIsDocumentCheckboxForDatasets: true,
      extractBoundingBoxesForDataset: false,
      hideDatasetDBConnectorforIsDocument: true,
      hideEDANavLeft: true,

      // monitorsHideFeatureGroupRadio: true,
      // monitorsCreateAPIMethod: REClient_.client_().createVisionDriftMonitor,

      calcSqlForFilter(value, colFilterName) {
        if (Utils.isNullOrEmpty(value)) {
          return null;
        } else {
          return `SELECT * FROM fg WHERE ${colFilterName} LIKE "%${value}%"`;
        }
      },

      renderFeatureMapping: ['IMAGE'],
      renderFeatureMapping2: ['ACTUAL', 'TARGET'],
      renderOne: (data, cols, extras) => {
        return <DocStoreRenderImage data={data} cols={cols} maxWW={extras?.maxWW} maxHH={extras?.maxHH} showBottomElem={extras?.showBottomElem === true} />;
      },
      rawDataSupportGrid: true,
      rawDataColumns: memoizeOne((width, isGrid, cols, annotationsEditBaseLink) => {
        let colsCount = !isGrid ? 1 : width == null ? 1 : Math.trunc(width / DocStoreImageSizePxWW);

        let res = [];

        for (let i = 0; i < (colsCount ?? 1); i++) {
          res.push({
            noAutoTooltip: true,
            disableSort: true,
            forceNoWrap: true,
            title: 'Image',
            render: (text, row, index) => {
              return <DocStoreRenderImage data={colsCount <= 1 ? row : row?.[i]} cols={cols} showBottomElem={true} />;
            },
          } as ITableExtColumn);
        }

        return res;
      }),

      navLeftHidePartsLinks: [PartsLink.monitor_data_integrity, PartsLink.monitor_drift_analysis],

      allowRawDataFilters: true,
      allowRawDataSqlFilters: true,
      allowRawDataFiltersColumns: true,
      allowRawDataNumberOfColumns: true,
      allowRawDataPrompts: true,
      // allowPredAPI: false,
    },
  ] as IDocStoreDef[]
).map((d1) => {
  d1.useCases = d1.useCases?.map((s1) => s1?.toUpperCase());
  d1.problemTypes = d1.problemTypes?.map((s1) => s1?.toUpperCase());
  d1.featureGroupTypes = d1.featureGroupTypes?.map((s1) => s1?.toUpperCase());
  d1.shodowFGColumns = d1.shodowFGColumns?.map((s1) => s1.toLowerCase());

  return d1;
});

export const calcDocStoreDefFromProject: (projectOne?) => IDocStoreDef = memoizeOne((projectOne?) => {
  if (projectOne == null) {
    return null;
  }

  let res = null;
  let useCase1 = projectOne?.useCase?.toUpperCase();
  if (!Utils.isNullOrEmpty(useCase1)) {
    DocStoreDefs.some((d1) => {
      if (d1?.useCases?.includes(useCase1)) {
        res = d1;
        return true;
      }
    });
  }

  return res;
});

export const calcDocStoreDefFromFeatureGroup: (featureGroupOne?) => IDocStoreDef = memoizeOne((featureGroupOne?) => {
  if (featureGroupOne == null) {
    return null;
  }

  let res = null;

  let featureGroupType1 = featureGroupOne?.featureGroupType?.toUpperCase();
  if (!Utils.isNullOrEmpty(featureGroupType1)) {
    DocStoreDefs.some((d1) => {
      if (d1?.featureGroupTypes?.includes(featureGroupType1)) {
        let isMappingSpecialOk = true;
        if (d1?.featureGroupFeatureTypesNeeded != null && d1?.featureGroupFeatureTypesNeeded?.length > 0) {
          let typesNeededList = [...(d1?.featureGroupFeatureTypesNeeded ?? [])];

          calcSchemaForFeature(featureGroupOne)?.some((f1) => {
            let featureType1 = f1?.featureType;
            if (d1?.featureGroupFeatureTypesNeeded?.includes(featureType1)) {
              typesNeededList = typesNeededList.filter((s1) => s1?.toUpperCase() !== featureType1?.toUpperCase());
            }
          });

          if (typesNeededList.length > 0) {
            isMappingSpecialOk = false;
          }
        }
        if (!isMappingSpecialOk) {
          return;
        }

        res = d1;
        return true;
      }
    });
  }

  return res;
});
