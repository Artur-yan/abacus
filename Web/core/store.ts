import { configureStore } from '@reduxjs/toolkit';
import rootReducer from '../src/stores/reducers';

const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      immutableCheck: false,
      serializableCheck: false,
    }),
});

export type AppDispatch = typeof store.dispatch;
/**
 * Refer: https://github.com/reduxjs/redux/issues/4267 and https://redux.js.org/usage/usage-with-typescript#define-typed-hooks
 */
export type RootState = ReturnType<typeof rootReducer>;

export default store;
