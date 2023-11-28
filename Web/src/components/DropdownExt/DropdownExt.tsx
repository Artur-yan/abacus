import Dropdown from 'antd/lib/dropdown';
import { DropdownProps } from 'antd/lib/dropdown/dropdown';
import * as React from 'react';
import { PropsWithChildren } from 'react';
const s = require('./DropdownExt.module.css');
const sd = require('../antdUseDark.module.css');

interface IDropdownExtProps {}

const DropdownExt = React.memo((props: PropsWithChildren<DropdownProps>) => {
  return <Dropdown {...props} />;
});

export default DropdownExt;
