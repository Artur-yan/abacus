import { IDocStoreHelper } from './DocStoreInterfaces';

const _ = require('lodash');
const cookies = require('browser-cookies');
const Batch = require('batch');

export class DocStoreHelper implements IDocStoreHelper {
  projectOne: any;

  constructor(projectOne?) {
    this.projectOne = projectOne;
  }
}

let staticDocStore = null;

interface IREDocStore {}

class REDocStore implements IREDocStore {
  static client_: () => IREDocStore = () => {
    if (!staticDocStore) {
      staticDocStore = new REDocStore();
    }
    return staticDocStore;
  };
}

export default REDocStore;
