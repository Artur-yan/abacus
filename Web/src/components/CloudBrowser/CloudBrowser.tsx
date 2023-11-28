import FileManager, { Permissions } from 'devextreme-react/file-manager';
import CustomFileSystemProvider from 'devextreme/file_management/custom_provider';
import * as _ from 'lodash';
import * as React from 'react';
import { PropsWithChildren, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import Utils from '../../../core/Utils';
import REClient_ from '../../api/REClient';
import SelectExt from '../SelectExt/SelectExt';
const s = require('./CloudBrowser.module.css');
const sd = require('../antdUseDark.module.css');

interface ICloudBrowserProps {
  height?: any;
  onSelect?: (path: string) => void;
  filterPrefix?: string;
  defaultValue?: string;
}

const CloudBrowser = React.memo((props: PropsWithChildren<ICloudBrowserProps>) => {
  // const { paramsProp, authUser, } = useSelector((state: any) => ({
  //   paramsProp: state.paramsProp,
  //   authUser: state.authUser,
  // }));

  const [ignored, forceUpdate] = useReducer((x) => x + 1, 0);
  const [listBuckets, setListBuckets] = useState(null);
  const [bucketSel, setBucketSel] = useState(null);
  const refFileManager = useRef<FileManager>(null);
  const [currentPath, setCurrentPath] = useState(null);
  const refGotoPath = useRef(null);

  useEffect(() => {
    REClient_.client_().listExternalBuckets((errL, resL) => {
      if (!errL && resL?.result) {
        setListBuckets(resL?.result);
      } else {
        setListBuckets([]);
      }
    });
  }, []);

  const optionsBuckets = useMemo(() => {
    let res =
      listBuckets
        ?.filter((b1) => b1?.verified)
        ?.map((b1, b1ind) => {
          return {
            label: b1.bucket,
            value: b1.bucket,
          };
        }) ?? [];

    if (props.filterPrefix) {
      res = res?.filter((b1) => _.startsWith(b1.value, props.filterPrefix));
    }

    res = res?.sort((a, b) => {
      return (a?.value || '').toLowerCase().localeCompare((b?.value || '').toLowerCase());
    });

    return res;
  }, [listBuckets, props.filterPrefix]);

  useEffect(() => {
    setCurrentPath(null);
    refGotoPath.current = null;

    if (props.defaultValue) {
      let s1 = props.defaultValue;
      let sch1 = s1.split('://')?.[0];
      if (sch1) {
        let s2 = s1.substring(sch1.length + 3);
        let ss = s2.split('/');

        let s3 = ss?.[0];
        if (s3) {
          let s4 = s2.substring(s3.length + 1);

          s3 = sch1 + '://' + s3;

          let find1 = optionsBuckets?.find((b1) => b1.value === s3);
          if (find1 != null) {
            setBucketSel(s3);

            let p1 = s4?.lastIndexOf('/');
            if (p1 > -1) {
              s4 = s4.substring(0, p1);
            }

            refGotoPath.current = s4;
          }
        }
      }
    }
  }, [props.defaultValue, optionsBuckets]);

  const optionsBucketSel = optionsBuckets?.find((b1) => b1.value === bucketSel);

  const fileSystemProvider = useMemo(() => {
    return new CustomFileSystemProvider({
      getItems: (parentDirectory) => {
        return new Promise((resolve) => {
          setBucketSel((bucket1) => {
            let parentPath = parentDirectory?.path;
            REClient_.client_()._listFileConnectorFiles(bucket1, Utils.isNullOrEmpty(parentPath) ? '' : parentPath + '/', 3000, null, true, (err, res) => {
              if (err || !res?.success) {
                resolve([]);
              } else {
                let ff = res?.result?.files
                  ?.map((f1) => {
                    let isFolder = f1?.folder === true;

                    let n1 = f1?.key;
                    if (!Utils.isNullOrEmpty(parentPath) && _.startsWith(n1, parentPath)) {
                      n1 = n1.substring(parentPath.length + 1);
                    }
                    if (isFolder) {
                      if (_.endsWith(n1, '/')) {
                        n1 = n1.substring(0, n1.length - 1);
                      }
                    }

                    if (n1 == null || n1.length === 0) {
                      return null;
                    }

                    return {
                      isDirectory: isFolder,
                      name: n1,
                      size: f1?.size,
                      hasSubDirectories: isFolder,
                      dateModified: f1?.lastModified,
                    };
                  })
                  ?.filter((v1) => v1 != null);

                if (refGotoPath.current != null) {
                  let p1 = refGotoPath.current;
                  refGotoPath.current = null;

                  setTimeout(() => {
                    setCurrentPath(p1);
                  }, 0);
                }

                resolve(ff ?? []);
              }
            });

            return bucket1;
          });
        });
      },
    });
  }, []);

  const onChangeBucketSelect = (option1) => {
    props.onSelect?.(option1?.value);
    setBucketSel(option1?.value);
  };

  useEffect(() => {
    refFileManager.current?.instance.refresh();
  }, [bucketSel]);

  const onSelectionChanged = (e) => {
    let ss = refFileManager.current?.instance.getSelectedItems();

    setBucketSel((b1) => {
      let s1 = ss?.[0];

      props.onSelect?.(s1?.path == null || b1 == null ? null : b1 + '/' + s1?.path);

      return b1;
    });
  };

  const onCurrentDirectoryChanged = (e) => {
    setBucketSel((b1) => {
      const endPointPath = e?.directory?.path;

      if (endPointPath == null || b1 == null) {
        props.onSelect?.(null);
      } else {
        props.onSelect?.(b1 + '/' + endPointPath);
      }

      return b1;
    });
    setCurrentPath(e?.directory?.path);
  };

  return (
    <div css={``}>
      <div
        css={`
          margin: 10px 0;
          display: flex;
          align-items: center;
          justify-content: center;
        `}
      >
        <span>Bucket:</span>
        <span
          css={`
            width: 300px;
            margin-left: 5px;
          `}
        >
          <SelectExt value={optionsBucketSel} options={optionsBuckets} onChange={onChangeBucketSelect} />
        </span>
      </div>
      {/*// @ts-ignore*/}
      <FileManager
        currentPath={currentPath}
        onCurrentDirectoryChanged={onCurrentDirectoryChanged}
        height={props.height}
        selectionMode={'single'}
        fileSystemProvider={fileSystemProvider}
        ref={refFileManager}
        onSelectionChanged={onSelectionChanged}
      >
        {/*// @ts-ignore*/}
        <Permissions create={false} copy={false} move={false} delete={false} rename={false} upload={false} download={false}></Permissions>
      </FileManager>
    </div>
  );
});

export default CloudBrowser;
