export const changeMode = (notebook, mode: string) => {
  notebook.mode = mode;
  notebook.modeChanged.emit(mode);
};
