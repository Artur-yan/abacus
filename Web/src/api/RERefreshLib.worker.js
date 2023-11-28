import _ from 'lodash';

// eslint-disable-next-line no-console
var conso = console.log;

let tryParseInt = (value, defaultValue = null) => {
  try {
    // eslint-disable-next-line radix
    return parseInt(value);
  } catch (ex) {
    return defaultValue;
  }
};

let tryParseFloat = (value, defaultValue = null) => {
  try {
    let res = parseFloat(value);
    if (isNaN(res) && value !== 'NaN') {
      return defaultValue;
    } else {
      return res;
    }
  } catch (ex) {
    return defaultValue;
  }
};

let doCallback = (cbId, res) => {
  if (cbId) {
    self.postMessage({
      cmd: 'callback',
      cbId: cbId,
      result: res,
    });
  }
};

let processUpdateDatasetList_ = function (datasetsList, newDatasetsList, cbId) {
  try {
    let updates = [];

    let alreadyDatasets = {};
    datasetsList?.some((d1) => {
      alreadyDatasets[d1?.dataset?.datasetId] = d1;
    });

    newDatasetsList?.some((d2) => {
      let dOri = d2;

      d2 = d2.lastVersion;
      if (d2 && d2.sourceType == null) {
        d2.sourceType = dOri.sourceType;
      }

      let d1 = alreadyDatasets[d2?.dataset?.datasetId];
      if (d1 == null) {
        updates.push(d2);
      } else {
        if (!_.isEqual(d1, d2)) {
          updates.push(d2);
        }
      }
    });

    doCallback(cbId, { isOk: true, updates });
  } catch (e) {
    doCallback(cbId, { isOk: false });
  }
};

let processUpdateProjectList_ = function (projectList, newProjectList, cbId) {
  try {
    let updates = [];

    let alreadyProjects = {};
    projectList?.some((p1) => {
      alreadyProjects[p1.projectId] = p1;
    });

    newProjectList?.some((p2) => {
      let p1 = alreadyProjects[p2.projectId];
      if (p1 == null) {
        updates.push(p2);
      } else {
        if (!_.isEqual(p1, p2)) {
          updates.push(p2);
        }
      }
    });

    doCallback(cbId, { isOk: true, updates });
  } catch (e) {
    doCallback(cbId, { isOk: false });
  }
};

conso = (msg) => {
  self.postMessage({
    cmd: 'msg',
    message: msg,
  });
};
// eslint-disable-next-line no-console
console.log = conso;
// eslint-disable-next-line no-console
console.error = conso;

self.addEventListener('message', function (evt) {
  let oldEvt = evt;
  if (evt.data) {
    evt = evt.data;
  }

  if (evt && evt.cmd) {
    switch (evt.cmd) {
      case 'updates_project_list':
        processUpdateProjectList_(evt.projectList, evt.newProjectList, evt.cbId);
        break;

      case 'updates_dataset_list':
        processUpdateDatasetList_(evt.datasetsList, evt.newDatasetsList, evt.cbId);
        break;
    }
  }
});
