import React from 'react';
import {
  SingleStateModel,
  SingleStatePureModel,
  HasInitailValueModel,
  IllegalHookMethodModel,
  EmptyModel,
} from './utils/models';
import { mount, shallow } from 'enzyme';
import {
  createComponent,
  createStore,
  Model,
} from '../src/react-model-store.dev';

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

  test('Should create components that consume a model object.', () => {
    const Store = createStore(SingleStateModel);
    const renderMock = jest.fn((model: SingleStateModel) => {
      expect(model.value).toBeTruthy();
      return null;
    }) as (model: SingleStateModel) => null;
    const ConsumeComponent = createComponent(Store, renderMock);
    mount(
      <Store.Provider>
        <div>
          <ConsumeComponent />
        </div>
      </Store.Provider>
    );
    expect(renderMock).toBeCalledTimes(1);
    expect(errorSpy).not.toBeCalled();
  });

  test('Should create components that consume multiple model objests.', () => {
    type ModelTuple = [
      HasInitailValueModel,
      SingleStateModel,
      SingleStatePureModel
    ];
    const INITIAL_VALUE = 'initial value';
    const ModelStore = createStore(SingleStateModel);
    const PureModelStore = createStore(SingleStatePureModel);

    const renderMock = jest.fn((models: ModelTuple) => {
      const [model1, model2, model3] = models;
      expect(model1.value).toBe(INITIAL_VALUE);
      expect(model2.value).toBe(true);
      expect(model3.value()).toBe(true);
      return null;
    }) as (models: ModelTuple) => null;

    expect(() => createComponent([], () => null)).toThrow();

    const Component = createComponent(
      [HasInitailValueModel, ModelStore, PureModelStore],
      renderMock
    );

    mount(
      <ModelStore.Provider>
        <PureModelStore.Provider>
          <Component initialValue={INITIAL_VALUE} />
        </PureModelStore.Provider>
      </ModelStore.Provider>
    );
    expect(renderMock).toBeCalledTimes(1);
    expect(errorSpy).not.toBeCalled();
  });

  test('Type inference test', () => {
    class OptionModel extends Model {
      constructor(_?: string) {
        super();
      }
    }

    class RequireModel extends Model {
      constructor(_: string) {
        super();
      }
    }

    class OptionUnkonwnModel extends Model {
      constructor(_?: unknown) {
        super();
      }
    }

    class RequireUnknownModel extends Model {
      constructor(_: unknown) {
        super();
      }
    }

    const Empty = createComponent(EmptyModel, () => null);
    const Option = createComponent(OptionModel, () => null);
    const Require = createComponent(RequireModel, () => null);
    const OptionUnknown = createComponent(OptionUnkonwnModel, () => null);
    const RequireUnknown = createComponent(RequireUnknownModel, () => null);
    const EmptyTuple = createComponent([EmptyModel], () => null);
    const OptionTuple = createComponent([OptionModel], () => null);
    const RequireTuple = createComponent([RequireModel], () => null);
    const OptionUnknownTuple = createComponent(
      [OptionUnkonwnModel],
      () => null
    );
    const RequireUnknownTuple = createComponent(
      [RequireUnknownModel],
      () => null
    );

    const empties: React.FC<{}>[] = [Empty];
    const options: React.FC<{} | { initialValue: string }>[] = [
      Option,
      OptionTuple,
    ];
    const requires: React.FC<{ initialValue: string }>[] = [
      Require,
      RequireTuple,
    ];
    const unknowns: React.FC<{} | { initialValue: unknown }>[] = [
      OptionUnknown,
      RequireUnknown,
      EmptyTuple,
      OptionUnknownTuple,
      RequireUnknownTuple,
    ];

    empties.forEach(Component => {
      shallow(<Component />);
      // shallow(<Component initialValue=''/>);
      // shallow(<Component initialValue={0}/>);
    });
    options.forEach(Component => {
      shallow(<Component />);
      shallow(<Component initialValue='' />);
      // shallow(<Component initialValue={0}/>);
    });
    requires.forEach(Component => {
      // shallow(<Component />);
      shallow(<Component initialValue='' />);
      // shallow(<Component initialValue={0}/>);
    });
    unknowns.forEach(Component => {
      shallow(<Component />);
      shallow(<Component initialValue='' />);
      shallow(<Component initialValue={0} />);
    });
  });
});
