import React from 'react';
import {
  SingleStateModel,
  HasInitailValueModel,
  IllegalHookMethodModel,
} from './utils/models';
import { mount } from 'enzyme';
import { createComponent } from '../src/react-model-store';

describe('Model Component Test', () => {
  let errorSpy: jest.SpyInstance | null = null;

  beforeEach(() => {
    errorSpy!.mockClear();
  });

  beforeAll(() => {
    // tslint:disable-next-line: no-empty
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterAll(() => {
    errorSpy!.mockRestore();
  });

  test('Should render a model component that has props.', () => {
    const renderMock = jest.fn(
      (model: SingleStateModel, props: { value: number }) => {
        let mountRender = false;
        React.useMemo(() => (mountRender = true), []);
        if (mountRender) {
          expect(model.value).toBe(true);
          model.value = false;
          expect(model.value).toBe(false);
        } else {
          expect(model.value).toBe(false);
        }
        expect(props.value).toBe(100);
        return <div id='mock' />;
      }
    ) as (
      model: SingleStateModel,
      props: { value: number }
    ) => React.ReactElement;
    const Model = createComponent(SingleStateModel, renderMock);
    const wrapper = mount(<Model value={100} />);
    expect(renderMock).toBeCalledTimes(2);
    expect(wrapper.getDOMNode().nodeName).toBe('DIV');
    expect(wrapper.getDOMNode().id).toBe('mock');
    expect(errorSpy).not.toBeCalled();
  });

  test('Should render a model component that has initialValue.', () => {
    const INITIAL_VALUE = 'initial value';
    const renderMock = jest.fn((model: { value: string }) => {
      return <div>{model.value}</div>;
    }) as (model: { value: string }) => React.ReactElement;
    const Model = createComponent(HasInitailValueModel, renderMock);
    const wrapper = mount(<Model initialValue={INITIAL_VALUE} />);
    expect(renderMock).toBeCalledTimes(1);
    expect(wrapper.getDOMNode().nodeName).toBe('DIV');
    expect(wrapper.getDOMNode().innerHTML).toBe(INITIAL_VALUE);
    expect(errorSpy).not.toBeCalled();
  });

  test('Hook functions should not be called outside of Model constructor.', () => {
    let setState: ((value: boolean) => void) | null = null;
    const renderMock = jest.fn((model: IllegalHookMethodModel) => {
      setState!(false);
      expect(() => model.illegalState()).toThrow();
      expect(() => model.illegalHook()).toThrow();
      return null;
    }) as (model: IllegalHookMethodModel) => null;
    const Component = createComponent(IllegalHookMethodModel, renderMock);
    const Mock = jest.fn(() => {
      const [state, set] = React.useState(true);
      setState = set;
      if (!state) {
        return null;
      }
      return <Component />;
    }) as () => null;
    mount(<Mock />);
    expect(renderMock).toBeCalledTimes(1);
    expect(Mock).toBeCalledTimes(2);
    expect(errorSpy).not.toBeCalled();
  });
});
