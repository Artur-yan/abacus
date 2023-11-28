import Form from 'antd/lib/form';
import { FormProps } from 'antd/lib/form/Form';
import { FormInstance } from 'antd/lib/form/hooks/useForm';
import * as React from 'react';
import { useMemo, useReducer } from 'react';
const s = require('./FormExt.module.css');
const sd = require('../antdUseDark.module.css');

interface IFormExtProps {}

const FormExt = React.memo(
  React.forwardRef(
    (
      props: FormProps<any> & {
        children?: React.ReactNode;
      } /* & {
  ref?: React.Ref<FormInstance<any>> | undefined;
}*/,
      ref: React.Ref<FormInstance<any>> | undefined,
    ) => {
      const [ignored, forceUpdate] = useReducer((x) => x + 1, 0);

      const pp = useMemo(() => {
        let res = { ...(props ?? {}) };

        if (res.labelCol == null) {
          res.labelCol = { span: 24 };
        }
        if (res.wrapperCol == null) {
          res.wrapperCol = { span: 24 };
        }
        // if(res.layout==null) {
        res.layout = undefined;
        // }

        return res;
      }, [props]);

      return <Form {...pp} ref={ref} />;
    },
  ),
);

export default FormExt;
