import md5 from 'js-md5';
import * as uuid from 'uuid';
import Utils from '../../core/Utils';
import REActions from '../actions/REActions';
import StoreActions from '../stores/actions/StoreActions';
import { calcDatasetById } from '../stores/reducers/datasets';
import REClient_ from './REClient';

const _ = require('lodash');
const cookies = require('browser-cookies');
const Batch = require('batch');

let staticClientUpload = null;

interface IREUploads_ {
  doUploadNew: (
    docStoreIsDocument: boolean,
    batchPredId: string,
    oriDatasetId: string,
    isDatasetUpload: boolean,
    uploadId: string,
    newVersionDatasetId: string,
    name: string,
    projectIdToAttach: string,
    datasetType: string,
    file1: any,
    locationS3: string,
    refreshSchedule: string,
    databaseConnectorId: string,
    objectName: string,
    columns: string,
    queryArguments: string,
    tableName: string,
    sqlQuery: string,
    csvDelimiter: string,
    filenameColumn: string,
    startPrefix,
    untilPrefix,
    locationDateFormat,
    dateFormatLookbackDays,
    incremental,
    incrementalTimestampColumn,
    mergeFileSchemas,
    extractBoundingBoxes: boolean,
    cbDatasetId: (datasetId?: string) => void,
    cbProgressDoUpload: (actual: number, total: number) => void,
    cbPreProcess: (err, res) => void,
    cbFinish: (err, res) => void,
  ) => void;

  doUpload: (isDatasetUpload: boolean, useDatasetId: string, useUploadId: any, contentType: string, fileOne: Blob, cbProgressDoUpload: (actual: number, total: number) => void, cbFinish: (err: any, res: any) => void) => void;
  uploadFilePart: (isDatasetUpload, objActual: { actualBytes: number; totalBytes: number }, datasetUploadId: any, partNumber: number, partData: any, cbFinish: (err: any, res: any) => void) => void;

  checkCanDatasetId: (datasetId?: string) => boolean;
  addFile: (name?: string) => IFileUpload;
  getFilesList: () => IFileUpload[];
  getFileById: (id: string) => IFileUpload;
  getFileByDatasetId: (id: string) => IFileUpload;
  removeFileById: (id: string, doAction?: boolean) => void;
  removeFileByDatasetId: (datasetId: string, doAction?: boolean) => void;
  updatedFile: (thisFile: IFileUpload) => null | IFileUpload;
  doAction: (id?: string) => void;
  forceUpdate: () => void;
}

export interface IFileUpload {
  id?: string;
  uploadId?: string;
  name?: string;
  actual?: number;
  total?: number;
  error?: string;
  isProcessing?: boolean;
  uploaded?: boolean;

  projectId?: string;
  datasetId?: string;
  datasetVersion?: string;

  isDatasetUpload?: boolean;
}

class REUploads_ implements IREUploads_ {
  private listFiles: IFileUpload[] = [];
  private dictFiles: { [key: string]: IFileUpload } = {};
  private dontShowForDatasetIds: string[] = [];
  private cancelledIds: string[] = [];

  static client_: () => IREUploads_ = () => {
    if (!staticClientUpload) {
      staticClientUpload = new REUploads_();
    }
    return staticClientUpload;
  };

  getFilesList = () => {
    return this.listFiles;
  };

  getFileByDatasetId = (datasetId: string) => {
    if (!datasetId) {
      return null;
    }
    return this.listFiles?.find((f1) => f1?.datasetId === datasetId);
  };

  getFileById = (id: string) => {
    return this.dictFiles[id];
  };

  forceUpdate = () => {
    this.dictFiles = { ...this.dictFiles };

    this.listFiles = this.listFiles.map((f1) => {
      f1 = { ...f1 };
      this.dictFiles[f1.id] = f1;
      return f1;
    });

    this.doAction();
  };

  removeFileById = (id: string, doAction = true) => {
    if (id == null || id === '') {
      return;
    }

    this.cancelledIds.push(this.dictFiles[id]?.uploadId ?? '-');

    delete this.dictFiles[id];
    this.listFiles = this.listFiles.filter((f1) => f1.id !== id);

    if (doAction) {
      REActions.uploadsRefresh(id);
    }
  };

  removeFileByDatasetId = (datasetId: string, doAction = true) => {
    if (datasetId == null || datasetId === '') {
      return;
    }

    this.dontShowForDatasetIds.push(datasetId);
    setTimeout(() => {
      this.dontShowForDatasetIds = this.dontShowForDatasetIds.filter((s1) => s1 !== datasetId);
    }, 2000);

    let fileFound1 = this.listFiles.find((f1) => f1.datasetId === datasetId);
    if (!fileFound1) {
      return;
    }

    this.cancelledIds.push(fileFound1.uploadId || '-');

    delete this.dictFiles[fileFound1.id];
    this.dictFiles = { ...this.dictFiles };

    this.listFiles = this.listFiles.filter((f1) => f1.id !== fileFound1.id);

    if (doAction) {
      REActions.uploadsRefresh(fileFound1.id);
    }
  };

  doAction = (id?: string) => {
    REActions.uploadsRefresh(id);
  };

  updatedFile = (thisFile: IFileUpload) => {
    if (thisFile == null) {
      return null;
    }

    let ind = _.findIndex(this.listFiles, (f1) => f1.id === thisFile.id);

    thisFile = { ...thisFile };

    if (ind > -1) {
      this.listFiles[ind] = thisFile;
      this.listFiles = [...this.listFiles];
    }

    this.dictFiles[thisFile.id] = thisFile;
    this.dictFiles = { ...this.dictFiles };

    return thisFile;
  };

  addFile = (name) => {
    let uploadId = uuid.v1();
    let thisFile: IFileUpload = {
      id: uploadId,
      name: name,
    };

    let ff = [...this.listFiles];
    ff.push(thisFile);
    this.listFiles = ff;

    this.dictFiles[uploadId] = thisFile;
    REActions.uploadsRefresh(uploadId);

    return thisFile;
  };

  checkCanDatasetId = (datasetId?: string) => {
    if (!datasetId) {
      return true;
    }

    return !this.dontShowForDatasetIds.includes(datasetId);
  };

  doUploadNew = (
    docStoreIsDocument: boolean,
    batchPredId: string,
    oriDatasetId: string,
    isDatasetUpload: boolean,
    customUploadId: string,
    newVersionDatasetId: string,
    name: string,
    projectIdToAttach: string,
    datasetType: string,
    file1: any,
    locationS3: string,
    refreshSchedule: string,
    databaseConnectorId: string,
    objectName: string,
    columns: string,
    queryArguments: string,
    tableName: string,
    sqlQuery: string,
    csvDelimiter: string,
    filenameColumn: string,
    startPrefix,
    untilPrefix,
    locationDateFormat,
    dateFormatLookbackDays,
    incremental,
    incrementalTimestampColumn,
    mergeFileSchemas,
    extractBoundingBoxes: boolean,
    cbDatasetId: (datasetId?: string) => void,
    cbProgressDoUpload: (actual: number, total: number) => void,
    cbPreProcess: (err, res) => void,
    cbFinish: (err, res) => void,
  ) => {
    if (file1 != null && file1.originFileObj != null) {
      file1 = file1.originFileObj;
    }

    let thisFile = file1 ? this.addFile(file1 ? file1.name : name) : null;
    if (thisFile) {
      thisFile.projectId = projectIdToAttach;
      thisFile.isDatasetUpload = isDatasetUpload;
    }

    let location = null;
    let handleResponse = (errUpload, resUpload) => {
      let endDatasetId = resUpload?.success ? resUpload?.result?.datasetId : null;
      let endDatasetVersion = resUpload?.success ? resUpload?.result?.datasetVersion : null;
      if (!errUpload) {
        if (cbDatasetId) {
          cbDatasetId(endDatasetId);
        }

        if (thisFile && endDatasetId) {
          if (this.checkCanDatasetId(endDatasetId)) {
            thisFile = this.updatedFile(thisFile);
            thisFile.datasetId = endDatasetId;
            thisFile.datasetVersion = endDatasetVersion;
            REActions.uploadsRefresh(thisFile.id);
          } else {
            this.removeFileById(thisFile.id);
            return;
          }
        }

        let alreadyDatasetFound = false;

        let doWorkEndDataset = () => {
          setTimeout(() => {
            if (endDatasetId) {
              let datasetId = endDatasetId;
              if (!Utils.isNullOrEmpty(datasetId)) {
                StoreActions.refreshDatasetUntilState_(
                  datasetId,
                  undefined,
                  (currentStatus) => {
                    let ds1 = calcDatasetById(undefined, datasetId);
                    if (ds1) {
                      StoreActions.updateDatasetLifecyle_(datasetId, currentStatus);
                      setTimeout(() => {
                        REUploads_.client_().forceUpdate();
                      }, 0);
                    } else if (!alreadyDatasetFound) {
                      alreadyDatasetFound = true;

                      setTimeout(() => {
                        setTimeout(() => {
                          REUploads_.client_().forceUpdate();
                        }, 0);

                        StoreActions.getProjectsList_();
                        StoreActions.getProjectsById_(projectIdToAttach);
                        StoreActions.listDatasets_([datasetId], () => {
                          setTimeout(() => {
                            REUploads_.client_().forceUpdate();
                          }, 0);
                        });
                        StoreActions.getProjectDatasets_(projectIdToAttach);
                        StoreActions.validateProjectDatasets_(projectIdToAttach);
                      }, 500);
                    }
                  },
                  (isDone, lifecycle) => {
                    StoreActions.refreshDatasetUntilStateCancel_(datasetId);

                    if (isDone) {
                      setTimeout(() => {
                        REUploads_.client_().forceUpdate();
                      }, 0);

                      StoreActions.getProjectsList_();
                      StoreActions.listDatasets_([datasetId], () => {
                        setTimeout(() => {
                          REUploads_.client_().forceUpdate();
                        }, 0);
                      });
                      StoreActions.listDatasetsVersions_(datasetId);
                      StoreActions.getProjectsById_(projectIdToAttach);
                      StoreActions.getProjectDatasets_(projectIdToAttach, (res, ids) => {
                        ids?.some((id1) => {
                          StoreActions.schemaGetFileDataUse_(projectIdToAttach, id1);
                        });
                      });
                      StoreActions.validateProjectDatasets_(projectIdToAttach);

                      StoreActions.featureGroupsGetByProject_(projectIdToAttach, (list) => {
                        list?.some((f1) => {
                          StoreActions.featureGroupsDescribe_(projectIdToAttach, f1?.featureGroupId);
                        });
                      });
                    }
                  },
                );
              }
            }

            StoreActions.getProjectsList_();
            StoreActions.listDatasets_([endDatasetId], () => {
              setTimeout(() => {
                REUploads_.client_().forceUpdate();
              }, 0);
            });
            StoreActions.getProjectsById_(projectIdToAttach);
            StoreActions.getProjectDatasets_(projectIdToAttach);
            StoreActions.validateProjectDatasets_(projectIdToAttach);
          }, 0);
        };

        const doWorkUpload = () => {
          //
        };

        if (isDatasetUpload) {
          doWorkEndDataset();
        } else {
          doWorkUpload();
        }
      }
    };

    let handleEnd = (err, res) => {
      if (thisFile) {
        thisFile = this.updatedFile(thisFile);
        thisFile.uploaded = true;
      }

      if (handleResponse) {
        handleResponse(err, res);
      }

      cbFinish && cbFinish(err, res);
    };

    let handleInt = (errUpload, resUpload) => {
      if (thisFile) {
        thisFile.uploadId = resUpload?.result?.uploadId;
      }
      let endDatasetId = resUpload?.success ? resUpload?.result?.datasetId : null;
      let endDatasetVersion = resUpload?.success ? resUpload?.result?.datasetVersion : null;
      if (thisFile && endDatasetId) {
        if (this.checkCanDatasetId(endDatasetId)) {
          thisFile = this.updatedFile(thisFile);
          thisFile.datasetId = endDatasetId;
          thisFile.datasetVersion = endDatasetVersion;
          REActions.uploadsRefresh(thisFile.id);
        } else {
          this.removeFileById(thisFile.id);
          return;
        }
      }

      if (resUpload?.reFileCustom) {
        if (cbPreProcess) {
          cbPreProcess(errUpload, resUpload);
          if (errUpload || !resUpload.success) {
            if (thisFile) {
              thisFile = this.updatedFile(thisFile);
              thisFile.error = errUpload || 'Error Uploading';
              REActions.uploadsRefresh(thisFile.id);
            }
            // REActions.addNotificationError(errUpload || 'Error Uploading');
            return;
          }
        }

        if (isDatasetUpload) {
          StoreActions.getProjectsList_();
          StoreActions.getProjectsById_(projectIdToAttach);
          StoreActions.getProjectDatasets_(projectIdToAttach, (res, ids) => {
            StoreActions.listDatasets_(ids);
          });
          StoreActions.validateProjectDatasets_(projectIdToAttach);
        }

        //
        let cbProgressInt = (actual: number, total: number) => {
          if (thisFile) {
            thisFile = this.updatedFile(thisFile);
            thisFile.actual = actual;
            thisFile.total = total;
            REActions.uploadsRefresh(thisFile.id);
          }

          if (cbProgressDoUpload) {
            cbProgressDoUpload(actual, total);
          }
        };

        REUploads_.client_().doUpload(isDatasetUpload, thisFile?.datasetId, customUploadId ?? resUpload?.result?.datasetUploadId, resUpload?.reFileCustom?.contentType, resUpload?.reFileCustom?.fileOne, cbProgressInt, handleEnd);
      } else {
        if (cbPreProcess) {
          cbPreProcess(errUpload, resUpload);
          if (errUpload || !resUpload.success) {
            return;
          }
        }

        if (handleResponse) {
          handleResponse(errUpload, resUpload);
        }

        if (handleEnd) {
          handleEnd(null, endDatasetId ? { datasetId: endDatasetId } : null);
        }
      }
    };

    if (!isDatasetUpload) {
      let resAD = null;
      if (file1) {
        resAD = {};
        resAD.reFileCustom = {
          fileOne: file1,
          contentType: file1.type,
        };
      }
      handleInt(null, resAD);
    } else if (!file1) {
      location = locationS3;
      REClient_.client_().doImportDataset(
        docStoreIsDocument,
        name,
        null,
        location,
        batchPredId ? undefined : projectIdToAttach,
        datasetType,
        refreshSchedule,
        databaseConnectorId,
        objectName,
        columns,
        queryArguments,
        tableName,
        sqlQuery,
        csvDelimiter,
        filenameColumn,
        startPrefix,
        untilPrefix,
        locationDateFormat,
        dateFormatLookbackDays,
        incremental,
        incrementalTimestampColumn,
        mergeFileSchemas,
        extractBoundingBoxes,
        cbProgressDoUpload,
        handleInt,
      );
    } else {
      let fileFormat = null;
      let type = file1?.type || '';
      let fileName = file1?.name?.toLowerCase() || '';
      if (fileName.endsWith('.xls') || fileName.endsWith('.xlsx') || type == 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
        fileFormat = 'XLS';
      } else if (fileName.endsWith('.csv') || type == 'text/csv') {
        fileFormat = 'CSV';
      } else if (fileName.endsWith('.ods') || type == 'application/vnd.oasis.opendocument.spreadsheet') {
        fileFormat = 'ODS';
      } else if (fileName.endsWith('.json') || fileName.endsWith('.jsonl') || fileName.endsWith('.ndjson') || fileName.endsWith('.ldjson') || type == 'application/json') {
        fileFormat = 'JSON';
      } else if (fileName.endsWith('.tsv')) {
        fileFormat = 'TSV';
      } else if (fileName.endsWith('.orc')) {
        fileFormat = 'ORC';
      } else if (fileName.endsWith('.parquet')) {
        fileFormat = 'PARQUET';
      } else if (fileName.endsWith('.avro')) {
        fileFormat = 'AVRO';
      } else if (fileName.endsWith('.zip')) {
        fileFormat = 'ZIP';
      } else if (fileName.endsWith('.tar') || fileName.endsWith('.tgz') || fileName.endsWith('.tar.gz')) {
        fileFormat = 'TAR';
      }
      REClient_.client_().doAddDataset(
        docStoreIsDocument,
        newVersionDatasetId,
        name,
        file1 && file1.type,
        file1,
        batchPredId ? undefined : projectIdToAttach,
        datasetType,
        fileFormat,
        tableName,
        csvDelimiter,
        extractBoundingBoxes,
        handleInt,
      );
    }
  };

  doUpload = (isDatasetUpload: boolean, useDatasetId: string, useUploadId: any, contentType: string, fileOne: File, cbProgressDoUpload: (actual: number, total: number) => void, cbFinishDoUpload: (err: any, res: any) => void) => {
    let doWorkUpload = (datasetUploadId) => {
      let progressParts: { actualBytes: number; totalBytes: number; onUpdate: any }[] = [];

      let doUploadPart = (objActual: { actualBytes: number; totalBytes: number; onUpdate: any }, bufferPart, partInd, retry, cbFinish: (err: any, res: any) => void) => {
        if (useUploadId && this.cancelledIds.includes(useUploadId)) {
          return;
        }

        let blobPart = new Blob([bufferPart]);
        this.uploadFilePart(isDatasetUpload, objActual, datasetUploadId, partInd, blobPart, (errPart, resPart) => {
          let etagPart = null;

          //retry
          if (errPart) {
            if (retry > 0) {
              doUploadPart(objActual, bufferPart, partInd, retry - 1, cbFinish);
              return;
            }
          } else {
            etagPart = md5(bufferPart);
          }

          if (!errPart && etagPart && (resPart?.result?.etag || resPart?.result?.md5)) {
            let etagFromServer = resPart?.result?.md5 || resPart?.result?.etag;
            if (etagFromServer) {
              if (_.startsWith(etagFromServer, '"')) {
                etagFromServer = etagFromServer.substring(1);
              }
              if (_.endsWith(etagFromServer, '"')) {
                etagFromServer = etagFromServer.substring(0, etagFromServer.length - 1);
              }
            }
            if (etagFromServer !== etagPart) {
              errPart = "Error etag doesn't match";
              Utils.error("Error etag doesn't match buf:" + etagPart + ' api:' + resPart.result.etag);

              //retry
              if (retry > 0) {
                doUploadPart(objActual, bufferPart, partInd, retry - 1, cbFinish);
                return;
              }
            }
          }

          cbFinish(errPart, resPart);
        });
      };

      let doUploadPartsBuffers = (size, blobOne, chunkSize /*listBuffers, etagFull*/) => {
        let anyError = false;
        let totalCount = Math.ceil(size / chunkSize); //listBuffers.length;
        let workToDoList = [];

        let work1 = (done, objActual, index) => {
          if (useDatasetId && !REUploads_.client_().checkCanDatasetId(useDatasetId)) {
            cbFinishDoUpload('Error uploading file', null);
            done();
            return;
          }

          let buffer1 = blobOne.slice(index * chunkSize, Math.min(size, (index + 1) * chunkSize));
          let reader = new FileReader();
          reader.onload = (e) => {
            // @ts-ignore
            let blobPart = e.target.result;

            doUploadPart(objActual, blobPart, index + 1, 3, (errPart, resPart) => {
              totalCount--;

              if (errPart) {
                anyError = true;
              }

              if (totalCount <= 0) {
                //finished
                if (anyError) {
                  cbFinishDoUpload('Error uploading file', null);
                  done();
                } else {
                  let method1: any = REClient_.client_().completeUpload;
                  if (!isDatasetUpload) {
                    method1 = REClient_.client_().markUploadComplete;
                  }
                  method1(datasetUploadId, (errComplete, resComplete) => {
                    if (resComplete != null) {
                      resComplete['result'] = { datasetId: resComplete.result?.datasetId };
                    }
                    cbFinishDoUpload(errComplete, resComplete);
                    done();
                  });
                }
              } else {
                done();
              }
            });
          };
          // @ts-ignore
          reader.readAsArrayBuffer(buffer1);
        };

        new Array(totalCount).fill(null).some((t1, blogInd) => {
          let len1 = chunkSize;
          if (blogInd === totalCount - 1) {
            len1 = size - chunkSize * (totalCount - 1);
          }
          workToDoList.push({ bufferLen: len1 /*buffer1.length*/, index: blogInd });
        });

        let batch = new Batch();
        batch.concurrency(6);

        let progressUpdated = () => {
          if (!cbProgressDoUpload) {
            return;
          }

          let actual = 0,
            total = 0;
          progressParts.some((p1) => {
            actual += p1.actualBytes || 0;
            total += p1.totalBytes || 0;
          });

          cbProgressDoUpload(actual, total);
        };

        workToDoList.some(({ bufferLen, index }) => {
          let objActual = { actualBytes: 0, totalBytes: bufferLen, onUpdate: progressUpdated };
          progressParts.push(objActual);

          batch.push((done) => {
            work1(done, objActual, index);
          });
        });

        batch.on('progress', (e) => {
          //
        });

        batch.end((errBatch, resBatch) => {
          //
        });
      };

      const chunkSize = 22 * 1024 * 1024;
      doUploadPartsBuffers(fileOne.size, fileOne, chunkSize);
    };
    doWorkUpload(useUploadId);
  };

  uploadFilePart = (isDatasetUpload, objActual: { actualBytes: number; totalBytes: number; onUpdate: any }, datasetUploadId: any, partNumber: number, partData: any, cbFinish: (err: any, res: any) => void) => {
    let obj1: any = {
      datasetUploadId,
      partNumber,
      partData,
    };
    if (!isDatasetUpload) {
      obj1 = {
        uploadId: datasetUploadId,
        partNumber,
        partData,
      };
    }

    REClient_.client_().callApi_(
      isDatasetUpload ? 'uploadFilePart' : 'uploadPart',
      obj1,
      function (err, res) {
        cbFinish(err, res);
      },
      undefined,
      {
        successEqualTrue: true,
        progressUpload: (bytes, total) => {
          if (objActual) {
            objActual.actualBytes = bytes;
          }
          objActual && objActual.onUpdate && objActual.onUpdate();
        },
      },
    );
  };
}

export default REUploads_;
