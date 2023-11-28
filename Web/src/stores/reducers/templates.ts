import * as Immutable from 'immutable';
import * as _ from 'lodash';
import Utils from '../../../core/Utils';
import { useNormalizedId } from '../../api/REUses';
import StoreActions from '../actions/StoreActions';

export const convertBEToConfig = (value: { value?; valueType?; name?; isFromDefault?; isRequired? }[]) => {
  let res: ITemplateConfig = [];

  if (_.isArray(value)) {
    value?.some((v1) => {
      let value1 = v1?.value;
      let type1 = v1?.valueType ?? (v1 as any)?.value_type;
      let is_from_default = (v1 as any)?.is_from_default ?? v1?.isFromDefault;

      let isReq = v1?.isRequired;
      if (isReq == null) {
        isReq = true;
      }

      res.push({
        type: type1 ?? ETemplatesOneType.TABLE,
        name: value1 ?? null,
        value: v1?.name,
        isDefault: is_from_default,
        isRequired: isReq,
      });
    });
  }

  return res;
};

export const convertConfigToBE = (value: ITemplateConfig) => {
  let res: any = [];

  value?.some((c1) => {
    res.push({
      name: c1.value,
      value: c1.name,
      valueType: c1.type,
      isRequired: c1.isRequired,
    });
  });

  // res = res?.filter(c1 => c1?.value!=null);

  return res;
};

export interface ITemplateConfigOne {
  name?: string;
  value?: string;
  type?: ETemplatesOneType;
  isDefault?: boolean;
  isRequired?: boolean;
}

export interface PythonFunctionConfigItem {
  name?: string;
  value?: string | boolean;
  checked?: boolean;
  isRequired?: boolean;
  type?: PythonFunctionArgumentTypes;
  validTypes?: PythonFunctionArgumentTypes[];
  index?: string;
}

export type PythonFunctionConfig = PythonFunctionConfigItem[];

export type ITemplateConfig = ITemplateConfigOne[];

export enum ETemplatesOneType {
  //Python Functions
  FEATURE_GROUP = 'feature_group',

  TABLE = 'table_name',
  COLUMN = 'column_name',
  WHERE = 'where_clause',
  GROUP_BY = 'group_by_clause',
  FILTER = 'filter_clause',
  STRING = 'string',
  SQL_FRAGMENT = 'sql_fragment',

  // STRING = 'string',
}

export const ETemplatesOneTypePlaceholder = {
  [ETemplatesOneType.FEATURE_GROUP]: '',
  [ETemplatesOneType.TABLE]: '',
  [ETemplatesOneType.COLUMN]: '',
  [ETemplatesOneType.WHERE]: 'where a > b',
  [ETemplatesOneType.GROUP_BY]: 'group by a',
  [ETemplatesOneType.FILTER]: 'filter where a > b',
  [ETemplatesOneType.STRING]: '',
  [ETemplatesOneType.SQL_FRAGMENT]: '',
};

export const ETemplatesOneTypeDefault = ETemplatesOneType.TABLE;

export enum PythonFunctionArgumentTypes {
  FEATURE_GROUP = 'FEATURE_GROUP',
  STRING = 'STRING',
  INTEGER = 'INTEGER',
  BOOLEAN = 'BOOLEAN',
  FLOAT = 'FLOAT',
  JSON = 'JSON',
  LIST = 'LIST',
}

export const PythonFunctionArgumentDefaultType = PythonFunctionArgumentTypes.FEATURE_GROUP;

// TODO(rohan): There should only be 1 list for python functions, refactor react/Web/src/components/TemplateConfigEditor/TemplateConfigEditor.tsx and eventually remove this
export const ETemplatesOneTypeSupportedOnPythonFunctions = [ETemplatesOneType.TABLE, ETemplatesOneType.COLUMN, ETemplatesOneType.FEATURE_GROUP];

export const PythonFunctionArgumentList = [
  PythonFunctionArgumentTypes.FEATURE_GROUP,
  PythonFunctionArgumentTypes.STRING,
  PythonFunctionArgumentTypes.INTEGER,
  PythonFunctionArgumentTypes.FLOAT,
  PythonFunctionArgumentTypes.BOOLEAN,
  PythonFunctionArgumentTypes.JSON,
  PythonFunctionArgumentTypes.LIST,
];

export const PythonFunctionArgumentInitialValues = {
  [PythonFunctionArgumentTypes.FEATURE_GROUP]: '',
  [PythonFunctionArgumentTypes.STRING]: '',
  [PythonFunctionArgumentTypes.INTEGER]: '',
  [PythonFunctionArgumentTypes.FLOAT]: '',
  [PythonFunctionArgumentTypes.BOOLEAN]: '',
  [PythonFunctionArgumentTypes.JSON]: '{}',
  [PythonFunctionArgumentTypes.LIST]: '[]',
};

let initState = Immutable.fromJS({
  isRefreshing: 0,
  templateById: {},
  templateListByProjectId: {},
}) as Immutable.Map<string, any>;

const templates = (state = initState, action) => {
  if (action.payload == null) {
    action.payload = {};
  }

  switch (action.type) {
    case StoreActions.RESET_CHANGE_ORG:
      state = state.set('templateById', Immutable.fromJS({}));
      state = state.set('templateListByProjectId', Immutable.fromJS({}));
      return state;

    case StoreActions.FEATUREGROUPS_DESCRIBE_RESET:
      state = state.set('templateById', Immutable.fromJS({}));
      state = state.set('templateListByProjectId', Immutable.fromJS({}));
      return state;

    case StoreActions.TEMPLATE_DETAIL_BEGIN:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) + 1);
      return state;

    case StoreActions.TEMPLATE_DETAIL_END:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) - 1);
      state = state.setIn(['templateById', '' + useNormalizedId(action.payload.featureGroupTemplateId)], action.payload.result || {});
      return state;

    case StoreActions.TEMPLATE_LIST_BEGIN:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) + 1);
      return state;

    case StoreActions.TEMPLATE_LIST_END:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) - 1);
      state = state.setIn(['templateListByProjectId', '' + useNormalizedId(action.payload.projectId)], action.payload.result || []);
      return state;

    default:
      return state;
  }
};

templates.calcDetailById = (state?: any, featureGroupTemplateId?) => {
  featureGroupTemplateId = useNormalizedId(featureGroupTemplateId);
  if (!featureGroupTemplateId) {
    return null;
  }

  if (state == null) {
    state = Utils.globalStore().getState();
  }
  if (state.templates) {
    state = state.templates;
  }

  return state.getIn(['templateById', '' + featureGroupTemplateId]);
};

templates.memDetailById = (doCall, featureGroupTemplateId) => {
  featureGroupTemplateId = useNormalizedId(featureGroupTemplateId);
  if (!featureGroupTemplateId) {
    return null;
  }

  let state = Utils.globalStore().getState();
  if (state.templates) {
    state = state.templates;
  }

  let res = templates.calcDetailById(undefined, featureGroupTemplateId);
  if (res != null) {
    return res;
  } else {
    if (state.get('isRefreshing')) {
      return null;
    } else {
      if (doCall) {
        StoreActions.describeTemplate_(featureGroupTemplateId);
      }
    }
  }
};

templates.calcListByProjectId = (state?: any, projectId?) => {
  projectId = useNormalizedId(projectId);

  if (state == null) {
    state = Utils.globalStore().getState();
  }
  if (state.templates) {
    state = state.templates;
  }

  return state.getIn(['templateListByProjectId', '' + projectId]);
};

templates.memListByProjectId = (doCall, projectId) => {
  projectId = useNormalizedId(projectId);

  let state = Utils.globalStore().getState();
  if (state.templates) {
    state = state.templates;
  }

  let res = templates.calcListByProjectId(undefined, projectId);
  if (res != null) {
    return res;
  } else {
    if (state.get('isRefreshing')) {
      return null;
    } else {
      if (doCall) {
        StoreActions.listTemplatesByProjectId_(projectId);
      }
    }
  }
};

export default templates;
