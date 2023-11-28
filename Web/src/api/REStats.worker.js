import dl from 'datalib';
import _ from 'lodash';
import Utils from '../../core/Utils';

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

let processProjectsFilterListText_ = function (dataList, filterText, cbId) {
  if (dataList && filterText) {
    dataList = dataList.filter((d1) => {
      let str1 = d1.strFilter;
      let skipThisOne = false;
      if (str1 !== '') {
        skipThisOne = !Utils.searchIsTextInside(str1, filterText);
      } else {
        skipThisOne = true;
      }

      if (!skipThisOne) {
        return true;
      } else {
        return false;
      }
    });
  }

  doCallback(cbId, { dataList });
};

let processDataList_ = function (dataList, columns, cbId) {
  let types = dl.type.inferAll(dataList);

  let cc = columns;
  if (cc != null) {
    cc = [...cc];
    cc = cc.map((c1) => {
      c1.type = types[c1.name];
      return c1;
    });
  }

  let kk = Object.keys(types);
  dataList =
    !kk || !dataList
      ? null
      : dataList?.map((d1) => {
          kk?.some((k1) => {
            let type1 = types[k1];
            let v1 = d1[k1];
            if (v1 == null) {
              return false;
            }
            if (_.isNaN(v1)) {
              d1[k1] = null;
              return false;
            }

            if (type1 === 'date') {
              return false;
            } else if (type1 === 'integer') {
              if (!_.isNumber(v1)) {
                v1 = tryParseInt(v1);
              }
            } else if (type1 === 'number') {
              if (!_.isNumber(v1)) {
                v1 = tryParseFloat(v1);
              }
            } else if (type1 === 'string') {
              if (!_.isString(v1)) {
                v1 = '' + v1;
              }
            } else {
              return false;
            }

            if (_.isNaN(v1)) {
              v1 = null;
            }

            d1[k1] = v1;
          });
          return d1;
        });

  let summary = dataList ? dl.summary(dataList) : null;
  if (summary) {
    summary.some((s1) => {
      let uu = s1.unique;

      let uniqueForChart = [];
      let kk = Object.keys(uu);
      if (kk.length === 0) {
        s1.uniqueForChart = [];
        return false;
      }

      kk.sort((a, b) => {
        try {
          return uu[b] - uu[a];
        } catch (e) {
          return 0;
        }
      });

      let groupCount = Math.ceil(kk.length / 40);
      let i = 0;
      while (i < kk.length) {
        let tot = 0,
          count = 0;
        for (let j = 0; j < groupCount && i < kk.length; j++) {
          count++;
          tot += uu[kk[i]];
          i++;
        }
        let v1 = count === 0 ? 0 : tot / count;
        uniqueForChart.push(v1);
      }
      s1.uniqueForChart = uniqueForChart;
    });
  }

  doCallback(cbId, { summary, columns: cc, dataList, isOk: true });
};

let processDataListTry_ = function (dataList, columns, cbId) {
  try {
    processDataList_(dataList, columns, cbId);
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
      case 'dl_dataList':
        processDataListTry_(evt.dataList, evt.columns, evt.cbId);
        break;

      case 'filter_projectsList_dataList':
        processProjectsFilterListText_(evt.dataList, evt.filterText, evt.cbId);
        break;
    }
  }
});
