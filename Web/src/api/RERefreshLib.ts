import RERefreshLib from './RERefreshLib.worker';
const _ = require('lodash');
const uuid = require('uuid');

let RERefreshLib_ = function () {};

let rerefreshlib_ = null;
// @ts-ignore
RERefreshLib_.instance_ = function () {
  if (!rerefreshlib_) {
    rerefreshlib_ = new RERefreshLib_();
    rerefreshlib_.init();
  }
  return rerefreshlib_;
};

RERefreshLib_.prototype.whenReadySend_ = [];
RERefreshLib_.prototype.callbacks = {};
RERefreshLib_.prototype.webworker_ = null;

RERefreshLib_.prototype.isInit = function () {
  return this.webworker_ != null;
};
RERefreshLib_.prototype.init = function () {
  if (this.webworker_) {
    return;
  }

  this.webworker_ = new RERefreshLib();
  this.webworker_.onmessage = (evt) => {
    // console.log(evt);

    let oldEvt = evt;
    if (evt.data) {
      evt = evt.data;
    }

    if (evt && evt.cmd) {
      switch (evt.cmd) {
        case 'msg':
          // eslint-disable-next-line no-console
          console.log('RE Console:' + evt.message);
          break;

        case 'callback':
          this.useCallback(evt.cbId, evt.result);
          break;
      }
    }
  };
  this.webworker_.onerror = (err) => {
    // eslint-disable-next-line no-console
    console.log('err::');
    // eslint-disable-next-line no-console
    console.log(err);
    // worker.port.close();
  };

  // eslint-disable-next-line no-restricted-syntax
  for (let i in this.whenReadySend_) {
    this.webworker_.postMessage(this.whenReadySend_[i]);
  }
  this.whenReadySend_ = [];

  //
  // this.webworker_.start();
};

RERefreshLib_.prototype.close = function () {
  if (this.webworker_) {
    this.webworker_.terminate();
    this.webworker_ = null;
  }
};

RERefreshLib_.prototype.prepareCallback = function (cbFinish) {
  let id = uuid.v1();
  this.callbacks[id] = cbFinish;
  return id;
};

RERefreshLib_.prototype.useCallback = function (cbId, res) {
  let cb = this.callbacks[cbId];
  if (cb) {
    delete this.callbacks[cbId];
    cb(res);
  }
};

RERefreshLib_.prototype.onReady = function (msg) {
  if (this.webworker_) {
    this.webworker_.postMessage(msg);
  } else {
    this.whenReadySend_.push(msg);
  }
};

RERefreshLib_.prototype.processUpdatesProjectList_ = function (projectList, newProjectList, cbFinish) {
  this.onReady({
    cmd: 'updates_project_list',
    projectList,
    newProjectList,
    cbId: this.prepareCallback(cbFinish),
  });
};

RERefreshLib_.prototype.processUpdatesDatasetList_ = function (datasetsList, newDatasetsList, cbFinish) {
  this.onReady({
    cmd: 'updates_dataset_list',
    datasetsList,
    newDatasetsList,
    cbId: this.prepareCallback(cbFinish),
  });
};

export default RERefreshLib_;
