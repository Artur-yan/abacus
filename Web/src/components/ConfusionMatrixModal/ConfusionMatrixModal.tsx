import { InputNumber } from 'antd';
import Button from 'antd/lib/button';
import Form from 'antd/lib/form';
import * as Immutable from 'immutable';
import _ from 'lodash';
import * as React from 'react';
import { Provider, useSelector } from 'react-redux';
import AutoSizer from 'react-virtualized/dist/commonjs/AutoSizer';
import Utils, { ReactLazyExt } from '../../../core/Utils';
import REActions from '../../actions/REActions';
import REClient_ from '../../api/REClient';
import Constants from '../../constants/Constants';
import StoreActions from '../../stores/actions/StoreActions';
import FormExt from '../FormExt/FormExt';
import ModalConfirm from '../ModalConfirm/ModalConfirm';
const ReactEcharts = ReactLazyExt(() => import('echarts-for-react'));
const styles = require('./ConfusionMatrixModal.module.css');

interface ContentProps {
  data?: any;
  form: any;
  initialValues: any;
}

export const PAYOFF_MATRIX_TYPES = {
  TN: 'tn',
  FP: 'fp',
  FN: 'fn',
  TP: 'tp',
};

const INPUT_NAMES_ORDER = [PAYOFF_MATRIX_TYPES.TN, PAYOFF_MATRIX_TYPES.FP, PAYOFF_MATRIX_TYPES.FN, PAYOFF_MATRIX_TYPES.TP];

const Content = React.memo((props: ContentProps) => {
  const selectedChartIndex = 0;
  const predictionDistributionChart = React.useMemo(() => {
    let { data } = props;
    if (!data) {
      return;
    }

    if (Immutable.isImmutable(data)) {
      data = data.toJS();
    }

    const containerStyles = {
      height: 640,
      width: 640,
      marginTop: 8,
    };

    const widgetStyles = {
      width: '100%',
      height: '100%',
      backgroundColor: 'transparent',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: '8px',
    };

    const inputs = INPUT_NAMES_ORDER.map((name, index) => (
      <Form.Item key={index} className={styles.formItem} name={name}>
        <InputNumber controls={false} className={styles.payoffInput} />
      </Form.Item>
    ));

    return (
      <div style={widgetStyles}>
        <React.Suspense fallback={<div></div>}>
          <div style={{ position: 'relative', display: 'inline-block', ...containerStyles }}>
            <AutoSizer>
              {() => (
                <div>
                  <ReactEcharts
                    key={`a${Math.random()}`}
                    option={{
                      ...props.data?.chart?.data?.data,
                      backgroundColor: 'transparent',
                      width: 480,
                      height: 480,
                      label: {
                        formatter: (v1) => {
                          let value = v1?.value?.[2] || '';
                          value = `${value}`;
                          const emptySpace = ' '.repeat(value.length);
                          return `${value}    X                  ${emptySpace}`;
                        },
                        ...props.data?.chart?.data?.data?.label,
                      },
                    }}
                    style={containerStyles}
                    theme={'dark'}
                  />
                </div>
              )}
            </AutoSizer>
            <Provider store={Utils.globalStore()}>
              <FormExt className={styles.form} form={props.form} layout={'vertical'} initialValues={props.initialValues}>
                {inputs}
              </FormExt>
            </Provider>
          </div>
        </React.Suspense>
      </div>
    );
  }, [props.data, selectedChartIndex]);

  return predictionDistributionChart;
});

interface ConfusionMatrixModalProps {
  data?: any;
  optionsConfig: any;
}

const ConfusionMatrixModal = React.memo((props: ConfusionMatrixModalProps) => {
  const { paramsProp } = useSelector((state: any) => ({
    paramsProp: state.paramsProp,
  }));

  let projectId = paramsProp?.get('projectId');
  let detailModelId = paramsProp?.get('detailModelId');

  const [form] = Form.useForm();
  const initialValues = React.useMemo(() => {
    const res = {};
    Object.values(PAYOFF_MATRIX_TYPES).forEach((type) => {
      res[type] = props?.optionsConfig?.payoff_matrix?.[type];
    });
    return res;
  }, [props.optionsConfig]);

  React.useEffect(() => {
    form?.setFieldsValue?.(initialValues);
  }, [form, initialValues]);

  const onConfirmPromise = async () => {
    const values = _.cloneDeep(form.getFieldsValue(true));
    const payload = { ...props.optionsConfig, payoff_matrix: values };
    let response: any = {};
    try {
      response = await REClient_.promises_().setModelPredictionParams(detailModelId, payload);
      if (!response?.success) {
        throw new Error(response.error);
      }
      StoreActions.listModels_(projectId);
      StoreActions.modelsVersionsByModelId_(detailModelId);
      StoreActions.getModelDetail_(detailModelId);
      StoreActions.resetModelVersionsMetrics_();
      return true;
    } catch (error) {
      REActions.addNotificationError(error?.message || Constants.errorDefault);
      return false;
    }
  };

  let left = 'calc(100% - 212px)';
  let top = 63;
  if (props.data?.secondaryChart) {
    left = 'calc(50% - 216px)';
    top = 13;
  }

  const isAdd = initialValues?.[PAYOFF_MATRIX_TYPES.TN] == null;
  const title = isAdd ? 'Add Payoff' : 'Edit Payoff';
  return (
    <ModalConfirm onConfirmPromise={onConfirmPromise} title={<Content data={props.data} form={form} initialValues={initialValues} />} okText={'Save'} cancelText={'Cancel'} okType={'primary'} width={900}>
      <Button type="primary" size="small" style={{ position: 'absolute', left, top, zIndex: 100 }}>
        {title}
      </Button>
    </ModalConfirm>
  );
});

export default ConfusionMatrixModal;
