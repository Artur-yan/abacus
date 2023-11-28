import React, { useEffect, useState } from 'react';

import Location from '../../../core/Location';

import REClient_ from '../../api/REClient';

import PartsLink from '../NavLeft/PartsLink';
import SelectExt from '../SelectExt/SelectExt';

export function DocumentRetrieverSelector(props: { projectId: string; currentDocumentRetrieverId?: string; onChange: (documentRetrieverId: string) => void }) {
  const [documentRetrieverRowData, setDocumentRetrieverRowData] = useState([]);

  useEffect(() => {
    REClient_.promisesV2()
      .listDocumentRetrievers(props.projectId)
      .then((res) => {
        setDocumentRetrieverRowData(
          res?.result.map((row) => ({
            label: row.name,
            value: row.vectorStoreId,
          })),
        );

        if (!props.currentDocumentRetrieverId) {
          Location.push(['', PartsLink.document_retriever_detail, props.projectId, res?.result?.[0]?.vectorStoreId].join('/'));
        }
      });
  }, []);

  return (
    <span
      style={{
        verticalAlign: 'top',
        paddingTop: '2px',
        marginLeft: '16px',
        width: '440px',
        display: 'inline-block',
        fontSize: '12px',
      }}
    >
      <SelectExt
        value={documentRetrieverRowData.find((row) => row.value === props.currentDocumentRetrieverId)}
        options={documentRetrieverRowData}
        onChange={(option) => props.onChange(option.value)}
        isSearchable={true}
        menuPortalTarget={document.getElementById('body2')}
      />
    </span>
  );
}
