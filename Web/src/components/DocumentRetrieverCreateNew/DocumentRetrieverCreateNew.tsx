import { Button, Card, Form, Input, Spin } from 'antd';
import InputNumber from 'antd/lib/input-number';
import React, { useEffect, useMemo, useState } from 'react';

import { useAppSelector } from '../../../core/hooks';
import Location from '../../../core/Location';
import Utils from '../../../core/Utils';

import REClient_ from '../../api/REClient';
import StoreActions from '../../stores/actions/StoreActions';

import sd from '../antdUseDark.module.css';
import HelpIcon from '../HelpIcon/HelpIcon';
import PartsLink from '../NavLeft/PartsLink';
import SelectExt from '../SelectExt/SelectExt';

interface DocumentRetrieverCreateNewProps {
  isEdit?: boolean;
}

export const DocumentRetrieverCreateNew = React.memo(function DocumentRetrieverCreateNew({ isEdit }: DocumentRetrieverCreateNewProps) {
  const projectId = useAppSelector((state) => state.paramsProp?.get('projectId'));
  const documentRetrieverId = useAppSelector((state) => state.paramsProp?.get('documentRetrieverId'));
  const navParamsImmutable = useAppSelector((state) => state.navParams);

  const [form] = Form.useForm();

  const [isProcessing, setIsProcessing] = useState(false);
  const [fgSelectOptions, setFgSelectOptions] = useState([]);

  const textEncoderOptions = useMemo(() => {
    return [
      { label: 'E5', value: 'E5' },
      { label: 'OPENAI', value: 'OPENAI' },
      { label: 'SENTENCE_BERT', value: 'SENTENCE_BERT' },
    ];
  }, []);

  useEffect(() => {
    const listFGPromise = REClient_.promisesV2()
      ._listProjectFeatureGroups(projectId)
      .then((res) => {
        const mappedFGSelectOptions = res?.result
          ?.map((fg) => ({
            label: fg.tableName,
            value: fg.featureGroupId,
          }))
          .sort((a, b) => a?.label?.localeCompare(b?.label));

        setFgSelectOptions(mappedFGSelectOptions);
        return res?.result;
      });
    const describeDocumentRetrieverPromise = isEdit
      ? REClient_.promisesV2()
          .describeDocumentRetriever(documentRetrieverId)
          .then((res) => res?.result)
      : Promise.resolve();

    Promise.all([listFGPromise, describeDocumentRetrieverPromise]).then(([fgRows, editDocumentRetrieverDetail]) => {
      if (!editDocumentRetrieverDetail) {
        return;
      }
      // Added setTimeout so that this runs after https://github.com/realityengines/code/blob/467ec1399bfc9d41a53b91f3f497e6d3a1406b00/react/Web/src/components/NavLeft/NavLeft.tsx#L1928
      setTimeout(() => {
        const navParams = navParamsImmutable.set('documentRetrieverName', editDocumentRetrieverDetail?.name);
        StoreActions.setNavParams_(navParams.toJS());
      });
      form.setFieldValue('name', editDocumentRetrieverDetail?.name);
      const selectedFgData = fgRows.find((row) => row?.latestFeatureGroupVersion?.featureGroupVersion === editDocumentRetrieverDetail?.latestDocumentRetrieverVersion?.featureGroupVersion);
      form.setFieldValue('featureGroup', {
        label: selectedFgData.tableName,
        value: selectedFgData.featureGroupId,
      });
    });

    () => {
      if (isEdit) {
        const navParams = navParamsImmutable.set('documentRetrieverName', undefined);
        StoreActions.setNavParams_(navParams.toJS());
      }
    };
  }, [projectId, documentRetrieverId, navParamsImmutable, isEdit]);

  const handleSubmit = (values) => {
    setIsProcessing(true);
    const documentRetrieverConfig = {
      chunk_size: values.chunkSize,
      chunk_overlap_fraction: values.chunkOverlapFraction,
      text_encoder: values.textEncoder?.value,
    };
    if (!isEdit) {
      REClient_.promisesV2()
        .createDocumentRetriever(projectId, values.name, values.featureGroup.value, documentRetrieverConfig)
        .then((res) => {
          Location.push(['', PartsLink.document_retriever_detail, projectId, res?.result?.documentRetrieverId].join('/'));
        })
        .finally(() => {
          setIsProcessing(false);
        });
    } else {
      REClient_.promisesV2()
        .updateDocumentRetriever(documentRetrieverId, values.name, values.featureGroup.value, documentRetrieverConfig)
        .then(() => {
          Location.push(['', PartsLink.document_retriever_detail, projectId, documentRetrieverId].join('/'));
        })
        .finally(() => {
          setIsProcessing(false);
        });
    }
  };

  return (
    <div
      style={{
        margin: '30px auto',
        maxWidth: '80%',
        width: '1200px',
        color: Utils.colorA(1),
      }}
    >
      <Card
        style={{
          boxShadow: '0 0 4px rgba(0,0,0,0.2)',
          border: '1px solid ' + Utils.colorA(0.5),
          backgroundColor: Utils.colorA(0.04),
          borderRadius: '5px',
        }}
        className={sd.grayPanel}
      >
        <Spin spinning={false} size={'large'}>
          <Form layout="vertical" form={form} onFinish={handleSubmit}>
            <div
              css={`
                margin: 5px 0 20px;
                font-size: 20px;
                color: white;
              `}
            >
              <div
                css={`
                  margin-bottom: 24px;
                  text-align: center;
                `}
              >
                {isEdit ? 'Edit Document Retriever' : 'Create New Document Retriever'}
              </div>

              <Form.Item
                name="name"
                rules={[{ required: true, message: 'Required!' }]}
                label={
                  <span style={{ color: Utils.isDark() ? 'white' : 'black' }}>
                    Name
                    <HelpIcon id={'create_document_retriever_name'} style={{ marginLeft: '4px' }} />
                  </span>
                }
              >
                <Input autoComplete={'off'} placeholder={''} />
              </Form.Item>

              <Form.Item
                name="featureGroup"
                rules={[{ required: true, message: 'Required!' }]}
                label={
                  <span style={{ color: Utils.isDark() ? 'white' : 'black' }}>
                    Feature Group
                    <HelpIcon id={'create_document_retriever_feature_group'} style={{ marginLeft: '4px' }} />
                  </span>
                }
              >
                <SelectExt options={fgSelectOptions} />
              </Form.Item>

              <Form.Item
                name="chunkSize"
                rules={[{ required: false, message: 'Required!' }]}
                label={
                  <span style={{ color: Utils.isDark() ? 'white' : 'black' }}>
                    Chunk Size
                    <HelpIcon id={'create_document_retriever_chunk_size'} style={{ marginLeft: '4px' }} />
                  </span>
                }
              >
                <InputNumber autoComplete={'off'} />
              </Form.Item>

              <Form.Item
                name="chunkOverlapFraction"
                rules={[{ required: false, message: 'Required!' }]}
                label={
                  <span style={{ color: Utils.isDark() ? 'white' : 'black' }}>
                    Chunk Overlap Fraction
                    <HelpIcon id={'create_document_retriever_overlap'} style={{ marginLeft: '4px' }} />
                  </span>
                }
              >
                <InputNumber autoComplete={'off'} />
              </Form.Item>

              <Form.Item
                name="textEncoder"
                rules={[{ required: false, message: 'Required!' }]}
                label={
                  <span style={{ color: Utils.isDark() ? 'white' : 'black' }}>
                    Text Encoder
                    <HelpIcon id={'create_document_retriever_text_encoder'} style={{ marginLeft: '4px' }} />
                  </span>
                }
              >
                <SelectExt options={textEncoderOptions} />
              </Form.Item>
            </div>

            <div style={{ textAlign: 'center' }}>
              <Button type="primary" htmlType="submit" style={{ marginTop: '16px' }} disabled={isProcessing}>
                {isEdit ? 'Save' : 'Create'}
              </Button>
            </div>
          </Form>
        </Spin>
      </Card>
    </div>
  );
});
