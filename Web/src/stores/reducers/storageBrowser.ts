import * as Immutable from 'immutable';
import * as _ from 'lodash';
import Utils from '../../../core/Utils';
import { IStorageFileNode, IStorageFolderNode } from '../../components/StorageBrowser/StorageBrowser';
import StoreActions from '../actions/StoreActions';

let initState = Immutable.fromJS({
  neverUsed: true,
  isRefreshing: 0,
  nodes: null,
}) as Immutable.Map<string, any>;

const storageBrowser = (state = initState, action) => {
  if (action.payload == null) {
    action.payload = {};
  }

  switch (action.type) {
    case StoreActions.STORAGE_REFRESH_START:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) + 1);
      return state;

    case StoreActions.STORAGE_REFRESH_END:
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) - 1);
      return state;

    case StoreActions.STORAGE_LIST_START:
      state = state.set('neverUsed', false);
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) + 1);
      return state;

    case StoreActions.STORAGE_LIST_END:
      state = state.set('neverUsed', false);
      state = state.set('isRefreshing', (state.get('isRefreshing') ?? 0) - 1);

      if (action.payload.error) {
        Utils.error('List Browser ' + action.payload.error);
      }

      let folder1 = action.payload.folder || '/';
      folder1 = folder1.replace(/\/\//g, '/');

      let indexInside = ['nodes'] as any[];

      let ff = folder1.split('/').filter((f1) => _.trim(f1 || '') !== '');
      if (ff && ff.length > 0) {
        let folderNameFor = '/';
        ff.some((folderName1, ind, list) => {
          if (!folderName1 || folderName1 === '') {
            return false;
          }

          folderNameFor += folderName1 + '/';

          let subFolders = state.getIn([...indexInside, 'folders']) as any[];
          //
          let folderFound1Index = subFolders == null ? -1 : subFolders.findIndex((f1) => f1.get('name') === folderName1);
          if (folderFound1Index === -1) {
            state = state.updateIn([...indexInside, 'folders'], (folderState: any) => {
              let nodeAdd = Immutable.fromJS({ isFetched: false, name: folderName1, folders: [], files: [], folderName: folderNameFor } as IStorageFolderNode) as Immutable.Map<string, any>;
              folderState = folderState.insert(nodeAdd);

              return folderState;
            });

            subFolders = state.getIn([...indexInside, 'folders']) as any;
            folderFound1Index = subFolders.findIndex((n1) => n1.get('name') === folderName1);
          }
          //
          indexInside.push('folders');
          indexInside.push(folderFound1Index);

          return false;
        });
      }

      state = state.updateIn(indexInside, (folderState: Immutable.Map<string, any>) => {
        if (!folderState) {
          folderState = Immutable.fromJS({ isFetched: true, name: '', folders: [], files: [], folderName: '/' } as IStorageFolderNode) as Immutable.Map<string, any>;
        }

        folderState = folderState.set('isFetched', true);

        let result = action.payload.result;
        if (result) {
          let folders = result.folders;
          let files = result.files;

          let folderName = action.payload.folder;

          let listFolders = folders ? folders.map((f1) => ({ isFetched: false, isFolder: f1.isFolder, name: f1.name, folders: [], files: [], folderName: folderName } as IStorageFolderNode)) : [];
          let listFiles = files ? files.map((f1) => ({ isFolder: f1.isFolder, name: f1.name, size: f1.size, date: f1.date, folderName: folderName } as IStorageFileNode)) : [];

          folderState = folderState.set('folders', Immutable.fromJS(listFolders));
          folderState = folderState.set('files', Immutable.fromJS(listFiles));
        }

        return folderState;
      });
      return state;

    default:
      return state;
  }
};

export default storageBrowser;
