import REStats from './REStats.worker';
const _ = require('lodash');
const uuid = require('uuid');

let REStats_ = function () {};

let restats_ = null;
// @ts-ignore
REStats_.instance_ = function () {
  if (!restats_) {
    restats_ = new REStats_();
    restats_.init();
  }
  return restats_;
};

REStats_.prototype.whenReadySend_ = [];
REStats_.prototype.callbacks = {};
REStats_.prototype.webworker_ = null;
REStats_.prototype.init = function () {
  if (this.webworker_) {
    return;
  }

  this.webworker_ = new REStats();
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

REStats_.prototype.close = function () {
  if (this.webworker_) {
    this.webworker_.terminate();
    this.webworker_ = null;
  }
};

REStats_.prototype.prepareCallback = function (cbFinish) {
  let id = uuid.v1();
  this.callbacks[id] = cbFinish;
  return id;
};

REStats_.prototype.useCallback = function (cbId, res) {
  let cb = this.callbacks[cbId];
  if (cb) {
    delete this.callbacks[cbId];
    cb(res);
  }
};

REStats_.prototype.onReady = function (msg) {
  if (this.webworker_) {
    this.webworker_.postMessage(msg);
  } else {
    this.whenReadySend_.push(msg);
  }
};

REStats_.prototype.processDataList_ = function (dataList, columns, cbFinish) {
  this.onReady({
    cmd: 'dl_dataList',
    dataList,
    columns,
    cbId: this.prepareCallback(cbFinish),
  });
};

REStats_.prototype.filter_projectsList_dataList_ = function (dataList, filterText, cbFinish) {
  this.onReady({
    cmd: 'filter_projectsList_dataList',
    dataList,
    filterText,
    cbId: this.prepareCallback(cbFinish),
  });
};

export default REStats_;
