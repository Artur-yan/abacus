import Select, { SelectProps } from 'antd/lib/select';
import { BaseSelectRef } from 'rc-select';
import { BaseOptionType } from 'rc-select/lib/Select';
import * as React from 'react';
import { MouseEventHandler, useMemo, useReducer } from 'react';
import SelectR, { components, MultiValueGenericProps, MultiValueProps, OnChangeValue } from 'react-select';
import { default as Creatable, default as CreatableR } from 'react-select/creatable';
import { SortableContainer, SortableContainerProps, SortableElement, SortableHandle, SortEndHandler } from 'react-sortable-hoc';
import Utils from '../../../core/Utils';
const s = require('./SelectReactExt.module.css');
const sd = require('../antdUseDark.module.css');

interface ISelectReactExtProps {
  allowCreate?: boolean;
  allowReOrder?: boolean;
  onChange?: (values: any[]) => void;
}

interface OptionType extends BaseOptionType /*& DefaultOptionType*/ {}

type ValueType = any;

const SelectReactExt = React.memo(
  (
    props: SelectProps<ValueType, OptionType> & {
      children?: React.ReactNode;
    } & {
      ref?: React.Ref<BaseSelectRef> | undefined;
    } & ISelectReactExtProps,
  ) => {
    // const { paramsProp, authUser, } = useSelector((state: any) => ({
    //   paramsProp: state.paramsProp,
    //   authUser: state.authUser,
    // }));

    const [ignored, forceUpdate] = useReducer((x) => x + 1, 0);

    const propsUsed = useMemo(() => {
      let res = { ...(props ?? {}) } as any;

      delete res.allowReOrder;
      delete res.allowCreate;

      return res;
    }, [props]);

    function arrayMove<T>(array: readonly T[], from: number, to: number) {
      const slicedArray = array.slice();
      slicedArray.splice(to < 0 ? array.length + to : to, 0, slicedArray.splice(from, 1)[0]);
      return slicedArray;
    }

    const SortableMultiValue = SortableElement((props: MultiValueProps) => {
      // this prevents the menu from being opened/closed when the user clicks
      // on a value to begin dragging it. ideally, detecting a click (instead of
      // a drag) would still focus the control and toggle the menu, but that
      // requires some magic with refs that are out of scope for this example
      const onMouseDown: MouseEventHandler<HTMLDivElement> = (e) => {
        e.preventDefault();
        e.stopPropagation();
      };
      const innerProps = { ...props.innerProps, onMouseDown };
      return <components.MultiValue {...props} innerProps={innerProps} />;
    });

    const SortableMultiValueLabel = SortableHandle((props: MultiValueGenericProps) => {
      return <components.MultiValueLabel {...props} />;
    });

    const SortableSelect = SortableContainer(SelectR) as React.ComponentClass<SortableContainerProps>;
    const SortableCreatable = SortableContainer(CreatableR) as React.ComponentClass<SortableContainerProps>;

    function MultiSelectSort() {
      // const [selected, setSelected] = React.useState((props.value ?? []) as any[]);
      // const selected = props.value;

      const selected = useMemo(() => {
        return props.value
          ?.map((s1) => {
            let r1 = props.options?.find((o1) => o1.value === s1);
            if (r1 == null && !Utils.isNullOrEmpty(s1)) {
              r1 = { label: s1, value: s1 };
            }
            return r1;
          })
          ?.filter((v1) => v1 != null);
      }, [props.value, props.options]);

      const onChange = (selectedOptions: OnChangeValue<any, true>) => {
        // setSelected(selectedOptions as any);
        props.onChange?.(selectedOptions?.map((o1) => o1?.value));
      };

      const onSortEnd: SortEndHandler = ({ oldIndex, newIndex }) => {
        const newValue = arrayMove(selected, oldIndex, newIndex);
        // setSelected(newValue);
        props.onChange?.(newValue?.map((o1: any) => o1?.value));
      };

      let props2 = { ...(props ?? {}) } as any;
      delete props2.useDragHandle;
      delete props2.axis;
      delete props2.onSortEnd;
      delete props2.distance;
      delete props2.getHelperDimensions;
      delete props2.isMulti;
      delete props2.value;
      delete props2.onChange;
      delete props2.components;
      delete props2.closeMenuOnSelect;
      delete props2.allowCreate;

      const customStyles = {
        multiValue: (provided, state) => ({
          ...provided,
          backgroundColor: '#0c2751',
          borderColor: 'rgba(255,255,255,0.2)',
        }),
        multiValueLabel: (provided, state) => ({
          ...provided,
          color: 'white',
        }),
        multiValueRemove: (provided, state) => ({
          ...provided,
          color: 'rgba(255,255,255,0.8)',
        }),
        control: (provided, state) => ({
          ...provided,
          borderColor: 'rgba(255,255,255,0.33)',
          borderRadius: 0,
          backgroundColor: '#0C121B',
          // none of react-select's styles are passed to <Control />
          // width: 200,
        }),
        input: (provided, state) => ({
          ...provided,
          color: 'white',
        }),
        menu: (provided, state) => ({
          ...provided,
          color: 'black',
          zIndex: 2000,
        }),
        // singleValue: (provided, state) => ({
        //   ...provided,
        //   color: 'black',
        // }),
        //   const opacity = state.isDisabled ? 0.5 : 1;
        //   const transition = 'opacity 300ms';
        //
        //   return { ...provided, opacity, transition, };
        // }
      };

      const UseClass = props.allowCreate ? SortableCreatable : SortableSelect;

      return (
        <UseClass
          {...props2}
          useDragHandle
          // react-sortable-hoc props:
          axis="xy"
          styles={customStyles}
          onSortEnd={onSortEnd}
          distance={4}
          // small fix for https://github.com/clauderic/react-sortable-hoc/pull/352:
          getHelperDimensions={({ node }) => node.getBoundingClientRect()}
          // react-select props:
          // @ts-ignore
          isMulti
          // options={colourOptions}
          value={selected}
          onChange={onChange}
          components={{
            // @ts-ignore We're failing to provide a required index prop to SortableElement
            MultiValue: SortableMultiValue,
            MultiValueLabel: SortableMultiValueLabel,
          }}
          closeMenuOnSelect={false}
        />
      );
    }

    if (props.allowReOrder) {
      return <MultiSelectSort {...propsUsed} />;
    } else if (props.allowCreate) {
      return <Creatable {...propsUsed} />;
    } else {
      return <Select {...propsUsed} />;
    }
  },
);

export default SelectReactExt;
