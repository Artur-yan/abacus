import _ from 'lodash';
import Utils from '../../../core/Utils';

export const intRowIndex = '_____####_____intRowIndex';

export const isEqualAllSmart = (data1, data2) => {
  if (!_.isObject(data1)) {
    if (_.isObject(data2)) {
      return false;
    } else {
      return data1 === data2;
    }
  }

  const kk1 = Object.keys(data1)
    .sort()
    .filter((v1) => v1 !== intRowIndex);
  const kk2 = Object.keys(data2)
    .sort()
    .filter((v1) => v1 !== intRowIndex);
  if (kk1.length !== kk2.length) {
    return false;
  }

  let kk = kk1; //columnsDisplay.map(c1 => c1.key);
  if ('id' in kk) {
    // @ts-ignore
    kk.unshift('id');
  }
  if ('Id' in kk) {
    // @ts-ignore
    kk.unshift('Id');
  }
  if ('ID' in kk) {
    // @ts-ignore
    kk.unshift('ID');
  }

  let res = true;
  kk.some((k1) => {
    if (!Utils.isNullOrEmpty(data1[k1]) || !Utils.isNullOrEmpty(data2[k1])) {
      const v1 = data1[k1];
      const v2 = data2[k1];
      if (_.isArray(v1)) {
        if (_.isArray(v2)) {
          if (v1.length !== v2.length) {
            res = false;
            return true;
          } else {
            v1.some((a, ind) => {
              if (!isEqualAllSmart(v1[ind], v2[ind])) {
                res = false;
                return true;
              }
            });
            if (!res) {
              return true;
            }
          }
        } else {
          res = false;
          return true;
        }
      } else {
        res = v1 === v2;
      }

      if (!res) {
        return true;
      }
    }
  });

  return res;
};
