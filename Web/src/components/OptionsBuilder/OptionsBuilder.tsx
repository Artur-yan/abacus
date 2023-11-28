import Form, { FormInstance } from 'antd/lib/form';
import * as _ from 'lodash';
import * as React from 'react';
import { PropsWithChildren, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import FormExt from '../FormExt/FormExt';
import { buildOptionInput, prepareBuildOptions } from '../ModelTrain/helpers';
const s = require('./OptionsBuilder.module.css');
const sd = require('../antdUseDark.module.css');

interface IOptionsBuilderProps {
  optionsGetCall?: (cbFinish: (err, res) => void) => void;
  onUsedFieldNames?: (names: string[]) => void;
  id?: any;
  wrapForm?: boolean;
  form?: FormInstance;
  setFieldsValue?: (values: any) => void;
  onValuesChange?: (values: any) => void;
  projectId?: string;
  initialValues?: any;
  onChangeForm?: (values?: any) => void;
  helpIdPrefix?: string;
  formForceRefresh?: () => void;
}

const OptionsBuilder = React.memo((props: PropsWithChildren<IOptionsBuilderProps>) => {
  const { paramsProp, authUser } = useSelector((state: any) => ({
    paramsProp: state.paramsProp,
    authUser: state.authUser,
  }));

  const [ignored, forceUpdate] = useReducer((x) => x + 1, 0);
  const [options, setOptions] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    props.optionsGetCall?.((err, res) => {
      if (err || !res?.success) {
        setOptions(null);
        // REActions.addNotificationError(err || Constants.errorDefault);
      } else {
        setOptions(res?.result);
      }
    });
  }, [props.id, props.optionsGetCall]);

  const formForceRefresh = () => {
    props.formForceRefresh?.();
    forceUpdate();
  };

  const initialValuesResRef = useRef(null);

  let initialValuesRes = null,
    normalTrainingOptionsList = null,
    fieldNames = [];
  if (options) {
    initialValuesRes = initialValuesRes ?? {};

    let oo = [];
    let kk = Object.keys(options || {});
    kk.some((k1) => {
      fieldNames.push(k1);
      let o1 = options[k1];
      o1.inputName = k1;
      oo.push(o1);
    });
    oo = prepareBuildOptions(oo);

    let formRef1 = null;
    if (props.wrapForm) {
      formRef1 = form == null ? null : { current: form };
    } else {
      formRef1 = props.form == null ? null : { current: props.form };
    }
    normalTrainingOptionsList = oo?.map((o1, o1ind) => buildOptionInput(oo, o1, o1ind, props.onChangeForm, undefined, props.projectId, formRef1, oo[o1ind - 1], false, formForceRefresh, props.helpIdPrefix));
    normalTrainingOptionsList.some((o1) => {
      initialValuesRes = _.assign({}, initialValuesRes, o1.initialValues ?? {});
    });
    normalTrainingOptionsList = _.flatten(normalTrainingOptionsList.map((o1) => o1.list));

    if (props.initialValues != null) {
      initialValuesRes = _.assign(initialValuesRes, props.initialValues);
    }

    if (initialValuesResRef.current == null || !_.isEqual(initialValuesResRef.current, initialValuesRes)) {
      initialValuesResRef.current = initialValuesRes;
    } else {
      initialValuesRes = initialValuesResRef.current;
    }
  }

  useMemo(() => {
    props.onUsedFieldNames?.(fieldNames);
  }, [options]);

  const lastInitialValues = useRef(null);
  useMemo(() => {
    if (lastInitialValues.current == null || !_.isEqual(lastInitialValues.current, initialValuesRes)) {
      lastInitialValues.current = initialValuesRes == null ? null : _.assign({}, initialValuesRes);
    }
    props.setFieldsValue?.(initialValuesRes);
  }, [initialValuesRes]);

  const onValuesChange = (values) => {
    props.onValuesChange?.(values);

    forceUpdate();
  };

  if (props.wrapForm) {
    return (
      <div>
        {initialValuesRes != null && (
          <FormExt layout={'vertical'} onValuesChange={onValuesChange} form={form} initialValues={initialValuesRes}>
            {normalTrainingOptionsList}
          </FormExt>
        )}
      </div>
    );
  } else {
    return normalTrainingOptionsList;
  }
});

export default OptionsBuilder;
