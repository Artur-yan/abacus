import { Col, Row } from 'antd';
import Button from 'antd/lib/button';
import Checkbox from 'antd/lib/checkbox';
import Form from 'antd/lib/form';
import Input from 'antd/lib/input';
import Radio from 'antd/lib/radio';
import Select from 'antd/lib/select';
import classNames from 'classnames';
import _ from 'lodash';
import * as React from 'react';
import { PropsWithChildren, useEffect, useMemo } from 'react';
import { Provider, useSelector } from 'react-redux';
import Utils from '../../../core/Utils';
import REActions from '../../actions/REActions';
import REClient_ from '../../api/REClient';
import Constants from '../../constants/Constants';
import StoreActions from '../../stores/actions/StoreActions';
import { useFeatureGroupId, usePitGroup, useProjectId } from '../../stores/hooks';
import featureGroups from '../../stores/reducers/featureGroups';
import { memProjectById } from '../../stores/reducers/projects';
import EditorElemForFeatureGroup from '../EditorElemForFeatureGroup/EditorElemForFeatureGroup';
import FormExt from '../FormExt/FormExt';
import HelpIcon from '../HelpIcon/HelpIcon';
import ModalConfirm from '../ModalConfirm/ModalConfirm';
import RefreshAndProgress from '../RefreshAndProgress/RefreshAndProgress';
const { Option } = Select;

const styles = require('./FeaturesOneAddTimeTravelGroupFeature.module.css');
const stylesDark = require('../antdUseDark.module.css');

enum PitGenerationTypes {
  predefined = 'Template',
  manual = 'Sql Expression',
}

interface ContentProps {
  pitGroupFeatureName?: any;
  form: any;
  initialValues: any;
  projectId: string;
  featureGroupId: string;
  windowFunctionOptions: any[];
}

const Strings = {
  edit_hint: 'You may add any number of features separated by a new line to this feature group. Use the keyword `AS` to name the feature, otherwise a unique name will be automatically inferred',
  edit_instructions: 'Enter each expression on a new line',
  sample_1: 'MIN(price) AS min_price',
  sample_2: 'MAX(price) AS max_price',
  sample_3: 'AVG(price) AS avg_price',
  sample_4: 'COUNT(1) AS total_sale',
};

const Content = React.memo((props: PropsWithChildren<ContentProps>) => {
  const samples = props.pitGroupFeatureName ? null : (
    <span>
      {Strings.sample_1}
      <br />
      {Strings.sample_2}
      <br />
      {Strings.sample_3}
      <br />
      {Strings.sample_4}
    </span>
  );

  const pitGenerationType = Form.useWatch('pitGenerationType', props.form);
  const columnOptions = useMemo(() => {
    return props.initialValues.columns?.map?.((column) => (
      <Option value={column} key={column}>
        {column}
      </Option>
    ));
  }, [props.initialValues]);

  const radioInput = (
    <Form.Item style={{ margin: '8px 0' }} name={'pitGenerationType'}>
      <Radio.Group>
        {Object.values(PitGenerationTypes).map((value) => (
          <Radio value={value} key={value} className={styles.radio}>
            {value}
          </Radio>
        ))}
      </Radio.Group>
    </Form.Item>
  );

  const prefixCheckbox = (
    <Form.Item valuePropName="checked" name={'prefix'}>
      <Checkbox>
        <span
          css={`
            color: white;
          `}
        >
          Use Group Name as Prefix
        </span>
      </Checkbox>
    </Form.Item>
  );

  const nameInput = (
    <Form.Item name={'name'} label={<span style={{ color: Utils.colorA(1) }}>Name</span>}>
      <Input className={styles.nameInput} disabled placeholder={'Name'} />
    </Form.Item>
  );

  const sqlInput = (
    <div className={styles.sqlContainer}>
      <Form.Item name={'sql'} rules={[{ required: true, message: 'Required' }]} style={{ marginBottom: 0 }} label={<span style={{ color: Utils.isDark() ? 'white' : 'black' }}>{`Expression${props.pitGroupFeatureName ? '' : 's'}:`}</span>}>
        <EditorElemForFeatureGroup projectId={props.projectId} onlyThisFeatureGroup featureGroupId={props.featureGroupId} hideExpandFull height={200} />
      </Form.Item>
      <div className={styles.sampleContainer}>
        {!props.initialValues?.sql && (
          <>
            <div className={styles.sampleTitle}>Sample</div>
            <div className={styles.sampleList}>{samples}</div>
          </>
        )}
        {!props.pitGroupFeatureName && <div className={classNames(styles.editInstructions)}>{Strings.edit_instructions}</div>}
      </div>
    </div>
  );

  const aggregationsCheckboxes = (
    <div className={styles.aggregationsContainer}>
      <Form.Item
        name={'windowFunctions'}
        rules={[{ required: true, message: 'Required' }]}
        style={{ marginBottom: 0 }}
        label={
          <span style={{ color: Utils.isDark() ? 'white' : 'black' }}>
            Aggregations:
            <HelpIcon id={'pit_auto_aggregations'} style={{ marginLeft: '4px' }} />
          </span>
        }
      >
        <Checkbox.Group>
          <Row>
            {props.windowFunctionOptions.map((windowFunction) => {
              return (
                <Col key={windowFunction.value} span={6}>
                  <span>
                    <Checkbox value={windowFunction.value} style={{ lineHeight: '32px', color: 'white' }}>
                      {windowFunction.label}
                    </Checkbox>
                    <HelpIcon tooltipText={windowFunction.description} style={{ color: Utils.isDark() ? 'white' : 'black', marginLeft: '0px' }} />
                  </span>
                </Col>
              );
            })}
          </Row>
        </Checkbox.Group>
      </Form.Item>
    </div>
  );

  const onClickOptionsColumnsClear = () => {
    props.form.setFieldsValue({ columns: [] });
  };

  const onClickOptionsColumnsSetAll = () => {
    props.form.setFieldsValue({ columns: props.initialValues.columns });
  };

  const columnsSelect = (
    <Form.Item
      name="columns"
      hasFeedback
      rules={[{ required: true, message: 'Required' }]}
      className={styles.columnsContainer}
      label={
        <div className={styles.columnsHeader} style={{ color: Utils.isDark() ? 'white' : 'black' }}>
          <span style={{ color: Utils.isDark() ? 'white' : 'black' }}>
            Columns:
            <HelpIcon id={'pit_auto_columns'} style={{ marginLeft: '4px' }} />
          </span>
          {props.initialValues.columns?.length && (
            <span
              css={`
                margin-left: 5px;
                display: inline-block;
                text-align: right;
              `}
            >
              {
                <Button ghost type={'default'} size={'small'} onClick={onClickOptionsColumnsClear}>
                  Clear
                </Button>
              }
              {
                <Button
                  ghost
                  css={`
                    margin-left: 5px;
                  `}
                  type={'default'}
                  size={'small'}
                  onClick={onClickOptionsColumnsSetAll}
                >
                  Select All
                </Button>
              }
            </span>
          )}
        </div>
      }
    >
      <Select key={'selectedColumns'} mode="tags" tokenSeparators={[',']}>
        {columnOptions}
      </Select>
    </Form.Item>
  );

  return (
    <div className={'useDark'} style={{ color: Utils.colorA(1) }}>
      <RefreshAndProgress isRelative>
        <Provider store={Utils.globalStore()}>
          <div className={styles.container}>
            <div className={styles.contentTitle}>{props.pitGroupFeatureName ? 'Edit Features' : 'Add Features'}</div>
            <FormExt form={props.form} className={styles.form} layout={'vertical'} initialValues={props.initialValues}>
              {!props.pitGroupFeatureName && radioInput}
              {pitGenerationType === PitGenerationTypes.predefined ? (
                <>
                  {prefixCheckbox}
                  {columnsSelect}
                  {aggregationsCheckboxes}
                </>
              ) : (
                <>
                  {!props.pitGroupFeatureName && <div className={styles.editHint}>{Strings.edit_hint}</div>}
                  <div className={styles.divider} />
                  {props.pitGroupFeatureName && nameInput}
                  {sqlInput}
                </>
              )}
              {/* { columnsSelect } */}
            </FormExt>
          </div>
        </Provider>
      </RefreshAndProgress>
    </div>
  );
});

interface FeaturesOneAddTimeTravelGroupFeatureProps {
  buttonProps?: any;
  pitGroupFeatureName?: any;
  pitGroupName?: any;
}

const FeaturesOneAddTimeTravelGroupFeature = React.memo((props: PropsWithChildren<FeaturesOneAddTimeTravelGroupFeatureProps>) => {
  const { featureGroupsParam, projectsParam } = useSelector((state: any) => ({
    featureGroupsParam: state.featureGroups,
    projectsParam: state.projects,
  }));

  const [historyFeatureGroupId, setHistoryFeatureGroupId] = React.useState(null);

  const pitGroupName = usePitGroup() || props.pitGroupName;
  const featureGroupId = useFeatureGroupId();
  const [form] = Form.useForm();
  let projectId = useProjectId();
  if (projectId === '-') {
    projectId = null;
  }

  const project = useMemo(() => {
    return memProjectById(projectId, false);
  }, [projectsParam, projectId]);

  useEffect(() => {
    memProjectById(projectId, true);
  }, [projectsParam, projectId]);

  const allFeatureGroups = useMemo(() => {
    return featureGroups.memFeatureGroupsForProjectIdPublic(false, null);
  }, [featureGroupsParam]);

  useEffect(() => {
    featureGroups.memFeatureGroupsForProjectIdPublic(true, null);
  }, [featureGroupsParam]);

  const pitWindowFunctions = useMemo(() => {
    return featureGroups.memPitWindowFunctions(false);
  }, [featureGroupsParam]);

  useEffect(() => {
    featureGroups.memPitWindowFunctions(true);
  }, [featureGroupsParam]);

  const featureGroup = useMemo(() => {
    return featureGroups.memFeatureGroupsForId(false, projectId, featureGroupId);
  }, [featureGroupsParam, featureGroupId, projectId]);

  useEffect(() => {
    featureGroups.memFeatureGroupsForId(true, projectId, featureGroupId);
  }, [featureGroupsParam, featureGroupId, projectId]);

  const historyFeatureGroup = useMemo(() => {
    return featureGroups.memFeatureGroupsForId(false, null, historyFeatureGroupId);
  }, [featureGroupsParam, featureGroupId, historyFeatureGroupId, projectId]);

  useEffect(() => {
    featureGroups.memFeatureGroupsForId(true, null, historyFeatureGroupId);
  }, [featureGroupsParam, featureGroupId, historyFeatureGroupId, projectId]);

  useEffect(() => {
    featureGroups.memFeatureGroupsForProjectId(true, projectId);
  }, [projectId, featureGroupsParam]);

  const [windowFunctions, windowFunctionOptions] = useMemo(() => {
    const windowFunctionOptions = pitWindowFunctions?.map?.((windowFunction) => ({ value: windowFunction.name, label: windowFunction.displayName, description: windowFunction.description })) || [];
    const windowFunctions = windowFunctionOptions.map((option) => option.value);
    return [windowFunctions, windowFunctionOptions];
  }, [pitWindowFunctions, featureGroup, form, featureGroupsParam]);

  useEffect(() => {
    if (historyFeatureGroupId) {
      return;
    }
    let pointInTimeGroup = featureGroup?.pointInTimeGroups?.find((pointInTimeGroup) => pointInTimeGroup.groupName === pitGroupName);
    if (pointInTimeGroup?.historyTableName) {
      const historyFeatureGroup = allFeatureGroups?.find((featureGroup) => featureGroup.name === pointInTimeGroup?.historyTableName) || ({} as any);
      setHistoryFeatureGroupId(historyFeatureGroup?.featureGroupId);
    }
  }, [featureGroup, allFeatureGroups, pitGroupName, featureGroupsParam]);

  const initialValues = useMemo(() => {
    let pointInTimeGroup = featureGroup?.pointInTimeGroups?.find((pointInTimeGroup) => pointInTimeGroup.groupName === pitGroupName);
    const featureGroupForColumns = pointInTimeGroup?.historyTableName ? historyFeatureGroup : featureGroup;
    let sql = pointInTimeGroup?.featuresRaw;
    let name = null;
    if (props.pitGroupFeatureName) {
      const feature = pointInTimeGroup?.features?.find((feature) => feature.name === props.pitGroupFeatureName);
      sql = feature?.expression;
      name = feature?.name;
    }
    let pitFeatures = featureGroup?.pointInTimeGroups?.map?.((pointInTimeGroup) => pointInTimeGroup?.features?.map((feature) => feature.name)) || [];
    pitFeatures = pitFeatures.flat();
    const featureGroupSchema = featureGroupForColumns?.projectFeatureGroupSchema?.schema ?? featureGroupForColumns?.features ?? [];
    const columns = featureGroupSchema?.filter?.((column) => !pitFeatures.includes(column.name))?.map?.((column) => column.name) || [];
    const res = {
      name,
      sql: sql || '',
      windowFunctions,
      prefix: true,
      columns,
      pitGenerationType: sql ? PitGenerationTypes.manual : PitGenerationTypes.predefined,
    };
    return res;
  }, [props.pitGroupFeatureName, featureGroupId, featureGroup, windowFunctions, form, allFeatureGroups, historyFeatureGroup, historyFeatureGroupId, featureGroupsParam]);

  useEffect(() => {
    form?.setFieldsValue?.(initialValues);
  }, [form, initialValues]);

  // NOTE: The form is being used for managing state, event handlers and validation of required fields, modal is handling the submit
  const onConfirmPromise = async () => {
    const values = _.cloneDeep(form.getFieldsValue(true));
    let pointInTimeGroup = featureGroup?.pointInTimeGroups?.find((pointInTimeGroup) => pointInTimeGroup.groupName === pitGroupName);
    const prefix = values?.prefix ? pointInTimeGroup?.groupName : undefined;
    let response: any = {};
    try {
      if (props.pitGroupFeatureName) {
        response = await REClient_.promises_().updatePointInTimeGroupFeature(featureGroupId, pitGroupName, props.pitGroupFeatureName, values.sql);
      } else if (values.pitGenerationType === PitGenerationTypes.manual) {
        response = await REClient_.promises_()._setPointInTimeGroupFeatureExpressions(featureGroupId, pitGroupName, values.sql);
      } else {
        response = await REClient_.promises_()._addPointInTimeGeneratedFeatures(featureGroupId, pitGroupName, values.columns, values.windowFunctions, prefix);
      }
      if (!response?.success) {
        throw new Error(response.error);
      }
      StoreActions.featureGroupsDescribe_(projectId, response?.result?.featureGroupId);
      return true;
    } catch (error) {
      REActions.addNotificationError(error?.message || Constants.errorDefault);
      return false;
    }
  };

  return (
    <ModalConfirm
      width={1000}
      onConfirmPromise={onConfirmPromise}
      title={<Content form={form} initialValues={initialValues} windowFunctionOptions={windowFunctionOptions} pitGroupFeatureName={props.pitGroupFeatureName} projectId={projectId} featureGroupId={historyFeatureGroupId || featureGroupId} />}
      okText={'Save'}
      cancelText={'Cancel'}
      okType={'primary'}
    >
      <Button {...props.buttonProps} />
    </ModalConfirm>
  );
});

export default FeaturesOneAddTimeTravelGroupFeature;
