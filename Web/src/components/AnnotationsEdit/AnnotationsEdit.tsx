import Button from 'antd/lib/button';
import $ from 'jquery';
import * as _ from 'lodash';
import * as React from 'react';
import { PropsWithChildren, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import SplitPane from 'react-split-pane';
import AutoSizer from 'react-virtualized/dist/commonjs/AutoSizer';
import REActions from '../../actions/REActions';
import { TokenAnnotator } from '../../libs/text-annotate';
import AnnotationsTag from '../AnnotationsTag/AnnotationsTag';
import ModalConfirm from '../ModalConfirm/ModalConfirm';
import TooltipExt from '../TooltipExt/TooltipExt';
// import { TAGS as DEFAULT_TAGS, DEFAULT_TEXT, SELECTED_ANNOTATIONS as DEFAULT_SELECTED_ANNOTATIONS } from "./DummyData";
import Location from '../../../core/Location';
import { useDocStoreFromFeatureGroup, useFeatureGroup } from '../../api/REUses';
import { IAnnotationsTag } from '../AnnotationsTag/AnnotationsTagInterface';
import NanoScroller from '../NanoScroller/NanoScroller';
import PartsLink from '../NavLeft/PartsLink';
import { topAfterHeaderHH } from '../ProjectsList/ProjectsList';
import { IAnnotationsEditProps, IErrorMessages, ITokenAnnotatorTag } from './AnnotationsEditInterface';

import QuestionCircleOutlined from '@ant-design/icons/QuestionCircleOutlined';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Input from 'antd/lib/input';
import { InputNumber } from 'antd';
import Modal from 'antd/lib/modal';
import Slider from 'antd/lib/slider';
import classNames from 'classnames';
import Utils from '../../../core/Utils';
import { DocStoreDefs, DocStoreType } from '../../api/DocStoreInterfaces';
import REClient_ from '../../api/REClient';
import Constants from '../../constants/Constants';
import StoreActions from '../../stores/actions/StoreActions';
import { FeatureGroupLifecycle } from '../../stores/reducers/featureGroups';
import { ISelRect } from '../AnnotationEditorImages/AnnotationEditorImages';
import EditorElem from '../EditorElem/EditorElem';
import { calcSchemaForFeature } from '../FeaturesOneAdd/FeatureType';
import HelpIcon from '../HelpIcon/HelpIcon';
import NLPEntitiesColorsList from '../NLPEntitiesColorsList/NLPEntitiesColorsList';
import NLPEntitiesTables from '../NLPEntitiesTables/NLPEntitiesTables';
import RefreshAndProgress from '../RefreshAndProgress/RefreshAndProgress';
import SelectExt from '../SelectExt/SelectExt';
import WindowSizeSmart from '../WindowSizeSmart/WindowSizeSmart';
import { IDataListOnePdf } from './IDataListOnePdf';
import Checkbox from 'antd/lib/checkbox';
import { Upload } from 'antd';
import { InboxOutlined } from '@ant-design/icons';

const stylesDark = require('../antdUseDark.module.css');
const styles = require('./AnnotationsEdit.module.css');

const annotationTypeKeyDefault = 'text_extraction_list';

const annotationPdfFilename = 'file_path';

const allowMultiLabels = false;
const doneStatus = 'done';
const inProgressStatus = 'in_progress';
const todoStatus = 'todo';

const NavigationButton = (props) => {
  return (
    <TooltipExt title={props.title}>
      <Button className={classNames(styles.navigateButton, styles.transitionNone, props.className)} ghost disabled={props.disabled} onClick={props.onClick} size="middle">
        {props.children}
      </Button>
    </TooltipExt>
  );
};

const NavigationIconButton = ({ icon, ...rest }) => {
  return (
    <NavigationButton {...rest}>
      <FontAwesomeIcon icon={icon} transform={{ size: 14 }} className={styles.chevron} />
    </NavigationButton>
  );
};

export interface IAnnotationEntry {
  annotation?: {
    annotationType?: string;
    annotationValue?: any;
  };
  annotationSource?: string;
  organizationId?: string;
  featureGroupId?: string;
  featureName?: string;
  featureGroupAnnotationKeyValue?: string;
  docId?: string;
  updatedByUserId?: string;
  updatedAt?: string;
}

export interface IAnnotationsStatus {
  total?: number;
  done?: number;
  inProgress?: number;
  todo?: number;
}

const ERROR_MESSAGES: IErrorMessages = {
  EMPTY_TAG: {
    type: 'EMPTY_TAG',
    message: 'Label field can not be empty!',
  },
  REPEATING_TAG: {
    type: 'REPEATING_TAG',
    message: 'You can not add labels with the same name',
  },
  EXISTING_TAG: {
    type: 'EXISTING_TAG',
    message: 'You added a label that already exists in the list',
  },
};

const AnnotationsEdit = React.memo((props: PropsWithChildren<IAnnotationsEditProps>) => {
  const { paramsProp, authUser } = useSelector((state: any) => ({
    paramsProp: state.paramsProp,
    authUser: state.authUser,
  }));

  const calcColor = (text, index?) => {
    if (index != null) {
      return Utils.getColorForWhiteText(index ?? 0);
    } else {
      return Utils.stringToColorHex(text, true);
    }
  };

  const calcDataIndex = (docId, docIdPage, featureGroupRowIdentifier = null) => {
    let dataIndex = null;
    const isPdf = docStoreDef?.type === DocStoreType.pdf;
    docIdPage = docIdPage ?? 1;

    if (isPdf) {
      if (featureGroupRowIdentifier && fgFieldRowId) {
        dataIndex = (fgDataList as IDataListOnePdf[])?.findIndex((d1) => d1?.docId === docId && d1?.page === docIdPage && d1?.data?.[fgFieldRowId] == featureGroupRowIdentifier);
      } else if (featureGroupRowIdentifier) {
        dataIndex = (fgDataList as IDataListOnePdf[])?.findIndex((d1) => d1?.docId === docId && d1?.page === docIdPage && d1?.rowId == featureGroupRowIdentifier);
      } else if (docId != null) {
        dataIndex = (fgDataList as IDataListOnePdf[])?.findIndex((d1) => d1?.docId === docId && d1?.page === docIdPage);
      }
    } else {
      if (docId != null) {
        dataIndex = _.findIndex(fgDataList, (f1) => f1?.[fgFieldDocumentId] === docId);
      } else if (featureGroupRowIdentifier != null) {
        const featureAnnotationConfigs = featureGroupOne?.annotationConfig?.featureAnnotationConfigs;
        const config1 = featureAnnotationConfigs?.find((f1) => f1?.name === fgFieldAnnotations) as { annotationType?; docIdFeature?; featureGroupRowIdentifierFeature? };
        dataIndex = _.findIndex(fgDataList, (f1) => f1?.[config1?.featureGroupRowIdentifierFeature] === featureGroupRowIdentifier);
      }
    }
    return dataIndex;
  };

  const calcNextAvailableDataIndex = (existingRowIds: string[]) => {
    const rowIdCol = fgFieldRowId ?? fgFieldDocumentId;
    if (isPdf) {
      return (fgDataList as IDataListOnePdf[])?.findIndex((d1) => !existingRowIds.includes(d1?.data?.[rowIdCol]));
    }
    return fgDataList?.findIndex((f1) => !existingRowIds.includes(f1?.[rowIdCol]));
  };

  let projectId = paramsProp?.get('projectId');
  if (projectId === '-') {
    projectId = null;
  }
  const featureGroupId = paramsProp?.get('featureGroupId');

  const [DEFAULT_TEXT, setDEFAULT_TEXT] = useState('');

  const [isReady, setIsReady] = useState(false);
  const [isReadyTags, setIsReadyTags] = useState(false);

  const [isReading, setIsReading] = useState(false);
  const [isFixing, setIsFixing] = useState(false);
  const [isAddingAnnotationFeature, setIsAddingAnnotationFeature] = useState(false);
  const [currentReadData, setCurrentReadData] = useState(null);
  const [currentReadRawAnnotation, setCurrentReadRawAnnotation] = useState(null);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [pageHasChanges, setPageHasChanges] = useState<boolean>(false);
  const [textWithoutTag, setTextWithoutTag] = useState(null);
  const [tags, setTags] = useState<IAnnotationsTag[]>(null);
  const [tagsRead, setTagsRead] = useState<string[]>(null);
  const [tempTags, setTempTags] = useState<IAnnotationsTag[]>([]);
  const [newTag, setNewTag] = useState<string | null>(null);
  const [importedLabelsFile, setImportedLabelsFile] = useState(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isStartingReview, setIsStartingReview] = useState<boolean>(false);
  const [editTagMode, setEditTagMode] = useState<boolean>(false);
  const [selectedTag, setSelectedTag] = useState<IAnnotationsTag>(null);
  const [labelFilter, setLabelFilter] = useState<string>('');
  const [annotationState, setAnnotationState] = useState<{ value: { start?: number; end?: number; tokens?: string[]; tag?: string; color?: string }[]; tag: string | null; status: string | null; isValid: boolean; userName?: string | null }>(
    {
      value: [],
      tag: null,
      status: null,
      isValid: true,
    },
  );
  const [tagsHH, setTagsHH] = useState(0);
  const [fgDataList, setFgDataList] = useState(null);

  const [needsMaterialization, setNeedsMaterialization] = useState(false);
  const [isAnnotationsPopulated, setIsAnnotationsPopulated] = useState(false);
  const [isProcessingOCR, setIsProcessingOCR] = useState(false);
  const [isLoadingImage, setIsLoadingImage] = useState(false);
  const [selRectList, setSelRectList] = useState(null as ISelRect[]); // current selection rectangles
  const [editorHeight, setEditorHeight] = useState(0);
  const [payload, setPayload] = useState(null);
  const [selRectListOri, setSelRectListOri] = useState(null as ISelRect[]); // original selection rectangles
  const [formattedAnnotations, setFormattedAnnotations] = useState(null);
  const [topHoverValue, setTopHoverValue] = useState(null);
  const [annotationStatus, setAnnotationStatus] = useState<IAnnotationsStatus>(null);
  const [isLockExpired, setIsLockExpired] = useState(false);
  const [isCommentsModalVisible, setIsCommentsModalVisible] = useState(false);
  const [comments, setComments] = useState(null);
  const [useCommentsJsonEditor, setUseCommentsJsonEditor] = useState(false);
  const [currentCommentsColumn, setCurrentCommentsColumn] = useState(null);
  const featureGroupOne = useFeatureGroup(projectId, featureGroupId);
  const isStatusDone = annotationState?.status === doneStatus;
  const isDocInvalidForReview = !annotationState?.isValid;

  const docStoreDefFG = useDocStoreFromFeatureGroup(featureGroupOne);
  const docStoreDef = useMemo(() => {
    if (props.isPredDash) {
      return DocStoreDefs.find((d1) => d1.type === DocStoreType.pdf && d1.featureGroupFeatureTypesNeeded?.length > 0);
    } else if (docStoreDefFG == null) {
      return featureGroupOne == null ? undefined : docStoreDefFG;
    } else {
      return docStoreDefFG?.annotationSupport === true ? docStoreDefFG : null;
    }
  }, [docStoreDefFG, featureGroupOne, props.isPredDash]);

  const isPdf = docStoreDef?.type === DocStoreType.pdf;
  const annotationTypeKeyUsed = docStoreDef?.annotationTypeKey ?? annotationTypeKeyDefault;
  const lastReadIndex = useRef(null);

  let dataIndexParam = Utils.tryParseInt(paramsProp?.get('dataIndex'));
  let docId = paramsProp?.get('docId');
  if (docId === '') {
    docId = null;
  }
  let docIdPage = Utils.tryParseInt(paramsProp?.get('docIdPage'));
  let docIdIsFile = paramsProp?.get('docIdIsFile') === '1';

  let rowId = paramsProp?.get('rowId');
  if (rowId === '') {
    rowId = null;
  }

  if (dataIndexParam == null || dataIndexParam === -1) {
    dataIndexParam = calcDataIndex(docId, docIdPage, rowId) ?? 0;
  }
  const [currentDataListIndex, setCurrentDataListIndex] = useState(dataIndexParam);
  const [docNumber, setDocNumber] = useState(0);
  const [docNumberEditing, setDocNumberEditing] = useState(false);
  const [pageNumber, setPageNumber] = useState(0);
  const [pageNumberEditing, setPageNumberEditing] = useState(false);

  const getIdsFromFgDataIndex = (fgDataListIndex: number) => {
    if (fgDataList == null) {
      return { docId: null, rowId: null };
    }
    const isPdf = docStoreDef?.type === DocStoreType.pdf;
    const indexData = fgDataList?.[fgDataListIndex];
    const docId = isPdf ? indexData?.data?.[fgFieldDocumentId] : indexData?.[fgFieldDocumentId];
    const rowId = isPdf ? indexData?.data?.[fgFieldRowId ?? fgFieldDocumentId] : indexData?.[fgFieldRowId ?? fgFieldDocumentId];
    return { docId, rowId };
  };

  useEffect(() => {
    setTags(null);
    setNewTag(null);
    setTagsHH(0);
    setIsSaving(false);
    setEditTagMode(false);
    setSelectedTag(null);
    setAnnotationState({ value: [], tag: null, status: null, isValid: true });
    setFgDataList(null);
    setIsReading(false);
    setIsLoadingData(false);
    setIsLoadingImage(false);
    setTopHoverValue(null);
    setTextWithoutTag(null);
    setPageHasChanges(false);
    setIsFixing(false);
    setIsReady(false);
    setIsReadyTags(false);
    setCurrentReadData(null);
    setCurrentReadRawAnnotation(null);
    lastReadIndex.current = null;
  }, [props.forceDataList]);

  const redirectIfNeeded = (ind = null, list = null) => {
    const doWork = (ind, list) => {
      if (list == null) {
        return;
      }

      const isPdf = docStoreDef?.type === DocStoreType.pdf;

      let anyDocIdChanges = false;
      let anyDocIdDict: any = {};
      if (isPdf) {
        if ((paramsProp?.get('docId') || '') !== (list?.[ind]?.docId || '')) {
          anyDocIdChanges = true;
          anyDocIdDict['docId'] = encodeURIComponent(list?.[ind]?.docId || '');
        }
        if ((paramsProp?.get('docIdPage') || 0) !== (list?.[ind]?.page || 0)) {
          anyDocIdChanges = true;
          anyDocIdDict['docIdPage'] = list?.[ind]?.page || 0;
        }
        if ((paramsProp?.get('docIdIsFile') === '1') !== (list?.[ind]?.isFile === true)) {
          anyDocIdChanges = true;
          anyDocIdDict['docIdIsFile'] = list?.[ind]?.isFile === true ? '1' : '';
        }
      }

      if (Utils.tryParseInt(paramsProp?.get('dataIndex'), 0) !== ind || anyDocIdChanges) {
        setTimeout(() => {
          Location.push(window.location.pathname, undefined, Utils.processParamsAsQuery(_.assign({ dataIndex: ind ?? 0 }, anyDocIdDict ?? {}), window.location.search));
        }, 0);
      }
    };

    setCurrentDataListIndex((indT) => {
      if (ind == null) {
        ind = indT;
      }

      setFgDataList((listT) => {
        if (list == null) {
          list = listT;
        }

        doWork(ind, list);

        return listT;
      });

      return indT;
    });
  };

  useEffect(() => {
    setCurrentDataListIndex((ind1) => {
      if (ind1 !== dataIndexParam) {
        ind1 = dataIndexParam;
      }

      redirectIfNeeded(ind1);

      return ind1;
    });
  }, [dataIndexParam, fgDataList, docId, docIdIsFile, docIdPage]);

  const labelsListRef = useRef(null);
  const labelsList: string[] = useMemo(() => {
    let res = null;

    if (props.isPredDash) {
      let forceLabels = props.forceDataList?.[currentDataListIndex]?.forceLabels ?? null;
      res = forceLabels ?? [];
    } else {
      res = featureGroupOne?.annotationConfig?.labels?.map((l1) => l1?.name)?.filter((s1) => !Utils.isNullOrEmpty(s1));
      if (res == null && isReady && featureGroupOne != null && featureGroupOne?.latestFeatureGroupVersion != null) {
        res = [];
      }
    }

    if (labelsListRef.current != null && _.isEqual(labelsListRef.current, res)) {
      return labelsListRef.current;
    }
    labelsListRef.current = res;
    return res;
  }, [featureGroupOne, isReady, props.isPredDash, props.forceDataList, currentDataListIndex]);

  useEffect(() => {
    if (labelsList == null) {
      return;
    }

    setTags((tt) => {
      tt ??= [];

      labelsList?.some((s1) => {
        if (!tt?.some((t1) => t1?.label === s1)) {
          tt.push({
            label: s1,
            value: s1,
            isUsed: true,
            color: calcColor(s1),
          });
        }
      });

      if (tt != null) {
        tt = [...tt];
        tt.some((t1, ind) => {
          t1.color = calcColor('', ind);
        });
      }

      return tt;
    });

    setTagsRead((tt) => {
      labelsList?.some((s1) => {
        if (!tt?.includes(s1)) {
          tt ??= [];
          tt.push(s1);
        }
      });

      if (tt != null) {
        tt = [...tt];
      }

      return tt;
    });

    setIsReadyTags(true);
  }, [labelsList]);

  const { fgFieldDocumentId, fgFieldRowId, fgFieldDocument, fgFieldAnnotations, fgFieldStatus, fgFieldComments, fgFieldMetadata, fgFieldObjectReference } = useMemo(() => {
    let fgFieldDocumentId = null,
      fgFieldRowId = null,
      fgFieldDocument = null,
      fgFieldAnnotations = null,
      fgFieldStatus = null,
      fgFieldMetadata = null,
      fgFieldObjectReference = null;
    let fgFieldComments = [];

    if (docStoreDef !== undefined) {
      calcSchemaForFeature(featureGroupOne)?.some((f1) => {
        let name1 = f1?.name;
        switch (f1?.featureMapping?.toUpperCase()) {
          case 'ANNOTATIONS':
            fgFieldAnnotations = name1;
            break;
          case 'DOCUMENT_ID':
            fgFieldDocumentId = name1;
            break;
          case 'ROW_ID':
            fgFieldRowId = name1;
            break;
          case 'DOCUMENT':
            fgFieldDocument = name1;
            break;
          case 'STATUS':
            fgFieldStatus = name1;
            break;
          case 'COMMENTS':
            fgFieldComments.push(name1);
            break;
          case 'METADATA':
            fgFieldMetadata = name1;
            break;
        }

        switch (f1?.featureType?.toUpperCase()) {
          case 'OBJECT_REFERENCE':
            fgFieldObjectReference = name1;
            break;
        }
      });
    }

    return { fgFieldObjectReference, fgFieldDocumentId, fgFieldRowId, fgFieldDocument, fgFieldStatus, fgFieldComments, fgFieldMetadata, fgFieldAnnotations };
  }, [featureGroupOne, docStoreDef]);

  const { currentDocId, currentRowId } = useMemo(() => {
    const fgIds = getIdsFromFgDataIndex(currentDataListIndex);
    return { currentDocId: fgIds.docId, currentRowId: fgIds.rowId };
  }, [currentDataListIndex, fgFieldDocumentId, fgFieldRowId, fgDataList, docStoreDef]);

  const getAnnotationsStatus = (checkForMaterialization: boolean, cbFinish?: (isOk: boolean, res: any) => void) => {
    REClient_.client_().getAnnotationsStatus(featureGroupId, fgFieldAnnotations, checkForMaterialization, (err, res) => {
      if (err || !res?.success) {
        cbFinish?.(false, null);
        return;
      }
      cbFinish?.(true, res?.result);
    });
  };

  useEffect(() => {
    if (props.isPredDash) {
      setNeedsMaterialization(false);
      return;
    }

    if (featureGroupOne == null) {
      setNeedsMaterialization(false);
      return;
    }

    getAnnotationsStatus(true, (isOk, res) => {
      if (isOk) {
        setIsAnnotationsPopulated(res?.latestMaterializedAnnotationConfig != null);
        setNeedsMaterialization(res?.isMaterializationNeeded ?? false);
      } else {
        REActions.addNotificationError(Constants.errorDefault);
        setNeedsMaterialization(true);
      }
    });

    setNeedsMaterialization(false);
  }, [featureGroupOne, docStoreDef, props.isPredDash, fgFieldAnnotations]);

  const needsMaterializationAndInProgress = useMemo(() => {
    if (featureGroupOne == null) {
      return false;
    }
    if (!needsMaterialization) {
      return false;
    }
    let res = [FeatureGroupLifecycle.GENERATING, FeatureGroupLifecycle.PENDING].includes(featureGroupOne?.latestFeatureGroupVersion?.status?.toUpperCase());
    if (res === true) {
      StoreActions.refreshDoFGVersionsAll_(projectId, featureGroupId, featureGroupOne?.latestFeatureGroupVersion?.featureGroupVersion);
    }
    return res;
  }, [featureGroupOne, projectId, featureGroupId, needsMaterialization]);

  const isMaterFailed = useMemo(() => {
    if (featureGroupOne?.latestFeatureGroupVersion == null) {
      return false;
    }
    return [FeatureGroupLifecycle.FAILED].includes(featureGroupOne?.latestFeatureGroupVersion?.status?.toUpperCase());
  }, [featureGroupOne, docStoreDef]);

  const isReviewMode = featureGroupOne?.projectConfig?.isReviewMode && !props.isPredDash;
  const saveMetadata = !Utils.isNullOrEmpty(fgFieldMetadata);
  const isReviewStarted = annotationState.status === inProgressStatus && !isLockExpired;
  const isReadOnly = props.isPredDash || !isReviewMode || !isReviewStarted;
  const isReadOnlyForTags = props.isPredDash || !isReviewMode;

  const callSetFeatureAnnotationRef = useRef(null);

  useEffect(() => {
    if (props.isPredDash) {
      if (docStoreDef?.type === DocStoreType.pdf) {
        setIsReady(true);
        return;
      }
      return;
    }

    if (needsMaterializationAndInProgress || isMaterFailed) {
      return;
    }
    if (!featureGroupId || featureGroupOne == null || callSetFeatureAnnotationRef.current === featureGroupId || !fgFieldAnnotations || !fgFieldDocumentId) {
      return;
    }

    if (docStoreDef === undefined) {
      return;
    }

    if (docStoreDef != null) {
      if (docStoreDef?.type === DocStoreType.pdf) {
        if (!fgFieldObjectReference) {
          return;
        }
      } else {
        if (!fgFieldDocument) {
          return;
        }
      }
    } else {
      if (!fgFieldDocument) {
        return;
      }
    }

    const featureAnnotationConfigs = featureGroupOne?.annotationConfig?.featureAnnotationConfigs;
    const config1 = featureAnnotationConfigs?.find((f1) => f1?.name === fgFieldAnnotations) as { annotationType?; docIdFeature?; featureGroupRowIdentifierFeature? };
    if (config1 != null) {
      if (config1.annotationType === annotationTypeKeyUsed && config1.docIdFeature === fgFieldDocumentId /*&& config1.featureGroupRowIdentifierFeature===fgFieldAnnotations*/) {
        callSetFeatureAnnotationRef.current = featureGroupId;
        setIsReady(true);
        return;
      }
    }

    callSetFeatureAnnotationRef.current = featureGroupId;

    REClient_.client_().setFeatureAsAnnotatableFeature(featureGroupId, fgFieldAnnotations, annotationTypeKeyUsed, fgFieldRowId, fgFieldDocumentId, projectId, (err, res) => {
      if (err) {
        Utils.error(err);
      }

      if (isReviewMode) {
        REClient_.client_().setAnnotationStatusFeature(featureGroupId, fgFieldStatus, (err, res) => {
          if (err) {
            Utils.error(err);
          }
          setIsReady(true);

          StoreActions.featureGroupsDescribe_(null, featureGroupId);
          StoreActions.featureGroupsDescribe_(projectId, featureGroupId);
        });
      } else {
        setIsReady(true);

        StoreActions.featureGroupsDescribe_(null, featureGroupId);
        StoreActions.featureGroupsDescribe_(projectId, featureGroupId);
      }
    });
  }, [featureGroupId, projectId, fgFieldDocument, annotationTypeKeyUsed, fgFieldDocument, featureGroupOne, needsMaterializationAndInProgress, isMaterFailed, docStoreDef, props.forceDataList, props.isPredDash]);

  const docNumberToDataIndex = (docNumber: number) => {
    if (docNumber == null) return -1;
    let dataListIndex = 0;
    if (docStoreDef?.type === DocStoreType.pdf) {
      const rowIdCol = fgFieldRowId ?? fgFieldDocumentId;
      const allRowIds = new Set(fgDataList?.map((f1) => f1?.data?.[rowIdCol]).filter((v1) => v1 != null));
      const docName = Array.from(allRowIds)[docNumber - 1];
      dataListIndex = fgDataList.findIndex((f1) => f1?.data?.[rowIdCol] === docName);
    } else {
      dataListIndex = docNumber - 1;
    }
    return dataListIndex;
  };

  const pageNumberToDataIndex = (pageNumber: number) => {
    if (pageNumber == null) return -1;
    const rowIdCol = fgFieldRowId ?? fgFieldDocumentId;
    return fgDataList.findIndex((f1) => f1?.data?.[rowIdCol] === currentDocId && f1?.page === pageNumber);
  };

  const handleChangeDocNumber = () => {
    const val = Utils.tryParseInt(docNumber);
    const dataIndex = docNumberToDataIndex(val);
    if (dataIndex != null && dataIndex >= 0) {
      redirectIfNeeded(dataIndex);
      setDocNumberEditing(false);
    }
  };

  const handleChangePageNumber = () => {
    const val = Utils.tryParseInt(pageNumber);
    const dataIndex = pageNumberToDataIndex(val);
    if (dataIndex != null && dataIndex >= 0) {
      redirectIfNeeded(dataIndex);
      setPageNumberEditing(false);
    }
  };

  const currentStringIndex: any = useMemo(() => {
    if (docStoreDef === undefined) {
      return {};
    }

    if (docStoreDef?.type === DocStoreType.pdf) {
      if (fgDataList?.[currentDataListIndex] == null) {
        return '...';
      }
      let docName = fgDataList?.[currentDataListIndex]?.filename;
      let docNumber = null;
      let totalDocsCount = null;
      let pageNumber = fgDataList?.[currentDataListIndex]?.page;
      let totalPageCount = fgDataList?.[currentDataListIndex]?.totalPages;

      if (fgFieldRowId) {
        let allRowIds = new Set(fgDataList?.map((f1) => f1?.data?.[fgFieldRowId]).filter((v1) => v1 != null));
        totalDocsCount = allRowIds.size;
        docName = fgDataList?.[currentDataListIndex]?.data?.[fgFieldRowId];
        docNumber = Array.from(allRowIds).indexOf(docName) + 1;
      } else {
        let allFileNames = [],
          lastFilename = null;
        fgDataList?.some((f1: IDataListOnePdf) => {
          let fn1 = f1?.filename;
          if (lastFilename !== fn1) {
            lastFilename = fn1;
            allFileNames.push(fn1);
          }
        });
        totalDocsCount = new Set(allFileNames ?? []).size;
        docNumber = allFileNames?.indexOf(docName) + 1;
      }

      return (
        <span>
          <span
            css={`
              opacity: 0.7;
            `}
          >
            File:{' '}
          </span>
          {docNumberEditing ? (
            <InputNumber
              defaultValue={docNumber}
              onPressEnter={handleChangeDocNumber}
              onChange={(val) => setDocNumber(Utils.tryParseInt(val))}
              onBlur={() => setDocNumberEditing(false)}
              autoFocus
              min={1}
              max={totalDocsCount}
              size="small"
              bordered={false}
              style={{ width: '35px' }}
              controls={false}
            />
          ) : (
            <TooltipExt title="Go to document">
              <span onClick={() => setDocNumberEditing(true)} className={styles.navigationLinkText}>
                {docNumber}
              </span>
            </TooltipExt>
          )}
          <span
            css={`
              opacity: 0.7;
            `}
          >
            {' '}
            of
          </span>{' '}
          {totalDocsCount} - '{docName || ''}' -
          <span
            css={`
              opacity: 0.7;
            `}
          >
            {' '}
            Page:{' '}
          </span>
          {pageNumberEditing ? (
            <InputNumber
              defaultValue={pageNumber}
              onPressEnter={handleChangePageNumber}
              onChange={(val) => setPageNumber(Utils.tryParseInt(val))}
              onBlur={() => setPageNumberEditing(false)}
              autoFocus
              min={1}
              max={totalPageCount}
              size="small"
              bordered={false}
              style={{ width: '35px' }}
              controls={false}
            />
          ) : (
            <TooltipExt title="Go to page">
              <span onClick={() => setPageNumberEditing(true)} className={styles.navigationLinkText}>
                {pageNumber}
              </span>
            </TooltipExt>
          )}
          <span
            css={`
              opacity: 0.7;
            `}
          >
            {' '}
            of
          </span>{' '}
          {totalPageCount}
        </span>
      );
    } else {
      return `${currentDataListIndex + 1} of ${fgDataList?.length ?? 0}`;
    }
  }, [currentDataListIndex, fgDataList, docStoreDef, docNumber, docNumberEditing, pageNumber, pageNumberEditing]);

  const doRead = (cbFinish?: (isOk: boolean, annotations: any[], annotationNotPresent: boolean) => void) => {
    if (props.isPredDash) {
      let forceAnnotations = props.forceDataList?.[currentDataListIndex]?.forceAnnotations ?? null;
      cbFinish?.(true, forceAnnotations ?? [], false);
      return;
    }
    if (docStoreDef === undefined) {
      cbFinish?.(false, null, false);
      return;
    }

    if (isReviewMode || isDocInvalidForReview) {
      REClient_.client_().verifyAndDescribeAnnotation(featureGroupId, fgFieldAnnotations, currentDocId, null, currentRowId, (err, res) => {
        if (err || !res?.success) {
          cbFinish?.(false, null, false);
          return;
        }

        if (res?.result?.verificationInfo?.annotationNotPresent) {
          cbFinish?.(true, [], true);
          return;
        }

        const annotations = res?.result?.annotation?.annotationValue;
        const status = res?.result?.status;
        const isValid = res?.result?.verificationInfo?.isValid;
        const userName = res?.result?.verificationInfo?.userName;
        const isLockExpired = res?.result?.verificationInfo?.isLockExpired;
        const comments = res?.result?.annotation?.comments;

        setIsLockExpired(isLockExpired ?? false);
        setComments(comments);
        if (isValid != true) {
          REActions.addNotification(res?.result?.verificationInfo?.message + '  Please try the next document' || Constants.errorDefault);
        }
        setAnnotationState({ ...annotationState, status: status, userName: userName, isValid: isValid });
        cbFinish?.(true, annotations, false);
      });
    } else {
      REClient_.client_().describeAnnotation(featureGroupId, fgFieldAnnotations, currentDocId, null, currentRowId, (err, res) => {
        const annotations = res?.result?.annotation?.annotationValue;
        const status = res?.result?.status;
        const comments = res?.result?.annotation?.comments;
        setAnnotationState({ ...annotationState, status: status });
        setComments(comments);

        if (err || !res?.success) {
          cbFinish?.(false, annotations, false);
        } else {
          cbFinish?.(true, annotations, false);
        }
      });
    }
  };

  const DEFAULT_TEXTsplit: string[] = useMemo(() => {
    if (DEFAULT_TEXT == null || DEFAULT_TEXT === '' || props.isPredDash) {
      return [];
    }

    let ss = DEFAULT_TEXT?.split(/[\r\n]/);
    let ss2: string[] = [];
    ss?.some((s1, s1ind) => {
      if (s1ind > 0) {
        ss2.push('\n');
      }
      ss2 = ss2.concat(s1.split(' '));
    });
    return ss2;
  }, [DEFAULT_TEXT]);

  const combineSingleEntityAnnotations = (annList: any[]) => {
    // Combine annotations that have the same entityId
    // If entityId is null, we don't combine

    const combinedAnnotations = new Map();
    const singleAnnotations = [];

    const len = annList?.length ?? 0;
    for (let i = 0; i < len; i++) {
      const annotation = annList[i];
      if (annotation?.entityId != null) {
        if (combinedAnnotations.has(annotation?.entityId)) {
          const existingAnnotation = combinedAnnotations.get(annotation?.entityId);
          existingAnnotation.boundingBox.push(annotation?.boundingBox);
          existingAnnotation.boundingBoxIds = Array.from(new Set(existingAnnotation?.boundingBoxIds.concat(annotation?.boundingBoxIds)));
        } else {
          if (Number.isInteger(annotation?.boundingBox?.[0])) {
            // Backward compatibility
            annotation.boundingBox = [annotation?.boundingBox];
          }
          annotation.boundingBoxIds = Array.from(new Set(annotation?.boundingBoxIds ?? []));
          combinedAnnotations.set(annotation.entityId, annotation);
        }
      } else {
        singleAnnotations.push(annotation);
      }
    }

    const combinedAnnotationsList = Array.from(combinedAnnotations.values());
    return combinedAnnotationsList.concat(singleAnnotations);
  };

  const annotationsToPayload = (list) => {
    if (!list) {
      return setPayload('');
    }

    let saveList = [];

    list?.forEach((r1) => {
      let boundingBoxIds = [];

      r1?.overlapSelRects?.some((rectInd) => {
        boundingBoxIds.push(rectInd); // rectInd is same as token index or boundingBoxId
      });

      saveList.push({
        boundingBoxIds,
        boundingBox: [r1?.x ?? 0, r1?.y ?? 0, (r1?.x ?? 0) + (r1?.width ?? 0), (r1?.y ?? 0) + (r1?.height ?? 0)],
        displayName: r1?.label,
        maxProbability: r1?.maxProbability,
        minProbability: r1?.minProbability,
        meanProbability: r1?.meanProbability,
        value: r1?.value,
        entityId: r1?.entityId,
        // task: taskId1,
      });
    });

    saveList = combineSingleEntityAnnotations(saveList);
    setPayload(JSON.stringify(saveList, null, 4));
  };

  const payloadToAnnotations = (list) => {
    let saveList: ISelRect[] = [];
    let hasBadKeys = false;
    const validateKeys = ['boundingBox', 'displayName', 'boundingBoxIds', 'value'];

    const validate = (item) => validateKeys.reduce((acc, key) => acc && item?.[key] !== undefined, true);

    list?.forEach?.((item) => {
      if (!validate(item)) hasBadKeys = true;
    });
    if (hasBadKeys) return;

    let entityId = 1;
    list?.forEach?.((a1) => {
      if (a1 == null) {
        return;
      }
      const previous = currentReadData?.find?.((item) => item?.entityId === a1?.entityId);
      let lineBoundingBoxes = a1?.boundingBox;
      if (!lineBoundingBoxes) return;
      if (typeof lineBoundingBoxes?.[0] === 'number') {
        // Backward compatibility
        lineBoundingBoxes = [lineBoundingBoxes];
      }

      // Get page numbers for each line spanning different pages. Need to do this as we
      // don't save page numbers in the annotation but rely on boundingBoxIds.
      // Only needed when there are multiple bounding boxes for a single annotation.
      let pageNumbers = [];
      if (lineBoundingBoxes?.length > 1) {
        let data1 = fgDataList?.[currentDataListIndex];
        const tokens = data1?.extractedFeatures?.tokens;
        if (tokens) {
          for (let i = 0; i < lineBoundingBoxes?.length; i++) {
            const token = getFirstEnclosedToken(lineBoundingBoxes?.[i], tokens, a1?.boundingBoxIds);
            pageNumbers.push(token?.page);
          }
        }
      }

      lineBoundingBoxes?.forEach((lineBoundingBox: number[], index: number) => {
        saveList.push({
          label: a1?.displayName,
          x: lineBoundingBox?.[0] ?? 0,
          y: lineBoundingBox?.[1] ?? 0,
          width: (lineBoundingBox?.[2] ?? 0) - (lineBoundingBox?.[0] ?? 0),
          height: (lineBoundingBox?.[3] ?? 0) - (lineBoundingBox?.[1] ?? 0),
          value: a1?.value ?? a1?.textExtraction?.textSegment?.phrase, // TODO: Value can be from describeAnnotation (initially) or can be edited (currently disabled)
          overlapSelRects: a1?.boundingBoxIds,
          maxProbability: a1?.maxProbability,
          minProbability: a1?.minProbability,
          ...(a1?.entityId && { entityId }),
          meanProbability: a1?.meanProbability,
          forcePageNumber: pageNumbers[index],
        });
      });
      entityId++;
    });

    setCurrentReadData(saveList);
  };

  const doSave = (showErr: boolean, status: string = null, comments: any = null, saveEmpty: boolean = false, cbFinish?: (isOk: boolean, res: any) => void) => {
    if (props.isPredDash) {
      cbFinish?.(true, null);
      return;
    }

    if (docStoreDef === undefined) {
      cbFinish?.(false, null);
      return;
    }

    const isPdf = docStoreDef?.type === DocStoreType.pdf;

    const doWorkList = (fgDataList) => {
      if (Utils.isNullOrEmpty(currentRowId)) return cbFinish?.(false, null);

      const document = (isPdf ? fgDataList?.[currentDataListIndex]?.data : fgDataList?.[currentDataListIndex])?.[fgFieldDocument];
      if (docStoreDef?.type === DocStoreType.pdf) {
        if (Utils.isNullOrEmpty(document)) {
          Utils.error('Document empty ' + document + ' ' + fgFieldDocument);
          cbFinish?.(false, null);
          return;
        }
      }

      let taskId1 = null;

      const doWork = (annList?: any[]) => {
        let finalStatus = status ?? (isReviewMode ? inProgressStatus : null);
        if (typeof comments === 'object') {
          comments = JSON.stringify(comments);
        } else if (typeof comments === 'string' && fgFieldComments?.length > 0) {
          let commentObj = {};
          commentObj[fgFieldComments[0]] = comments;
          comments = JSON.stringify(commentObj);
        }

        if (annList == null) {
          if (payload && typeof payload === 'string') {
            try {
              annList = JSON.parse(payload);
            } catch (ex) {
              if (showErr) {
                REActions.addNotificationError('Invalid Annotation: Annotation value is not a valid JSON string');
              }
              setIsSaving(false);
              return;
            }
          } else {
            annList = [];
          }
        }

        REClient_.client_().addAnnotation(
          { annotationType: annotationTypeKeyUsed, annotationValue: saveEmpty ? [] : annList },
          featureGroupId,
          fgFieldAnnotations,
          currentDocId,
          document,
          null,
          currentRowId,
          'ui',
          finalStatus,
          comments,
          projectId,
          saveMetadata,
          (err, res) => {
            setIsSaving(false);

            if (err || !res?.success) {
              if (showErr) {
                REActions.addNotificationError(err || Constants.errorDefault);
              }
              cbFinish?.(false, res);
            } else {
              const annotations = res?.result?.annotation?.annotationValue;
              const isValid = res?.result?.verificationInfo?.isValid;
              const userName = res?.result?.verificationInfo?.userName;
              if (isValid === false) {
                StoreActions.featureGroupsDescribe_(null, featureGroupId);
                StoreActions.featureGroupsDescribe_(projectId, featureGroupId);
                REActions.addNotification(res?.result?.verificationInfo?.message + '  Please try the next document' || Constants.errorDefault);
                setAnnotationState({ ...annotationState, status: status, userName: userName, isValid: isValid });
                cbFinish?.(false, res);
              } else {
                setAnnotationState({ ...annotationState, status: status, userName: userName, isValid: isValid });
                setCurrentReadRawAnnotation(annotations);
              }
              cbFinish?.(true, res);
            }
          },
        );
      };

      const doWorkInter = () => {
        if (isPdf) {
          doWork();
        } else {
          setAnnotationState((state1) => {
            let annotationsList = [];
            state1?.value?.some((v1) => {
              if (v1?.start == null || v1?.end == null) {
                return;
              }

              let start1 = 0;
              for (let i = 0; i < v1?.start; i++) {
                let s1 = DEFAULT_TEXTsplit?.[i];

                start1 += s1?.length ?? 0;

                if (s1 !== '\n' && s1 !== ' ' && DEFAULT_TEXTsplit?.[i + 1] !== '\n') {
                  start1 += 1;
                }
              }

              let end1 = start1;
              if (v1?.end >= v1?.start) {
                for (let i = v1?.start; i < v1?.end; i++) {
                  let s1 = DEFAULT_TEXTsplit?.[i];

                  end1 += s1?.length ?? 0;

                  if (s1 !== '\n' && s1 !== ' ' && DEFAULT_TEXTsplit?.[i + 1] !== '\n') {
                    end1 += 1;
                  }
                }
              }

              annotationsList.push({
                textExtraction: {
                  textSegment: {
                    startOffset: start1,
                    endOffset: end1,
                  },
                },
                displayName: v1?.tag,
                task: taskId1,
              });
            });

            doWork(annotationsList ?? []);

            return state1;
          });
        }
      };

      setIsReading((isR) => {
        if (!isR) {
          setPageHasChanges((ch1) => {
            setIsSaving(true);
            doWorkInter();
            return ch1;
          });
        }

        return isR;
      });
    };

    setFgDataList((list) => {
      doWorkList(list);

      return list;
    });
  };

  const handleCloseSelectTagModal = (): void => {
    setTextWithoutTag(null);
  };

  const checkExistingTags = (tags: IAnnotationsTag[], newArrayOfTagNames: string[]): boolean => {
    let hasExistingTags: boolean = false;

    tags?.forEach((tag: IAnnotationsTag) => {
      newArrayOfTagNames?.forEach((newTag: string) => {
        if (tag?.value?.toLowerCase() === newTag.toLowerCase()) hasExistingTags = true;
      });
    });

    return hasExistingTags;
  };

  const checkRepeatingTags = (newArrayOfTagNames: string[]): boolean => {
    const lowerCasedNames = newArrayOfTagNames.map((tag: string) => tag.toLowerCase());

    return new Set(lowerCasedNames).size !== lowerCasedNames.length;
  };

  const setErrorMessage = (errorMessageType: string) => {
    REActions.addNotificationError(ERROR_MESSAGES[errorMessageType].message);
  };

  const handleSubmitAddTags = (useRefOne): Promise<boolean> => {
    return new Promise((resolveAll) => {
      let tn1 = useRefOne ? tagModalNewTagRef.current : newTag;

      let errorType: string = null;

      let newArrayOfTagNames: string[] | [] = [_.trim(tn1 || '')]; // tn1?.split(",")?.map(s1 => _.trim(s1 || ''))?.filter(s1 => !Utils.isNullOrEmpty(s1)) || [];
      newArrayOfTagNames = newArrayOfTagNames?.filter((s1) => !Utils.isNullOrEmpty(s1));

      const hasExistingTagsInTheList: boolean = checkExistingTags(tags, newArrayOfTagNames);
      const hasRepeatingTags: boolean = checkRepeatingTags(newArrayOfTagNames);

      if (!newArrayOfTagNames?.length) errorType = ERROR_MESSAGES.EMPTY_TAG.type;
      if (hasRepeatingTags) errorType = ERROR_MESSAGES.REPEATING_TAG.type;
      if (hasExistingTagsInTheList) errorType = ERROR_MESSAGES.EXISTING_TAG.type;

      if (errorType) {
        setErrorMessage(errorType);
        resolveAll(false);
        return;
      }

      const newArrayOfTags: IAnnotationsTag[] | [] = newArrayOfTagNames?.map((tagName: string) => ({
        label: tagName,
        value: tagName,
        isUsed: false,
        color: calcColor(tagName),
      }));

      const doWork = () => {
        return new Promise<boolean>((resolve, reject) => {
          resolve(true);
          resolveAll(true);

          setTags((prevTags) => {
            let res = [...prevTags, ...newArrayOfTags];

            res.some((t1, ind) => {
              t1.color = calcColor('', ind);
            });

            return res;
          });
          setTempTags((prevTags) => [...prevTags, ...newArrayOfTags]);

          if (!pageHasChanges) {
            setPageHasChanges(true);
          }

          setTimeout(() => {
            StoreActions.featureGroupsDescribe_(null, featureGroupId);
            StoreActions.featureGroupsDescribe_(projectId, featureGroupId);
          }, 0);
        });
      };

      setTags((prevTags) => {
        let res = [...prevTags, ...newArrayOfTags];

        res.some((t1, ind) => {
          t1.color = calcColor('', ind);
        });

        let diff = [];
        res.some((t1) => {
          if (prevTags == null || prevTags?.find((t2) => t2?.value?.toUpperCase() === t1.value?.toUpperCase()) == null) {
            diff.push(t1);
          }
        });

        let pp = diff.map((t1) => {
          return new Promise((resolve) => {
            REClient_.client_().addFeatureGroupAnnotationLabel(featureGroupId, t1.label, annotationTypeKeyUsed, null, null, (err, res) => {
              if (err || !res?.success) {
                REActions.addNotificationError(err || Constants.errorDefault);
                resolve(false);
              }
              resolve(true);
            });
          });
        });

        if (pp.length === 0) {
          doWork();
        } else {
          Promise.all(pp).then((rr) => {
            if (_.isArray(rr)) {
              if (rr.some((r1) => !r1)) {
                // resolveAll(false);
                // return; //TODO
              }
            } else {
              if (!rr) {
                resolveAll(false);
                return;
              }
            }
            doWork();
          });
        }

        return prevTags;
      });
    });
  };

  const handleTextSelect = (value: ITokenAnnotatorTag[]): void => {
    if (!selectedTag) {
      setTextWithoutTag(value);
      // REMOVE TAG ON ONE CLICK
      if (value.length < annotationState.value.length) {
        setAnnotationState((prev) => {
          return { value: value, tag: prev.tag, status: prev.status, isValid: prev.isValid };
        });
      }
      return;
    }

    // GENERATE NEW TAG LIST WITH USED ANNOTATIONS
    const newTagList: IAnnotationsTag[] = tags?.map((tag: IAnnotationsTag) => {
      const newTag = { ...tag, isUsed: false };
      value?.forEach((annotation: ITokenAnnotatorTag) => {
        newTag.isUsed = annotation?.tag === tag?.value?.toUpperCase();
      });
      return newTag;
    });

    newTagList?.some((t1, ind) => {
      t1.color = calcColor('', ind);
    });

    setTags(newTagList);
    setTempTags(newTagList);
    setAnnotationState((prev) => ({ value: value, tag: prev.tag, status: prev.status, isValid: prev.isValid }));
    setPageHasChanges(true);
  };

  const handleTagSelect = (tag: IAnnotationsTag): void => {
    if (props.isPredDash) {
      return;
    }

    // HIDE MANUAL ADD POPUP iF ITS OPENED
    if (textWithoutTag) {
      setTextWithoutTag(null);
    }

    setTimeout(() => {
      setSelectedTag((s1) => {
        s1 = tag?.value === s1?.value ? null : tag;
        return s1;
      });
      setAnnotationState((prev) => ({
        ...prev,
        tag: tag?.value,
      }));
    }, 0);
  };

  const findTagColor = (tags: IAnnotationsTag[]): string => {
    const activeTag = tags?.find((tag) => tag?.value?.toUpperCase() === annotationState.tag?.toUpperCase());
    return activeTag?.color || 'green';
  };

  const handleTagDelete = (tag: IAnnotationsTag): void => {
    const filteredTags = tags?.filter((t) => t?.label !== tag?.label);

    filteredTags?.some((t1, ind) => {
      t1.color = calcColor('', ind);
    });

    setTags(filteredTags);
  };

  const handleTagDeletePromise = (tag: IAnnotationsTag): Promise<boolean> => {
    return new Promise<boolean>((resolve, reject) => {
      REClient_.client_().removeFeatureGroupAnnotationLabel(featureGroupId, tag.label, projectId, (err, res) => {
        if (err || !res?.success) {
          REActions.addNotificationError(err || Constants.errorDefault);
          resolve(false);
        }
        handleTagDelete(tag);
        resolve(true);
      });
    });
  };

  const handleTagsChangeSave = (): Promise<boolean> => {
    return new Promise<boolean>((resolve, reject) => {
      resolve(true);
      setEditTagMode(false);
      setTempTags(tags);
      if (!pageHasChanges) {
        setPageHasChanges(true);
      }
    });
  };

  const handleTagsCancel = (): void => {
    setEditTagMode(false);

    tempTags?.some((t1, ind) => {
      t1.color = calcColor('', ind);
    });

    setTags(tempTags);
  };

  const handleSelectManualTag = (tag: IAnnotationsTag) => {
    let newAnnotationsList = [...textWithoutTag];
    newAnnotationsList[newAnnotationsList.length - 1].tag = tag.label.toUpperCase();
    newAnnotationsList[newAnnotationsList.length - 1].color = tag.color;
    setAnnotationState((prev) => ({ value: newAnnotationsList, tag: prev.tag, status: prev.status, isValid: prev.isValid }));
  };

  const handleExit = (): void => {
    Location.push(`/${PartsLink.features_rawdata}/${projectId ?? '-'}/${featureGroupId}`);
  };

  const verifyAnnotation = (docId: string, rowId: string) => {
    return new Promise<[boolean, string, string, string, boolean, boolean]>((resolve) => {
      REClient_.client_().verifyAndDescribeAnnotation(featureGroupId, fgFieldAnnotations, docId, null, rowId, (err, res) => {
        if (err || !res?.success) {
          REActions.addNotificationError(err || Constants.errorDefault);
          resolve([false, '', '', '', false, false]);
          return;
        }
        const status = res?.result?.status;
        const isValid = res?.result?.verificationInfo?.isValid;
        const userName = res?.result?.verificationInfo?.userName;
        const message = res?.result?.verificationInfo?.message;
        const annotationNotPresent = res?.result?.verificationInfo?.annotationNotPresent;
        resolve([true, status, userName, message, isValid, annotationNotPresent]);
      });
    });
  };

  const handleStartReview = () => {
    const startReview = (isValid, userName) => {
      REClient_.client_().updateAnnotationStatus(featureGroupId, fgFieldAnnotations, inProgressStatus, currentDocId, currentRowId, true, (err, res) => {
        if (err || !res?.success) {
          REActions.addNotificationError(err || Constants.errorDefault);
          setIsStartingReview(false);
          return;
        }
        setAnnotationState({ ...annotationState, status: inProgressStatus, isValid: isValid, userName: userName });
        setIsLockExpired(false);
        handleGetStatus();
        REActions.addNotification('Review in progress...');
        setIsStartingReview(false);
      });
    };

    setIsStartingReview(true);
    verifyAnnotation(currentDocId, currentRowId).then(([isOk, status, userName, message, isValid, annotationNotPresent]) => {
      if (isOk) {
        if (isValid) {
          if (annotationNotPresent) {
            // No annotation present for this document. Save an empty annotation with TODO status.
            setPayload(null);
            setIsSaving(true);
            doSave(true, todoStatus, null, true, (isOk, res) => {
              if (isOk) {
                startReview(isValid, userName);
              }
            });
          } else {
            startReview(isValid, userName);
          }
        } else {
          REActions.addNotification(message + '  Please try the next document');
          setAnnotationState({ ...annotationState, status: status, userName: userName, isValid: isValid });
        }
      }
      setIsStartingReview(false);
    });
  };

  const handleCancelReview = () => {
    REClient_.client_().updateAnnotationStatus(featureGroupId, fgFieldAnnotations, todoStatus, currentDocId, currentRowId, false, (err, res) => {
      if (err || !res?.success) {
        REActions.addNotificationError(err || Constants.errorDefault);
        return;
      }
      setAnnotationState({ ...annotationState, status: todoStatus });
      handleGetStatus();
      REActions.addNotification('Review cancelled... The document is available for review again');
    });
  };

  const handleSave = (commentsToSave: any) => {
    doSave(true, null, commentsToSave, false, (isOk, res) => {
      if (isOk) {
        let status = res?.result?.status;
        setAnnotationState({ ...annotationState, status: status });
        setIsCommentsModalVisible(false);
        handleGetStatus();
        REActions.addNotification('Saved!');
      }
    });
  };

  const handleComment = () => {
    if (!currentCommentsColumn) {
      REActions.addNotificationError('Please select a comments column first');
      return;
    }
    if (!fgFieldComments || fgFieldComments?.length === 0) {
      REActions.addNotificationError('Please set a column with schema mapping as "COMMENTS" first');
      return;
    }
    handleSave(comments);
  };

  const setColumnComments = (commentsColumn, value) => {
    setComments((prevComments) => ({ ...prevComments, [commentsColumn]: value }));
  };

  const handleSubmit = () => {
    doSave(true, doneStatus, comments, false, (isOk, res) => {
      if (isOk) {
        let status = res?.result?.status;
        setAnnotationState({ ...annotationState, status: status });
        handleGetStatus();
        REActions.addNotification('Submitted!');
      }
    });
  };

  const handleGetStatus = () => {
    if (!isReviewMode) {
      return;
    }
    getAnnotationsStatus(false, (isOk, res) => {
      if (isOk) {
        if (res != null) {
          setAnnotationStatus({ ...annotationStatus, total: res?.total, done: res?.done, inProgress: res?.inProgress, todo: res?.todo });
        }
      }
    });
  };

  const addNewTagContent = () => {
    return (
      <div className={styles.addEditTag}>
        <span className={styles.addEditTagTitle}>Add New Label</span>
        <textarea placeholder={allowMultiLabels ? 'Multiple labels can be added using comma as a delimiter' : 'Label name'} onChange={(e) => setNewTag(e.target.value)} name="" id="" />
      </div>
    );
  };

  const topHHTitle = 40;

  const tagsContainerRef = useRef(null);

  const onChangeSize = (ww) => {
    setTimeout(() => {
      let res = 0;
      if (tagsContainerRef.current) {
        res = $(tagsContainerRef.current).outerHeight(true);
      }
      setTagsHH(res ?? 0);
    }, 0);
  };

  const compareDocId = (a, b) => {
    let a1 = isPdf ? a?.data?.[fgFieldRowId ?? fgFieldDocumentId] : a?.[fgFieldRowId ?? fgFieldDocumentId];
    let b1 = isPdf ? b?.data?.[fgFieldRowId ?? fgFieldDocumentId] : b?.[fgFieldRowId ?? fgFieldDocumentId];
    if (Utils.isNullOrEmpty(a1) || Utils.isNullOrEmpty(b1)) {
      return 0;
    }
    if (a1 > b1) {
      return 1;
    }
    if (b1 > a1) {
      return -1;
    }
    return 0;
  };

  useEffect(() => {
    onChangeSize(null);
  }, [tags, tagsContainerRef]);

  useEffect(() => {
    if (props.isPredDash) {
      let list: IDataListOnePdf[] = null;

      if (props.forceDataList != null) {
        list ??= [];
        list = list.concat(props.forceDataList);
      }

      setFgDataList(list);
      return;
    }
    if (docStoreDef === undefined) {
      return;
    }

    const isPdf = docStoreDef?.type === DocStoreType.pdf;

    if (isPdf && !fgFieldDocumentId) {
      return;
    }

    let featureGroupVersion = featureGroupOne?.latestFeatureGroupVersion?.featureGroupVersion;
    if (Utils.isNullOrEmpty(featureGroupVersion)) {
      return;
    }

    const cb1 = (err, res) => {
      setIsLoadingData(false);

      let cols = res?.result?.columns;
      let data = [];
      res?.result?.data?.forEach((d1) => {
        let r1: any = {};
        cols?.forEach((c1, c1ind) => {
          r1[c1] = d1?.[c1ind];
        });

        if (isPdf) {
          let docId = r1?.[fgFieldDocumentId];
          let docJsonString = r1?.[fgFieldDocument];
          let docFilename = r1?.[annotationPdfFilename];

          let docJson = Utils.tryJsonParse(docJsonString);
          let pageCount = docJson?.pageCount;

          if (pageCount != null && pageCount > 0) {
            for (let i = 1; i <= pageCount; i++) {
              data.push({
                filename: docFilename ?? docId, // Use docId if filename is not available
                page: i,
                totalPages: pageCount,
                docId: docId,
                rowId: fgFieldRowId ? r1?.[fgFieldRowId] : docId,
                data: r1,
                extractedFeatures: docJson,
              } as IDataListOnePdf);
            }
          }
        } else {
          data.push(r1);
        }
      });

      if (data?.length === 0) {
        data = null;
      }

      if (data != null) {
        // This is needed especially for Review mode so that next/previous is in order, but also sort for non-review mode for consistency
        data = data.sort(compareDocId);
      }
      setFgDataList(data);
    };

    setIsLoadingData(true);
    REClient_.client_()._getFeatureGroupVersionData(featureGroupVersion, 0, 1000 ?? 99999, 0, 100, null, null, null, null, null, null, false, null, cb1);
  }, [projectId, featureGroupId, docStoreDef, fgFieldDocumentId, fgFieldRowId, annotationPdfFilename, props.isPredDash, props.forceDataList, isReviewMode]);

  const getDocumentToAnnotateIndex = (featureGroupRowIdentifier, isNext) => {
    return new Promise((resolve) => {
      REClient_.client_().getDocumentToAnnotate(featureGroupId, fgFieldAnnotations, featureGroupRowIdentifier, !isNext, (err, res) => {
        if (err || !res?.success) {
          REActions.addNotificationError(err || Constants.errorDefault);
          resolve(null);
        }
        const docId = res?.result?.docId;
        const rowId = res?.result?.featureGroupRowIdentifier;

        if (!docId && !rowId) {
          if (isAnnotationsPopulated) {
            resolve(null);
          }
          REClient_.client_()._listAnnotationFeatureGroupRowIds(featureGroupId, fgFieldAnnotations, (err, res) => {
            if (err || !res?.success) {
              REActions.addNotificationError(err || Constants.errorDefault);
              resolve(null);
            }
            const nextIndex = calcNextAvailableDataIndex(res?.result ?? []);
            resolve(nextIndex);
          });
        } else {
          // TODO: Instead of calculating index here, we can directly use docId with describeAnnotation call.
          // calcDataIndex is not efficient as it iterates over all data.
          const nextIndex = calcDataIndex(docId, 1, rowId);
          resolve(nextIndex);
        }
      });
    });
  };

  const calcNextIndex = (ind, isNext, forceDocumentChange: boolean = false) => {
    return new Promise((resolve) => {
      ind ??= 0;
      const isPdf = docStoreDef?.type === DocStoreType.pdf;
      let fgData = fgDataList?.[ind];
      let isPreviousOnFirstPage = !isNext && fgData?.page === 1;
      let isNextOnLastPage = isNext && fgData?.page === fgData?.totalPages;
      let rowId = getIdsFromFgDataIndex(ind).rowId;
      let isDocumentChange = isPdf ? isPreviousOnFirstPage || isNextOnLastPage || forceDocumentChange : true;

      if (isReviewMode && isDocumentChange) {
        getDocumentToAnnotateIndex(rowId, isNext).then((nextIndex) => {
          if (nextIndex != null) {
            ind = nextIndex;
          } else {
            const msg = isNext ? 'Please try previous documents' : 'Please try next documents';
            REActions.addNotification('No more documents to label. ' + msg);
            resolve(ind);
          }
          resolve(nextIndex);
        });
      } else if (isPdf && isDocumentChange) {
        // iterate over fgDataList till we find a new docId
        let nextIndex = ind;
        let isFound = false;
        while (!isFound) {
          nextIndex += isNext ? 1 : -1;
          if (nextIndex < 0) {
            nextIndex = 0;
            break;
          }
          if (nextIndex >= fgDataList?.length) {
            nextIndex = fgDataList?.length - 1;
            break;
          }
          let nextRowId = getIdsFromFgDataIndex(nextIndex).rowId;
          if (nextRowId != rowId) {
            isFound = true;
          }
        }
        resolve(nextIndex);
      } else {
        ind += isNext ? 1 : -1;
        resolve(ind);
      }
    });
  };

  const onClickNext = (isNext, forceDocumentChange, e) => {
    const doWork = () => {
      setFgDataList((list) => {
        calcNextIndex(currentDataListIndex, isNext, forceDocumentChange).then((ind) => {
          if ((ind as number) < 0) {
            ind = 0;
          }
          if (list != null && ind > list?.length) {
            ind = list.length;
          }

          redirectIfNeeded(ind);
          setCurrentDataListIndex(ind);
          handleGetStatus();
          return ind;
        });

        return list;
      });
    };

    if (isDocInvalidForReview || (isReviewMode && !isReviewStarted) || isReadOnly || isStatusDone) {
      return doWork();
    } else {
      doSave(true, null, comments, false, (isOk, res) => {
        if (isOk) {
          return doWork();
        }
      });
    }
  };

  const getFirstEnclosedToken = (enclosingBoundingBox: number[], tokens: any[], boundingBoxIds: number[]) => {
    // return the first token that is enclosed by the enclosingBoundingBox and present in boundingBoxIds
    for (let i = 0; i < tokens.length; i++) {
      let token = tokens[i];
      let tokenBoundingBox = token?.boundingBox;
      if (
        boundingBoxIds.indexOf(i) !== -1 &&
        tokenBoundingBox[0] >= enclosingBoundingBox[0] &&
        tokenBoundingBox[1] >= enclosingBoundingBox[1] &&
        tokenBoundingBox[2] <= enclosingBoundingBox[2] &&
        tokenBoundingBox[3] <= enclosingBoundingBox[3]
      ) {
        return token;
      }
    }
    return null;
  };

  useEffect(() => {
    if (!isReady || !isReadyTags || isReading || fgDataList == null) {
      return;
    }

    if (docStoreDef === undefined) {
      return;
    }

    if (lastReadIndex.current === currentDataListIndex) {
      return;
    }

    const isPdf = docStoreDef?.type === DocStoreType.pdf;

    //Pdf
    setSelRectListOri(null);
    setSelRectList(null);
    annotationsToPayload(null);
    setTopHoverValue(null);

    //Default
    setIsReading(true);
    setDEFAULT_TEXT('');
    setNewTag(null);
    setEditTagMode(false);
    setAnnotationState((prev) => ({ value: [], tag: prev?.tag ?? null, status: prev.status ?? null, isValid: prev.isValid }));

    setTimeout(() => {
      if (fgDataList != null && fgDataList?.[currentDataListIndex] != null && (!Utils.isNullOrEmpty(fgFieldDocument) || isPdf)) {
        lastReadIndex.current = currentDataListIndex;

        const data1 = fgDataList?.[currentDataListIndex];
        if (data1) {
          if (!isPdf) {
            setDEFAULT_TEXT(data1?.[fgFieldDocument] ?? '');
          }

          const processDataRead = (annList: any[]) => {
            handleGetStatus();
            setCurrentReadRawAnnotation(annList);
            if (isPdf) {
              let list: ISelRect[] = [];
              let entityId = 1;
              annList?.some((a1: { boundingBox?: any; maxProbability?: number; minProbability?: number; meanProbability?: number; displayName?: string; boundingBoxIds?: any[]; textExtraction?; value?: string }) => {
                if (a1 == null) {
                  return;
                }

                let lineBoundingBoxes = a1?.boundingBox;
                if (Number.isInteger(lineBoundingBoxes?.[0])) {
                  // Backward compatibility
                  lineBoundingBoxes = [lineBoundingBoxes];
                }

                // Get page numbers for each line spanning different pages. Need to do this as we
                // don't save page numbers in the annotation but rely on boundingBoxIds.
                // Only needed when there are multiple bounding boxes for a single annotation.
                let pageNumbers = [];
                if (lineBoundingBoxes?.length > 1) {
                  const tokens = data1?.extractedFeatures?.tokens;
                  if (tokens) {
                    for (let i = 0; i < lineBoundingBoxes?.length; i++) {
                      const token = getFirstEnclosedToken(lineBoundingBoxes?.[i], tokens, a1?.boundingBoxIds);
                      pageNumbers.push(token?.page);
                    }
                  }
                }

                lineBoundingBoxes?.forEach((lineBoundingBox: number[], index: number) => {
                  list.push({
                    label: a1?.displayName,
                    x: lineBoundingBox?.[0] ?? 0,
                    y: lineBoundingBox?.[1] ?? 0,
                    width: (lineBoundingBox?.[2] ?? 0) - (lineBoundingBox?.[0] ?? 0),
                    height: (lineBoundingBox?.[3] ?? 0) - (lineBoundingBox?.[1] ?? 0),
                    value: a1?.value ?? a1?.textExtraction?.textSegment?.phrase, // TODO: Value can be from describeAnnotation (initially) or can be edited (currently disabled)
                    overlapSelRects: a1?.boundingBoxIds,
                    maxProbability: a1?.maxProbability,
                    minProbability: a1?.minProbability,
                    meanProbability: a1?.meanProbability,
                    entityId,
                    forcePageNumber: pageNumbers[index],
                  });
                });
                entityId++;
              });

              annList = list ?? [];
              setCurrentReadData(annList);
            } else {
              setCurrentReadData(annList);
            }
          };

          setTimeout(() => {
            doRead((isOk, annList, annotationNotPresent) => {
              if (isOk) {
                setIsReading(false);
                if (annotationNotPresent) {
                  // No annotation present for this document. Save an empty annotation with TODO status.
                  setPayload(null);
                  setIsSaving(true);
                  doSave(true, todoStatus, null, true, (isOk, res) => {
                    if (isOk) {
                      annList = res?.result?.annotation?.annotationValue;
                      processDataRead(annList);
                    }
                  });
                } else {
                  processDataRead(annList);
                }
              }
            });
          }, 0);
        } else {
          setIsReading(false);
        }
      } else {
        setIsReading(false);
      }
    }, 0);
  }, [isReading, fgDataList, currentDataListIndex, fgFieldDocument, isReady, isReadyTags, docStoreDef]);

  useEffect(() => {
    if (docStoreDef === undefined) {
      return;
    }

    const isPdf = docStoreDef?.type === DocStoreType.pdf;

    if (!currentReadData || (!isPdf && (DEFAULT_TEXTsplit == null || DEFAULT_TEXTsplit?.length === 0)) || tags == null) {
      return;
    }

    let annList = currentReadData;
    setCurrentReadData(null);

    if (isPdf) {
      setSelRectListOri(annList ?? []);
      setSelRectList(annList ?? []);
      if (!payload) annotationsToPayload(annList ?? []);
      return;
    }

    if (annList == null || annList?.length == 0) {
      return;
    }

    //
    let aa = [];

    annList?.some((a1) => {
      let t1 = a1?.displayName;

      let startT = a1?.textExtraction?.textSegment?.startOffset;
      let endT = a1?.textExtraction?.textSegment?.endOffset;

      let start1 = 0;
      let ind = 0,
        pos = 0;
      while (ind < DEFAULT_TEXTsplit?.length) {
        if (pos === startT) {
          start1 = ind;
          break;
        }
        if (pos > startT) {
          /*
          If DEFAULT_TEXT is "a (b) c", then DEFAULT_TEXTsplit = ["a", "(b)", "c"]
          But textExtraction can be only for "b" (without brackets) in which case pos points to "c"
          So workaround is to move start1 to point to the previous "(b)".
          TODO: Make TokenAnnotator component not depened on splits & tokens, but only on raw text &
          startOffset/endOffset, so that it's possible to set only "b" instead of "(b)"
          */
          start1 = ind - 1;
          break;
        }

        let s1 = DEFAULT_TEXTsplit?.[ind];
        pos += s1?.length ?? 0;

        if (s1 !== '\n' && s1 !== ' ' && DEFAULT_TEXTsplit?.[ind + 1] !== '\n') {
          pos += 1;
        }

        ind++;
      }

      let end1 = start1;
      while (ind <= DEFAULT_TEXTsplit?.length) {
        if (pos >= endT || ind === DEFAULT_TEXTsplit?.length) {
          end1 = ind;
          break;
        }

        let s1 = DEFAULT_TEXTsplit?.[ind];
        pos += s1?.length ?? 0;

        if (s1 !== '\n' && s1 !== ' ' && DEFAULT_TEXTsplit?.[ind + 1] !== '\n') {
          pos += 1;
        }

        ind++;
      }
      if (start1 === end1) {
        end1++;
      }

      let tag1 = tags?.find((c1) => c1.value?.toUpperCase() === t1?.toUpperCase());
      aa.push({
        start: start1,
        end: end1,
        tag: tag1?.value ?? t1,
        color: tag1?.color,
        // tokens: DEFAULT_TEXTsplit?.slice(start1, end1),
      });
    });

    setAnnotationState((prev) => ({ value: aa, tag: prev?.tag ?? null, status: prev.status ?? null, isValid: prev.isValid }));
  }, [DEFAULT_TEXTsplit, currentReadData, docStoreDef]);

  const rendermark1 = useCallback((props) => {
    let content1 = props.content;

    if (content1 == null) {
      //
    } else if (content1 === '\n') {
      content1 = <br />;
    } else if (_.isString(content1) && content1?.indexOf('\n') > -1) {
      let cc = content1.split('\n');
      let res = [];
      cc.some((c1, c1ind) => {
        if (c1ind > 0) {
          res.push(<br />);
        }
        res.push(c1);
      });
      content1 = res;
    }

    return (
      <mark
        key={props.key}
        className={styles.textMark}
        style={{ background: props.color }}
        onClick={() => {
          props.onClick?.({
            start: props.start,
            end: props.end,
            // text: props.text,
            tag: props.tag,
            color: props.color,
          });
        }}
      >
        <span className={styles.textWithTag}>
          <span>{content1}</span>
          <span className={styles.tagForText} style={{ color: props.color }}>
            {props.tag}
          </span>
        </span>
      </mark>
    );
  }, []);

  const tagModalNewTagRef = useRef('');
  const tagModal = useMemo(() => {
    const titleAddTag = (
      <div className={styles.addEditTag}>
        <span className={styles.addEditTagTitle}>ADD NEW LABEL</span>
        <textarea
          placeholder={allowMultiLabels ? 'Multiple labels can be added using comma as a delimiter' : 'Label name'}
          onChange={(e) => {
            tagModalNewTagRef.current = e.target.value;
          }}
          name=""
          id=""
        ></textarea>
      </div>
    );

    return textWithoutTag?.length ? (
      <div className={styles.addTokenModal}>
        {/*<span>{textWithoutTag?.[0]?.tokens?.join(" ")}</span>*/}
        <div className={styles.addTokenModalListContainer}>
          <NanoScroller>
            <div className={styles.addTokenModalList}>
              {tags?.map((tag, index) => (
                <AnnotationsTag
                  key={tag.value + index.toString()}
                  tag={tag}
                  allowDelete={!isReadOnlyForTags}
                  isSelected={false}
                  deleteEnabled={!isReadOnlyForTags}
                  readonly={isReadOnlyForTags}
                  onTagClick={isReadOnlyForTags ? null : handleSelectManualTag}
                  onTagDelete={isReadOnlyForTags ? null : handleTagDelete}
                  onTagDeletePromise={isReadOnlyForTags ? null : handleTagDeletePromise}
                />
              ))}
            </div>
          </NanoScroller>
        </div>
        <div className={styles.selectTagActions}>
          <Button onClick={handleCloseSelectTagModal} type={'primary'} ghost>
            {' '}
            Close{' '}
          </Button>
          <ModalConfirm
            onClick={() => {
              tagModalNewTagRef.current = '';
            }}
            onConfirmPromise={handleSubmitAddTags.bind(null, true)}
            title={titleAddTag}
            okText={'Save'}
            cancelText={'Cancel'}
            okType={'primary'}
          >
            <Button type={'primary'}>Add New {'Label' + (allowMultiLabels ? 's' : '')}</Button>
          </ModalConfirm>
        </div>
      </div>
    ) : null;
  }, [textWithoutTag, tags]);

  const tagsColorCalc1 = useMemo(() => {
    return findTagColor(tags);
  }, [tags, annotationState]);

  const getSpan1 = useCallback(
    (span) => ({
      ...span,
      tag: annotationState.tag,
      color: tagsColorCalc1,
    }),
    [annotationState, tagsColorCalc1],
  );

  const styleToken1 = useMemo(() => {
    return {
      maxWidth: 600,
      lineHeight: 1.5,
      padding: 20,
    };
  }, []);

  const tokenAnnotatorRefCB = useRef(null);

  const onScrollBottomTokenAnnotator = useCallback(
    (perc) => {
      tokenAnnotatorRefCB.current?.cbMoreNeeded?.();
    },
    [tokenAnnotatorRefCB.current],
  );

  const calcMappingErrorMsg = (feature) => {
    return `The feature group doesn't have a column with the schema mapping "${feature}"`;
  };

  const calcUniqueName = (name1, alreadyPresentNames: any = {}) => {
    if (alreadyPresentNames[name1] == null) {
      alreadyPresentNames[name1] = true;
      return name1;
    } else {
      let n = 1;
      while (alreadyPresentNames[name1 + '_' + n] === true) {
        n++;
      }

      alreadyPresentNames[name1 + '_' + n] = true;
      return name1 + '_' + n;
    }
  };

  const addAnnotationFeature = (alreadyPresentNames: any = null) => {
    if (!alreadyPresentNames) {
      alreadyPresentNames = {};
      calcSchemaForFeature(featureGroupOne)?.some((f1) => {
        let name1 = f1?.name;
        if (!Utils.isNullOrEmpty(name1)) {
          alreadyPresentNames[name1] = true;
        }
      });
    }

    return new Promise((resolve) => {
      let featName1 = calcUniqueName('annotations', alreadyPresentNames);
      REClient_.client_().addAnnotatableFeature(featureGroupId, featName1, annotationTypeKeyUsed, projectId, (err, res) => {
        if (err || !res?.success) {
          REActions.addNotificationError(err || Constants.errorDefault);
          resolve(false);
          return;
        }

        REClient_.client_().setFeatureType(featureGroupId, featName1, 'LABEL_LIST', (err2, res2) => {
          if (err2 || !res2?.success) {
            REActions.addNotificationError(err2 || Constants.errorDefault);
            resolve(false);
            return;
          }

          REClient_.client_().setFeatureMapping(projectId, featureGroupId, featName1, 'ANNOTATIONS', null, (err3, res3) => {
            if (err3 || !res3?.success) {
              REActions.addNotificationError(err3 || Constants.errorDefault);
              resolve(false);
              return;
            }

            resolve(true);
          });
        });
      });
    });
  };

  const needMappings: { isOk?: boolean; msgs?: string[]; toFix?: any[] } = useMemo(() => {
    if (featureGroupOne == null || props.isPredDash) {
      return { isOk: true };
    }

    let msgs = [];
    let toFix = [];

    let alreadyPresentNames: any = {};
    calcSchemaForFeature(featureGroupOne)?.some((f1) => {
      let name1 = f1?.name;
      if (!Utils.isNullOrEmpty(name1)) {
        alreadyPresentNames[name1] = true;
      }
    });

    if (Utils.isNullOrEmpty(fgFieldObjectReference) && [DocStoreType.pdf].includes(docStoreDef?.type)) {
      msgs.push(calcMappingErrorMsg('Object-Reference'));
      toFix.push(() => {
        return new Promise((resolve) => {
          resolve(false);

          Location.push('/' + PartsLink.features_list + '/' + (projectId ?? '-') + '/' + featureGroupId);
        });
      });
    } else if (Utils.isNullOrEmpty(fgFieldDocument)) {
      msgs.push(calcMappingErrorMsg('Document'));
      toFix.push(() => {
        return new Promise((resolve) => {
          resolve(false);

          Location.push('/' + PartsLink.features_list + '/' + (projectId ?? '-') + '/' + featureGroupId);
        });
      });
    } else {
      if (Utils.isNullOrEmpty(fgFieldAnnotations)) {
        toFix.push(() => addAnnotationFeature(alreadyPresentNames));
        msgs.push(calcMappingErrorMsg('Annotations'));
      }

      if (Utils.isNullOrEmpty(fgFieldDocumentId) && !Utils.isNullOrEmpty(fgFieldDocument)) {
        toFix.push(() => {
          return new Promise((resolve) => {
            let featName1 = calcUniqueName('document_id', alreadyPresentNames);
            REClient_.client_().addFeature(featureGroupId, featName1, `ROW_NUMBER() OVER(ORDER BY ${fgFieldDocument})`, (err, res) => {
              if (err || !res?.success) {
                REActions.addNotificationError(err || Constants.errorDefault);
                resolve(false);
                return;
              }

              REClient_.client_().setFeatureType(featureGroupId, featName1, 'CATEGORICAL', (errC, resC) => {
                if (errC || !resC?.success) {
                  REActions.addNotificationError(errC || Constants.errorDefault);
                  resolve(false);
                  return;
                }

                REClient_.client_().setFeatureMapping(projectId, featureGroupId, featName1, 'DOCUMENT_ID', null, (err2, res2) => {
                  if (err2 || !res2?.success) {
                    REActions.addNotificationError(err2 || Constants.errorDefault);
                    resolve(false);
                    return;
                  }

                  resolve(true);
                });
              });
            });
          });
        });
        msgs.push(calcMappingErrorMsg('Document ID'));
      }
    }

    return {
      isOk: toFix.length === 0 && msgs.length === 0,
      msgs: msgs,
      toFix: toFix,
    };
  }, [featureGroupOne, projectId, featureGroupId, fgFieldDocument, fgFieldDocumentId, fgFieldAnnotations, docStoreDef, props.isPredDash]);

  const addStatusFeature = () => {
    return new Promise((resolve) => {
      let alreadyPresentNames: any = {};
      calcSchemaForFeature(featureGroupOne)?.some((f1) => {
        let name1 = f1?.name;
        if (!Utils.isNullOrEmpty(name1)) {
          alreadyPresentNames[name1] = true;
        }
      });
      let featName1 = calcUniqueName('status', alreadyPresentNames);
      REClient_.client_().addFeature(featureGroupId, featName1, '""', (err, res) => {
        if (err || !res?.success) {
          REActions.addNotificationError(err || Constants.errorDefault);
          resolve(false);
          return;
        }

        REClient_.client_().setFeatureType(featureGroupId, featName1, 'CATEGORICAL', (errC, resC) => {
          if (errC || !resC?.success) {
            REActions.addNotificationError(err || Constants.errorDefault);
            resolve(false);
            return;
          }

          REClient_.client_().setFeatureMapping(projectId, featureGroupId, featName1, 'STATUS', null, (err2, res2) => {
            if (err2 || !res2?.success) {
              REActions.addNotificationError(err2 || Constants.errorDefault);
              resolve(false);
              return;
            }

            REClient_.client_().setAnnotationStatusFeature(featureGroupId, featName1, (err3, res3) => {
              if (err3 || !res3?.success) {
                REActions.addNotificationError(err3 || Constants.errorDefault);
                resolve(false);
              }
              resolve(true);
            });
          });
        });
      });
    });
  };

  const setReviewModeConfig = (isReviewMode: boolean) => {
    return new Promise((resolve) => {
      REClient_.client_().setProjectFeatureGroupConfig(featureGroupId, projectId, { type: 'REVIEW_MODE', isReviewMode: isReviewMode }, (err, res) => {
        if (err || !res?.success) {
          REActions.addNotificationError(err || Constants.errorDefault);
          resolve(false);
        }

        StoreActions.featureGroupsDescribe_(null, featureGroupId);
        StoreActions.featureGroupsDescribe_(projectId, featureGroupId);
        resolve(true);
      });
    });
  };

  const handleSwitchReviewModeOnHelper = () => {
    if (fgFieldStatus) {
      return setReviewModeConfig(true).then((isOk) => {
        return isOk;
      });
    } else {
      return addStatusFeature().then((isOk) => {
        if (isOk) {
          return setReviewModeConfig(true).then((isOk) => {
            return isOk;
          });
        } else {
          REActions.addNotificationError('Error adding STATUS feature');
          return false;
        }
      });
    }
  };

  const handleSwitchReviewModeOn = (e) => {
    return new Promise((resolve) => {
      verifyAnnotation(currentDocId, currentRowId)
        .then(([isOk, status, userName, message, isValid, annotationNotPresent]) => {
          if (isOk) {
            return handleSwitchReviewModeOnHelper();
          }
        })
        .then((isOk) => {
          resolve(isOk);
        });
    });
  };

  const handleSwitchReviewModeOff = (e) => {
    return setReviewModeConfig(false);
  };

  const addCommentsFeature = () => {
    REActions.addNotification("Setting up a new feature with schema mapping 'COMMENTS'...");

    return new Promise((resolve) => {
      let alreadyPresentNames: any = {};
      calcSchemaForFeature(featureGroupOne)?.some((f1) => {
        let name1 = f1?.name;
        if (!Utils.isNullOrEmpty(name1)) {
          alreadyPresentNames[name1] = true;
        }
      });
      let featName1 = calcUniqueName('comments', alreadyPresentNames);
      REClient_.client_().addFeature(featureGroupId, featName1, 'CAST(null AS string)', (err, res) => {
        if (err || !res?.success) {
          REActions.addNotificationError(err || Constants.errorDefault);
          resolve(false);
          return;
        }

        REClient_.client_().setFeatureType(featureGroupId, featName1, 'TEXT', (errC, resC) => {
          if (errC || !resC?.success) {
            REActions.addNotificationError(err || Constants.errorDefault);
            resolve(false);
            return;
          }

          REClient_.client_().setFeatureMapping(projectId, featureGroupId, featName1, 'COMMENTS', null, (err2, res2) => {
            if (err2 || !res2?.success) {
              REActions.addNotificationError(err2 || Constants.errorDefault);
              resolve(false);
              return;
            }

            StoreActions.featureGroupsDescribe_(null, featureGroupId);
            StoreActions.featureGroupsDescribe_(projectId, featureGroupId);
            resolve(true);
          });
        });
      });
    });
  };

  const onClickMater = (e) => {
    REClient_.client_().createFeatureGroupSnapshot(projectId, featureGroupId, (err, res) => {
      if (err || !res?.success) {
        REActions.addNotificationError(err || Constants.errorDefault);
      } else {
        StoreActions.featureGroupsDescribe_(null, featureGroupId);
        StoreActions.featureGroupsDescribe_(projectId, featureGroupId);
        StoreActions.featureGroupsVersionsList_(featureGroupId);
      }
    });
  };

  const isErrorMapping = needMappings?.isOk === false;
  const errorMapping = useMemo(() => {
    if (isErrorMapping) {
      return (
        <div>
          {needMappings?.msgs?.map((s1, s1ind) => {
            return (
              <div
                key={'eee' + s1ind}
                css={`
                  margin: 5px 0;
                  opacity: 0.8;
                `}
              >
                &nbsp;{s1}
              </div>
            );
          })}
        </div>
      );
    }
    return null;
  }, [isErrorMapping, needMappings, docStoreDef]);

  useEffect(() => {
    if (!featureGroupOne || props.isPredDash || !fgFieldDocumentId || !fgFieldDocument) {
      return;
    }

    if (!fgFieldAnnotations) {
      setIsAddingAnnotationFeature(true);
      addAnnotationFeature().then((isOk) => {
        if (!isOk) {
          REActions.addNotificationError('Error adding ANNOTATIONS feature');
          setIsAddingAnnotationFeature(false);
          return;
        }
        StoreActions.featureGroupsDescribe_(projectId, featureGroupId, (res) => {
          setIsAddingAnnotationFeature(false);
        });
      });
    }
  }, [featureGroupOne, props.isPredDash, fgFieldDocumentId, fgFieldDocument, fgFieldAnnotations]);

  const onClickFixMappings = (e) => {
    const doWork = () => {
      let pp = needMappings?.toFix;
      if (pp?.length > 0) {
        setIsFixing(true);

        const doWorkOneP = (ind, rr) => {
          if (ind >= pp.length) {
            if (rr != null && !rr?.some((r1) => !r1)) {
              REActions.addNotification('Done!');
            }

            setIsFixing(false);

            StoreActions.featureGroupsDescribe_(null, featureGroupId);
            StoreActions.featureGroupsDescribe_(projectId, featureGroupId);

            return rr;
          }

          let p1 = pp[ind];
          p1().then((r1) => {
            doWorkOneP(ind + 1, [...rr, r1]);
          });
        };

        doWorkOneP(0, []);
      }
    };

    setIsFixing((f1) => {
      if (!f1) {
        doWork();
      }

      return f1;
    });
  };

  const onNeedCurrentLabel = useCallback(() => {
    return new Promise<string>((resolve) => {
      setSelectedTag((s1) => {
        let tag1 = s1?.label;

        resolve(tag1);

        return s1;
      });
    });
  }, []);

  const onIsProcessingOCR = (isProcessing) => {
    setIsProcessingOCR(isProcessing);
  };

  const onIsLoadingImage = (isLoadingImage) => {
    setIsLoadingImage(isLoadingImage);
  };

  const onMouseEnterLabel = (value, e) => {
    setTopHoverValue(value);
  };

  const renderHover = (value: { key: string; value: any }[]) => {
    if (value?.length > 0) {
      return (
        <div
          css={`
            z-index: 200;
            max-width: 70vw;
            font-size: 12px;
            position: absolute;
            top: 3px;
            left: 50%;
            transform: translateX(-50%);
            padding: 2px 6px;
            background-color: #000000;
            border: 1px solid #2a2a2a;
            border-radius: 2px;
          `}
        >
          {value?.map((v, i) => {
            return (
              <div key={'hov' + i}>
                <span
                  css={`
                    opacity: 0.7;
                  `}
                >
                  {v?.key}:
                </span>
                <span> {v?.value}</span>
              </div>
            );
          })}
        </div>
      );
    }
    return null;
  };

  const onChangeAnnotations = (list) => {
    setTimeout(() => {
      setSelRectList(list ?? []);
      annotationsToPayload(list ?? []);
    }, 0);
  };

  const onChangeJSON = (list) => {
    setPayload(list);
    payloadToAnnotations(Utils.tryJsonParse(list));
  };

  const annotationOffsetToTokenIndex = (annotationStartOffest, annotationEndOffset, tokens) => {
    // Converts annotation offsets to token indexes. Similar to _annotation_offset_to_token_index_offset in backend.
    let startTokenIndex = null;
    let endTokenIndex = null;
    if (annotationStartOffest == null || annotationEndOffset == null || tokens == null) {
      return [startTokenIndex, endTokenIndex];
    }

    for (let i = 0; i < tokens.length; i++) {
      let token = tokens?.[i];

      if (token?.startOffset === annotationStartOffest) {
        startTokenIndex = i;
      }

      if (token?.endOffset === annotationEndOffset) {
        endTokenIndex = i;
      }

      if (startTokenIndex !== null && endTokenIndex !== null) {
        break;
      }
    }

    return [startTokenIndex, endTokenIndex];
  };

  const formatAsNlpPredictForUI = (fgDataRow, annotationsList) => {
    const tokens = fgDataRow?.extractedFeatures?.tokens;
    let annotations = [];
    if (annotationsList) {
      annotationsList.forEach((a) => {
        // TODO: Add proper support for multiple text segments for the same annotation
        let annotationStartOffest = a?.textExtraction?.textSegment?.startOffset;
        let annotationEndOffset = a?.textExtraction?.textSegment?.endOffset;
        let [startTokenIndex, endTokenIndex] = annotationOffsetToTokenIndex(annotationStartOffest, annotationEndOffset, tokens);
        annotations.push({
          boundingBox: a?.boundingBox,
          displayName: a?.displayName,
          startToken: startTokenIndex,
          endToken: endTokenIndex,
          value: a?.value,
        });
      });
    }

    return {
      annotations: annotations,
      extractedFeatures: fgDataRow?.extractedFeatures,
      tokens: tokens?.map((t) => t?.content) ?? [],
      actuals: [],
      addTokenSpaces: true,
    };
  };

  const getProcessedAnnotation = (annotationType: string, annotationValue: any, document: string, cbFinish?: (isOk: boolean, res: any) => void) => {
    REClient_.client_()._getProcessedAnnotation(annotationType, annotationValue, document, (err, res) => {
      if (err || !res?.success) {
        // To add error on each change: REActions.addNotificationError(err || Constants.errorDefault);
        cbFinish?.(false, null);
        return;
      }
      cbFinish?.(true, res?.result);
    });
  };

  useEffect(() => {
    if (!props.isPredDash && isPdf && payload) {
      const document = (isPdf ? fgDataList?.[currentDataListIndex]?.data : fgDataList?.[currentDataListIndex])?.[fgFieldDocument];
      getProcessedAnnotation(docStoreDef.annotationTypeKey, payload, document, (isOk, res) => {
        if (isOk) {
          const formattedRes = formatAsNlpPredictForUI(fgDataList?.[currentDataListIndex], res);
          setFormattedAnnotations(formattedRes);
        }
      });
    }
  }, [fgDataList, currentDataListIndex, payload]);

  const importAnnotationLabels = () => {
    return new Promise((resolve) => {
      if (!importedLabelsFile) {
        REActions.addNotificationError('Please select a file to import');
        resolve(false);
        return;
      }
      REClient_.client_().importAnnotationLabels(featureGroupId, importedLabelsFile, annotationTypeKeyUsed, (err, res) => {
        if (err || !res?.success) {
          REActions.addNotificationError(err || Constants.errorDefault);
          setImportedLabelsFile(null);
          resolve(false);
        }
        StoreActions.featureGroupsDescribe_(null, featureGroupId);
        StoreActions.featureGroupsDescribe_(projectId, featureGroupId);
        setImportedLabelsFile(null);
        resolve(true);
      });
    });
  };

  const isLastDocument = currentRowId === getIdsFromFgDataIndex(fgDataList?.length - 1).rowId;
  const isFirstDocument = currentRowId === getIdsFromFgDataIndex(0).rowId;
  const currentPageNumber = fgDataList?.[currentDataListIndex]?.page;
  const isLastPage = currentPageNumber === fgDataList?.[currentDataListIndex]?.totalPages;
  const isFirstPage = currentPageNumber === 1;
  const doneFilesText = annotationStatus?.done != null ? (annotationStatus?.done == 1 ? '1 file done' : `${annotationStatus?.done} files done`) : '';
  const inProgressFilesText = annotationStatus?.inProgress != null ? (annotationStatus?.inProgress == 1 ? ' 1 file in progress' : `${annotationStatus?.inProgress} files in progress`) : '';
  const reviewCompleteText = isStatusDone ? ' (Review completed for current document)' : '';
  const statusText = `${doneFilesText}${inProgressFilesText ? (doneFilesText ? ', ' : '') + inProgressFilesText : ''}${reviewCompleteText}`;
  const showPageAndDocumentButtons = isPdf && !props.isPredDash;
  const hideContent = needsMaterialization || isErrorMapping || isMaterFailed;

  useEffect(() => {
    const newEditorHeight = isReviewMode && isReviewStarted ? Utils.dataNum('annotation_widget_height_2', 40) : 40;
    setEditorHeight(newEditorHeight);
  }, [isReviewMode, isReviewStarted]);

  const annotationsInterfaceRender = (height) => {
    return (
      <div className="basicAnnotationsInterface">
        <div
          css={`
            text-align: center;
            font-size: ${props.isPredDash ? 13 : 15}px;
          `}
        >
          &nbsp;
          {isLoadingData && <FontAwesomeIcon icon={require('@fortawesome/pro-duotone-svg-icons/faSync').faSync} spin transform={{ size: 14, x: 0, y: 0 }} />}
          {fgDataList?.length > 0 && !isErrorMapping && !isMaterFailed && !needsMaterialization && (
            <span>
              {docStoreDef != null ? '' : 'Annotation Text'} {currentStringIndex}
            </span>
          )}
          {fgDataList?.length === 0 && <span>List is empty</span>}
          {isReviewMode && fgDataList?.length > 0 && !isErrorMapping && !isMaterFailed && !needsMaterialization && (
            <div>
              <span>{statusText}</span>
            </div>
          )}
        </div>
        <div
          css={`
            margin-top: 10px;
            display: flex;
            gap: 15px;
            padding: 0 15px;
          `}
        >
          {showPageAndDocumentButtons ? (
            <div>
              <NavigationIconButton
                title="Previous Document"
                disabled={isReading || isErrorMapping || isMaterFailed || isProcessingOCR || needsMaterialization || (!isReviewMode && isFirstDocument) || isSaving}
                onClick={onClickNext.bind(null, false, true)}
                icon={['fad', 'chevrons-left']}
              />
              <NavigationIconButton
                title="Previous Page"
                disabled={isReading || isErrorMapping || isMaterFailed || isProcessingOCR || needsMaterialization || isFirstPage || isSaving}
                onClick={onClickNext.bind(null, false, false)}
                icon="chevron-left"
              />
            </div>
          ) : (
            <div>
              <NavigationIconButton
                title={`Previous${props.isPredDash ? ' Page' : ''}`}
                disabled={isReading || isErrorMapping || isMaterFailed || isProcessingOCR || needsMaterialization || currentDataListIndex === 0 || isSaving}
                onClick={onClickNext.bind(null, false, false)}
                icon="chevron-left"
              />
            </div>
          )}

          <div
            css={`
              flex: 1;
            `}
          >
            <Slider min={0} max={(fgDataList?.length ?? 1) - 1} value={currentDataListIndex} disabled={true} />
          </div>

          {showPageAndDocumentButtons ? (
            <div>
              <NavigationIconButton
                title="Next Page"
                disabled={isReading || isErrorMapping || isMaterFailed || isProcessingOCR || needsMaterialization || isSaving || isLastPage}
                onClick={onClickNext.bind(null, true, false)}
                icon="chevron-right"
              />
              <NavigationIconButton
                className={styles.right}
                title="Next Document"
                disabled={isReading || isErrorMapping || isMaterFailed || isProcessingOCR || needsMaterialization || (!isReviewMode && isLastDocument) || isSaving}
                onClick={onClickNext.bind(null, true, true)}
                icon={['fad', 'chevrons-right']}
              />
            </div>
          ) : (
            <NavigationIconButton
              title={`Next${props.isPredDash ? ' Page' : ''}`}
              disabled={isReading || isErrorMapping || isMaterFailed || isProcessingOCR || needsMaterialization || (!isReviewMode && currentDataListIndex >= (fgDataList?.length ?? 0) - 1) || isSaving}
              onClick={onClickNext.bind(null, true, false)}
              icon="chevron-right"
            />
          )}
        </div>

        <RefreshAndProgress
          isRelative
          css={`
            height: ${height - topAfterHeaderHH - topHHTitle}px;
          `}
          isMsgAnimRefresh={needsMaterializationAndInProgress}
          msgMsg={needsMaterializationAndInProgress ? 'Materializing...' : isAddingAnnotationFeature ? 'Adding Annotation Feature...' : undefined}
          isDim={hideContent}
          errorMsg={
            isMaterFailed
              ? 'Failed'
              : isErrorMapping
              ? isAddingAnnotationFeature
                ? 'Adding Annotation Feature...'
                : errorMapping
              : needsMaterialization && !needsMaterializationAndInProgress
              ? 'Feature Group needs to be materialized'
              : undefined
          }
          errorButtonText={isErrorMapping ? (needMappings?.toFix?.length > 0 ? 'Add Feature Mappings' : undefined) : needsMaterialization ? 'Materialize' : undefined}
          onClickErrorButton={isErrorMapping && !isAddingAnnotationFeature ? (needMappings?.toFix?.length > 0 ? onClickFixMappings : undefined) : needsMaterialization ? onClickMater : undefined}
        >
          <div
            style={{
              height: height - topAfterHeaderHH - topHHTitle + 'px',
            }}
            className={styles.annotationsContainer}
            css={props.isPredDash ? `` : `background-color: #0b131e;`}
          >
            <div className={styles.tagsContainer} ref={tagsContainerRef}>
              <div className={styles.tagsInner}>
                <div className={styles.filterContainer}>
                  <span className={styles.labelText}>Labels: </span>
                  <Input value={labelFilter} onChange={(e) => setLabelFilter(e.target.value)} />
                </div>
                {!props.isPredDash && (
                  <div className={styles.tagActions}>
                    {editTagMode ? (
                      <>
                        <Button
                          disabled={isLoadingData || isSaving}
                          onClick={handleTagsChangeSave}
                          css={`
                            padding: 0 19px;
                          `}
                          type={'primary'}
                        >
                          Save
                        </Button>
                        <Button onClick={handleTagsCancel} ghost>
                          Cancel
                        </Button>
                      </>
                    ) : (
                      <>
                        {/* Comments should be allowed in review mode only as adding comments is equivalent to calling addAnnotation */}
                        {!props.isPredDash && isReviewMode && isReviewStarted && !isDocInvalidForReview && (
                          <TooltipExt title="Comments">
                            <Button type="primary" onClick={() => setIsCommentsModalVisible(true)}>
                              <FontAwesomeIcon icon={['far', 'comment']} transform={{ size: 16 }} />
                            </Button>
                          </TooltipExt>
                        )}
                        <ModalConfirm
                          onConfirmPromise={importAnnotationLabels.bind(null)}
                          title={
                            <div>
                              <p
                                css={`
                                  font-size: 16px;
                                `}
                              >
                                Import labels from CSV file
                              </p>
                              <p
                                css={`
                                  font-size: 14px;
                                  opacity: 0.7;
                                `}
                              >
                                All valid values in the file will be imported as labels (including header row if present)
                              </p>
                              <br />
                              <Upload.Dragger className={styles.dropper} beforeUpload={() => false} accept="text/csv" onChange={(info) => setImportedLabelsFile(info.file)} multiple={false} maxCount={1}>
                                <p className="ant-upload-drag-icon">
                                  <InboxOutlined />
                                </p>
                                <p className="ant-upload-text" style={{ color: 'white' }}>
                                  Click or drag file to this area to upload
                                </p>
                              </Upload.Dragger>
                            </div>
                          }
                          okText={'Import Labels'}
                          cancelText={'Cancel'}
                          okType={'primary'}
                        >
                          <TooltipExt title="Import labels">
                            <Button type="primary" icon={<FontAwesomeIcon icon={['far', 'upload']} transform={{ size: 16 }} />} />
                          </TooltipExt>
                        </ModalConfirm>
                        <ModalConfirm onConfirmPromise={handleSubmitAddTags.bind(null, false)} title={addNewTagContent()} okText={'Save'} cancelText={'Cancel'} okType={'primary'}>
                          <Button type="primary">Add New {`Label${allowMultiLabels ? 's' : ''}`}</Button>
                        </ModalConfirm>
                      </>
                    )}
                  </div>
                )}
              </div>
              <div className={styles.tagList}>
                {tags
                  ?.filter((tag) => tag?.value?.toLowerCase?.().includes?.(labelFilter.toLowerCase()))
                  ?.map((tag, index) => (
                    <AnnotationsTag
                      key={tag.value + index.toString()}
                      tag={tag}
                      readonly={isReadOnlyForTags}
                      allowDelete={!isReadOnlyForTags}
                      isSelected={isReadOnlyForTags ? false : selectedTag?.label === tag.label}
                      deleteEnabled={!isReadOnlyForTags}
                      onTagClick={isReadOnlyForTags ? null : handleTagSelect}
                      onTagDelete={isReadOnlyForTags ? null : handleTagDelete}
                      onTagDeletePromise={isReadOnlyForTags ? null : handleTagDeletePromise}
                    />
                  ))}
              </div>
            </div>

            <span
              className={styles.annotationsTextTitle}
              css={`
                display: flex;
                align-items: center;
              `}
            >
              {docStoreDef == null && (
                <span
                  css={`
                    margin-right: 10px;
                  `}
                >
                  INPUT TEXT BELOW
                </span>
              )}
              {isProcessingOCR && (
                <span
                  css={`
                    flex: 1;
                    text-align: center;
                  `}
                >
                  <span>
                    Processing OCR
                    <FontAwesomeIcon
                      icon={require('@fortawesome/pro-duotone-svg-icons/faSync').faSync}
                      spin
                      transform={{ size: 14, x: 0, y: 0 }}
                      css={`
                        margin-left: 7px;
                      `}
                    />
                  </span>
                </span>
              )}
              {isLoadingImage && (
                <span
                  css={`
                    flex: 1;
                    text-align: center;
                  `}
                >
                  <span>
                    Loading Image
                    <FontAwesomeIcon
                      icon={require('@fortawesome/pro-duotone-svg-icons/faSync').faSync}
                      spin
                      transform={{ size: 14, x: 0, y: 0 }}
                      css={`
                        margin-left: 7px;
                      `}
                    />
                  </span>
                </span>
              )}
            </span>

            <div
              css={`
                position: relative;
              `}
            >
              <div style={{ height: `${height - tagsHH - (props.isPredDash ? 120 : 200)}px` }} className={styles.textContainer + ' ' + (isSaving ? stylesDark.pointerEventsNone : '')}>
                <RefreshAndProgress msgMsg={props.forceRefreshing ? 'Retrieving Results' : null} isDim={props.forceRefreshing} msgHideContent msgTop={50} isMsgAnimRefresh={true}>
                  <RefreshAndProgress
                    isDim={isLoadingData || isLoadingImage || isProcessingOCR || needsMaterialization}
                    isMsgAnimRefresh={isLoadingData || isLoadingImage || isProcessingOCR}
                    msgMsg={isLoadingData ? 'Loading...' : isProcessingOCR ? 'Processing OCR' : isLoadingImage ? 'Loading Image' : undefined}
                  >
                    <NanoScroller onScrollBottom={onScrollBottomTokenAnnotator}>
                      {docStoreDef != null &&
                        !(isReading || isErrorMapping || isMaterFailed || isLoadingData || needsMaterialization) &&
                        docStoreDef?.annotationRender?.({
                          readonly: isReadOnly,
                          extractedFeatures: docStoreDef?.type === DocStoreType.pdf ? fgDataList?.[currentDataListIndex]?.extractedFeatures : undefined,
                          docId: currentDocId,
                          pageNumber: currentPageNumber,
                          onNeedCurrentLabel: onNeedCurrentLabel,
                          isProcessingOCR: onIsProcessingOCR,
                          isLoadingImage: onIsLoadingImage,
                          onMouseEnterLabel: onMouseEnterLabel,
                          selRectListOri: selRectListOri,
                          onChangeAnnotations: onChangeAnnotations,
                          data: docStoreDef?.type === DocStoreType.pdf ? fgDataList?.[currentDataListIndex]?.data : fgDataList?.[currentDataListIndex],
                          showReviewNotStartedWarning: isReviewMode && !isReviewStarted,
                        })}
                      {docStoreDef == null && featureGroupOne != null && !hideContent && (
                        <TokenAnnotator
                          ref={tokenAnnotatorRefCB}
                          selectedText={textWithoutTag}
                          tagModal={tagModal}
                          style={styleToken1}
                          tokens={DEFAULT_TEXTsplit}
                          value={annotationState?.value ?? null}
                          onChange={handleTextSelect}
                          getSpan={getSpan1}
                          rendermark={rendermark1}
                        />
                      )}
                    </NanoScroller>

                    {topHoverValue != null && renderHover(topHoverValue)}
                  </RefreshAndProgress>
                </RefreshAndProgress>
              </div>
              {!props.isPredDash && !isReviewMode && (
                <div
                  css={`
                    font-size: 14px;
                    margin-top: 11px;
                    position: absolute;
                    left: 10px;
                    top: 100%;
                  `}
                >
                  <FontAwesomeIcon icon={require('@fortawesome/pro-regular-svg-icons/faInfoCircle').faInfoCircle} transform={{ size: 18, x: 0, y: 0 }} style={{ marginRight: 6 }} />
                  Use Review Mode to add & edit annotations
                </div>
              )}
            </div>
            {!props.isPredDash && (
              <div className={styles.saveContainerWrapper}>
                <div className={`${styles.saveContainer} ${styles.saveContainerLeft}`}>
                  {isReviewMode && (
                    <ModalConfirm
                      onConfirmPromise={handleSwitchReviewModeOff.bind(null)}
                      title={
                        <div>
                          <span
                            css={`
                              font-size: 16px;
                            `}
                          >
                            Are you sure you want to switch off Review Mode?
                          </span>
                          <br />
                          <span
                            css={`
                              font-size: 14px;
                            `}
                          >
                            Multiple users won't be allowed to label the documents at the same time anymore.
                          </span>
                        </div>
                      }
                      icon={<QuestionCircleOutlined style={{ color: 'darkgreen' }} />}
                      okText={'Yes'}
                      cancelText={'No'}
                      okType={'primary'}
                    >
                      <NavigationButton>
                        <FontAwesomeIcon icon={['far', 'circle-xmark']} transform={{ size: 18, x: 0, y: 0 }} style={{ marginRight: 6 }} />
                        Exit Review
                      </NavigationButton>
                    </ModalConfirm>
                  )}
                </div>
                <div className={`${styles.saveContainer} ${styles.saveContainerRight}`}>
                  <div className={styles.saveInner}>
                    {!isReviewMode && (
                      <ModalConfirm
                        onConfirmPromise={handleSwitchReviewModeOn.bind(null)}
                        title={
                          <div>
                            <span
                              css={`
                                font-size: 16px;
                              `}
                            >
                              Are you sure you want to switch to Review Mode?
                            </span>
                            <br />
                            <span
                              css={`
                                font-size: 14px;
                              `}
                            >
                              This will allow multiple users to label the documents at the same time. A new column with feature mapping "STATUS" will be added if not already present.
                            </span>
                          </div>
                        }
                        icon={<QuestionCircleOutlined style={{ color: 'darkgreen' }} />}
                        okText={'Yes'}
                        cancelText={'No'}
                        okType={'primary'}
                      >
                        <Button
                          css={`
                            padding: 0 40px;
                          `}
                          type={'primary'}
                        >
                          Review Mode
                        </Button>
                      </ModalConfirm>
                    )}
                    {isReviewMode && isReviewStarted && !isDocInvalidForReview && (
                      <Button
                        className={styles.transitionNone}
                        disabled={isSaving || isLoadingData || isLoadingImage || isProcessingOCR || isDocInvalidForReview || isStatusDone}
                        css={`
                          padding: 0 4px;
                        `}
                        type="link"
                        danger
                        onClick={handleCancelReview}
                      >
                        <FontAwesomeIcon style={{ marginRight: 4 }} icon="ban" transform={{ size: 14, x: 0, y: 0 }} />
                        Cancel
                        {isSaving ? <FontAwesomeIcon style={{ marginLeft: 4 }} icon={require('@fortawesome/pro-duotone-svg-icons/faSync').faSync} spin transform={{ size: 14, x: 0, y: 0 }} /> : null}
                      </Button>
                    )}
                    {isReviewMode && !isReviewStarted && !isDocInvalidForReview && (
                      <Button
                        disabled={isSaving || isLoadingData || isLoadingImage || isProcessingOCR || isDocInvalidForReview || isStatusDone}
                        className={styles.transitionNone}
                        css={`
                          padding: 0 30px;
                        `}
                        type={'primary'}
                        onClick={handleStartReview}
                      >
                        Start Document Review
                        {isStartingReview ? <FontAwesomeIcon style={{ marginLeft: '5px' }} icon={require('@fortawesome/pro-duotone-svg-icons/faSync').faSync} spin transform={{ size: 14, x: 0, y: 0 }} /> : null}
                      </Button>
                    )}
                    {isReviewMode && isReviewStarted && !isDocInvalidForReview && (
                      <Button
                        disabled={isSaving || isLoadingData || isLoadingImage || isProcessingOCR || isDocInvalidForReview || isStatusDone || !isLastPage}
                        css={`
                          padding: 0 30px;
                        `}
                        type={'primary'}
                        onClick={handleSubmit}
                      >
                        Complete Document Review{isSaving ? <FontAwesomeIcon style={{ marginLeft: '5px' }} icon={require('@fortawesome/pro-duotone-svg-icons/faSync').faSync} spin transform={{ size: 14, x: 0, y: 0 }} /> : null}
                      </Button>
                    )}
                    {isReviewMode && isDocInvalidForReview && annotationState.userName && (
                      <span>
                        {isStatusDone ? 'Document already reviewed by' : 'Document under review by'} {annotationState.userName}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </RefreshAndProgress>
      </div>
    );
  };

  return (
    <div className={!props.isPredDash ? styles.annotationsPage : stylesDark.absolute}>
      <WindowSizeSmart onChangeSize={onChangeSize} />
      <AutoSizer>
        {({ width, height }) => {
          if (!props.isPredDash) height -= 50;

          return (
            <div style={{ height: height + 'px', width: width + 'px' }} className={!props.isPredDash ? styles.annotations : ''}>
              {
                <div className={styles.annotationsHeader}>
                  <span className={styles.annotationsTitle} css={props.isPredDash ? `font-size: 15px; display: flex; align-items: center;` : ``}>
                    <span>Annotations</span>
                    <HelpIcon id={(props.isPredDash ? 'preddash_' : '') + 'annotations_title'} style={{ marginLeft: '4px' }} />
                  </span>
                </div>
              }
              {props.isPredDash || !isPdf ? (
                annotationsInterfaceRender(height)
              ) : (
                <>
                  {/*// @ts-ignore*/}
                  <SplitPane
                    split={'vertical'}
                    minSize={300}
                    maxSize={-18}
                    defaultSize={Utils.dataNum('annotation_widget_width', width * 0.7)}
                    onChange={(v1) => {
                      Utils.dataNum('annotation_widget_width', undefined, v1);
                    }}
                  >
                    {annotationsInterfaceRender(height)}
                    <div style={{ margin: 8, position: 'absolute', top: 0, left: 0, right: 0, bottom: 80, maxHeight: height, overflow: 'hidden' }}>
                      <RefreshAndProgress isDim={isLoadingData || needsMaterialization} msgMsg={isLoadingData ? 'Loading...' : undefined}>
                        {/*// @ts-ignore*/}
                        <SplitPane
                          className={styles.tableContainer}
                          split="horizontal"
                          defaultSize={Utils.dataNum('annotation_widget_height_1', height / 3)}
                          onChange={(v1) => {
                            Utils.dataNum('annotation_widget_height_1', undefined, v1);
                          }}
                          minSize={40}
                          maxSize={-82}
                        >
                          <NanoScroller>
                            <NLPEntitiesColorsList showEmptyMsg={!isLoadingData} data={formattedAnnotations} showHeader />
                          </NanoScroller>
                          {/*// @ts-ignore*/}
                          <SplitPane
                            split="horizontal"
                            primary="second"
                            defaultSize={editorHeight}
                            onChange={(v1) => {
                              Utils.dataNum('annotation_widget_height_2', undefined, v1);
                              setEditorHeight(v1);
                            }}
                            minSize={isReviewMode ? 40 : 0}
                            maxSize={-42}
                          >
                            <div>
                              <NanoScroller>
                                <NLPEntitiesTables data={formattedAnnotations} hoverStyle={{ backgroundColor: 'rgb(19, 27, 38)', position: 'sticky', top: 40 }} header={<div className={styles.annotationWidgetHeader}>Annotated Text</div>} />
                              </NanoScroller>
                            </div>
                            {isReviewMode && isReviewStarted && (
                              <div className={styles.payloadContainer}>
                                <div className={styles.annotationWidgetHeader}>Raw Annotations Editor</div>
                                <div style={{ height: '100%', width: '100%' }}>
                                  <EditorElem
                                    hideExpandFGs
                                    height={editorHeight ? Math.max(editorHeight - 100, 0) : 0}
                                    lang="json"
                                    value={payload}
                                    hideErrors={false}
                                    onChange={(_, value) => {
                                      onChangeJSON(value);
                                    }}
                                  />
                                </div>
                              </div>
                            )}
                          </SplitPane>
                        </SplitPane>
                      </RefreshAndProgress>
                    </div>
                  </SplitPane>
                </>
              )}
            </div>
          );
        }}
      </AutoSizer>
      {!props.isPredDash && (
        <Modal title="Comments" open={isCommentsModalVisible} okButtonProps={{ loading: isSaving }} onOk={handleComment} onCancel={() => setIsCommentsModalVisible(false)}>
          {!fgFieldComments?.length && (
            <div
              css={`
                margin-bottom: 10px;
                color: red;
              `}
            >
              Please set a column with schema mapping "COMMENTS" first
            </div>
          )}
          <span>Select comments column:</span>
          <SelectExt
            options={fgFieldComments?.map((c) => ({ value: c, label: c }))}
            onChange={(e) => {
              setCurrentCommentsColumn(e?.value);
            }}
            isSearchable={true}
          />
          <div style={{ paddingTop: '25px' }}>
            {!useCommentsJsonEditor ? (
              <Input.TextArea
                rows={8}
                placeholder={`Write comments here...`}
                value={comments?.[currentCommentsColumn]}
                onChange={(e) => {
                  setColumnComments(currentCommentsColumn, e.target.value);
                }}
              />
            ) : (
              <EditorElem
                hideExpandFGs
                height={150}
                lang="json"
                hideErrors={false}
                value={comments?.[currentCommentsColumn]}
                onChange={(_, value) => {
                  setColumnComments(currentCommentsColumn, value);
                }}
              />
            )}
          </div>
          <Checkbox
            checked={useCommentsJsonEditor}
            onChange={(e) => {
              setUseCommentsJsonEditor(e.target.checked);
            }}
            style={{ marginTop: 10 }}
          >
            <span
              css={`
                color: white;
              `}
            >
              Use JSON Editor
            </span>
          </Checkbox>
        </Modal>
      )}
    </div>
  );
});

export default AnnotationsEdit;
