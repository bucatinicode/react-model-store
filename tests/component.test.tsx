import React from 'react';
import {
  SingleStateModel,
  SingleStatePureModel,
  HasInitailValueModel,
  IllegalHookMethodModel,
} from './utils/models';
import { mount } from 'enzyme';
import { useModel, useStore, createStore } from '../src/react-model-store.dev';

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
    const Mock = jest.fn((props: { value: number }) => {
      const model = useModel(SingleStateModel);
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
    }) as (props: { value: number }) => React.ReactElement;
    const wrapper = mount(<Mock value={100} />);
    expect(Mock).toBeCalledTimes(2);
    expect(wrapper.getDOMNode().nodeName).toBe('DIV');
    expect(wrapper.getDOMNode().id).toBe('mock');
    expect(errorSpy).not.toBeCalled();
  });

  test('Should render a model component that has initialValue.', () => {
    const INITIAL_VALUE = 'initial value';
    const Mock = jest.fn((props: { initialValue: string }) => {
      const model = useModel(HasInitailValueModel, props.initialValue);
      return <div>{model.value}</div>;
    }) as (props: { initialValue: string }) => React.ReactElement;
    const wrapper = mount(<Mock initialValue={INITIAL_VALUE} />);
    expect(Mock).toBeCalledTimes(1);
    expect(wrapper.getDOMNode().nodeName).toBe('DIV');
    expect(wrapper.getDOMNode().innerHTML).toBe(INITIAL_VALUE);
    expect(errorSpy).not.toBeCalled();
  });

  test('Hook functions should not be called outside of Model constructor.', () => {
    let setState: ((value: boolean) => void) | null = null;
    const Component = jest.fn(() => {
      const model = useModel(IllegalHookMethodModel);
      setState!(false);
      expect(() => model.illegalState()).toThrow();
      expect(() => model.illegalHook()).toThrow();
      return null;
    }) as () => null;
    const Mock = jest.fn(() => {
      const [state, set] = React.useState(true);
      setState = set;
      if (!state) {
        return null;
      }
      return <Component />;
    }) as () => null;
    mount(<Mock />);
    expect(Component).toBeCalledTimes(1);
    expect(Mock).toBeCalledTimes(2);
    expect(errorSpy).not.toBeCalled();
  });

  test('Should create components that consume a model object.', () => {
    const Store = createStore(SingleStateModel);
    const Mock = jest.fn(() => {
      const model = useStore(Store);
      expect(model.value).toBeTruthy();
      return null;
    }) as () => null;
    mount(
      <Store.Provider>
        <div>
          <Mock />
        </div>
      </Store.Provider>
    );
    expect(Mock).toBeCalledTimes(1);
    expect(errorSpy).not.toBeCalled();
  });

  test('Should create components that consume multiple model objests.', () => {
    const INITIAL_VALUE = 'initial value';
    const ModelStore = createStore(SingleStateModel);
    const PureModelStore = createStore(SingleStatePureModel);

    const Mock = jest.fn((props: { initialValue: string }) => {
      const model1 = useModel(HasInitailValueModel, props.initialValue);
      const model2 = useStore(ModelStore);
      const model3 = useStore(PureModelStore);
      expect(model1.value).toBe(INITIAL_VALUE);
      expect(model2.value).toBe(true);
      expect(model3.value()).toBe(true);
      return null;
    }) as (props: { initialValue: string }) => null;

    mount(
      <ModelStore.Provider>
        <PureModelStore.Provider>
          <Mock initialValue={INITIAL_VALUE} />
        </PureModelStore.Provider>
      </ModelStore.Provider>
    );
    expect(Mock).toBeCalledTimes(1);
    expect(errorSpy).not.toBeCalled();
  });
});
