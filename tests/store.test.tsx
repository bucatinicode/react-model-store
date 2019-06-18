import React from 'react';
import { createStore, createComponent } from '../src/react-model-store.dev';
import {
  SingleStateModel,
  EmptyModel,
  HasInitailValueModel,
  ParentModel,
  MountModel,
  UndefinableStateModel,
  LowerModel,
} from './utils/models';
import { shallow, mount } from 'enzyme';
import {
  findMeta,
  setCurrentMetaAsNew,
  setCurrentMetaAsNull,
} from './utils/meta';

describe('Store Tests', () => {
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

  test('<Store.Provider> should provide Store.use() with model instance.', () => {
    const Store = createStore(EmptyModel);
    const Mock = jest.fn(() => {
      const model = Store.use();
      expect(model).toBeInstanceOf(EmptyModel);
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
    expect(errorSpy!).not.toBeCalled();
  });

  test('Store.use() should not be provided with model instance without <Store.Provider>.', () => {
    const Store = createStore(EmptyModel);
    const Mock = jest.fn(() => {
      expect(() => Store.use()).toThrow();
      return null;
    }) as () => null;
    mount(
      <div>
        <Mock />
      </div>
    );
    expect(Mock).toBeCalledTimes(1);
    expect(errorSpy!).not.toBeCalled();
  });

  test('<Store.Provider> should provide <Store.Consumer> with model instance.', () => {
    const Store = createStore(EmptyModel);
    mount(
      <Store.Provider>
        <div>
          <Store.Consumer>
            {model => expect(model).toBeInstanceOf(EmptyModel)}
          </Store.Consumer>
        </div>
      </Store.Provider>
    );
    expect(errorSpy!).not.toBeCalled();
  });
  test('<Store.Provider> should create model object.', () => {
    let model: SingleStateModel | null = null;
    const Store = createStore(SingleStateModel);
    mount(
      <Store.Provider>
        <div>
          <Store.Consumer>
            {m => {
              model = m;
              return null;
            }}
          </Store.Consumer>
        </div>
      </Store.Provider>
    );
    expect(model).not.toBeNull();
    const meta = findMeta(model!)!;
    expect(meta).not.toBeUndefined();
    expect(meta.mounted).toBeTruthy();
    expect(meta.finalized).toBeTruthy();
    expect(meta.hooks).toHaveLength(1);
    expect(meta.models).toHaveLength(1);
    expect(meta.mountEvents).toHaveLength(1);
    expect(meta.unmountEvents).toHaveLength(1);
    expect(errorSpy!).not.toBeCalled();
  });

  test('createStore() should exchange state properties of classes that extend Model class.', () => {
    let model: ParentModel | null = null;
    const Store = createStore(ParentModel);
    mount(
      <Store.Provider>
        <div>
          <Store.Consumer>
            {m => {
              model = m;
              return null;
            }}
          </Store.Consumer>
        </div>
      </Store.Provider>
    );
    expect(typeof model!.child.grandchild.value).toBe('boolean');
    expect(model!.child.grandchild.value).toBeTruthy();
    expect(errorSpy!).not.toBeCalled();
  });

  test('<Store.Consumer> should not be provided with model instance without <Store.Provider>.', () => {
    const Store = createStore(EmptyModel);
    expect(errorSpy!).toBeCalledTimes(0);
    expect(() =>
      mount(
        <div>
          <Store.Consumer>{_model => null}</Store.Consumer>
        </div>
      )
    ).toThrow();
    expect(errorSpy!).toBeCalled();
  });

  test('initialValue props of <Store.Provider> should provide createModel function with initial value.', () => {
    const INITIAL_VALUE = 'initial value';
    const Store = createStore(HasInitailValueModel);
    const Mock = jest.fn(() => {
      const model = Store.use();
      expect(model.value).toBe(INITIAL_VALUE);
      return null;
    }) as () => null;
    mount(
      <Store.Provider initialValue={INITIAL_VALUE}>
        <div>
          <Mock />
        </div>
      </Store.Provider>
    );
    expect(Mock).toBeCalledTimes(1);
    expect(errorSpy!).not.toBeCalled();
  });

  test('Classes that extend ModelBase class can override onMount() and onUnmount() methods.', () => {
    let model: MountModel | null = null;
    const Store = createStore(MountModel);

    const Mock = jest.fn(() => {
      model = new MountModel();
      return null;
    }) as () => null;

    setCurrentMetaAsNew();
    try {
      shallow(<Mock />);
    } finally {
      setCurrentMetaAsNull();
    }
    expect(Mock).toBeCalled();
    expect(model!.stage).toBe(0);
    expect(model!.isMounted).toBeTruthy();

    model = null;
    mount(
      <Store.Provider>
        <div>
          <Store.Consumer>
            {m => {
              model = m;
              return null;
            }}
          </Store.Consumer>
        </div>
      </Store.Provider>
    );
    expect(model!.stage).toBe(1);
    expect(model!.isMounted).toBeTruthy();
    expect(findMeta(model!)).not.toBeUndefined();

    const Context = React.createContext(true);
    const Unmounter = () => {
      const [isRender, setRender] = React.useState(true);
      if (!isRender) {
        return null;
      }
      return (
        <Context.Provider value={isRender}>
          <Store.Provider>
            <Store.Consumer>
              {m => {
                model = m;
                return (
                  <Context.Consumer>
                    {_ => {
                      setRender(false);
                      return null;
                    }}
                  </Context.Consumer>
                );
              }}
            </Store.Consumer>
          </Store.Provider>
        </Context.Provider>
      );
    };

    model = null;
    mount(<Unmounter />);
    expect(model!.stage).toBe(2);
    expect(model!.isMounted).toBeFalsy();
    expect(model!.value).toBeTruthy();
    model!.value = false;
    expect(model!.value).toBeTruthy();
    expect(findMeta(model!)).toBeUndefined();
    expect(errorSpy!).not.toBeCalled();
  });

  test('State should get and set undefined value.', () => {
    const Store = createStore(UndefinableStateModel);
    const Mock = jest.fn(() => {
      const model = Store.use();
      let mountRender = false;
      React.useMemo(() => (mountRender = true), []);
      if (mountRender) {
        expect(model.value).toBe(0);
        model.value = undefined;
        expect(model.value).toBeUndefined();
        expect(model.valueFunc()).toBe(0);
        model.valueFunc(undefined);
        expect(model.valueFunc()).toBeUndefined();
      }
      return null;
    }) as () => null;
    mount(
      <Store.Provider>
        <Mock />
      </Store.Provider>
    );
    expect(Mock).toBeCalledTimes(2);
    expect(errorSpy!).not.toBeCalled();
  });

  test('toConsumable() should create consume only Store.', () => {
    class TestLowerModel extends LowerModel<SingleStateModel> {}
    const HigherStore = createStore(SingleStateModel);
    const HigherConsumable = HigherStore.toConsumable();

    expect(
      Object.prototype.hasOwnProperty.call(HigherConsumable, 'Provider')
    ).toBeFalsy();
    expect(
      Object.prototype.hasOwnProperty.call(HigherConsumable, 'toConsumable')
    ).toBeFalsy();

    const renderMock = jest.fn((model: TestLowerModel) => {
      expect(model.higher.value).toBeTruthy();
      return null;
    }) as (model: TestLowerModel) => null;

    const Lower = createComponent(TestLowerModel, renderMock);

    mount(
      <HigherStore.Provider>
        <div>
          <HigherConsumable.Consumer>
            {model => {
              expect(model.value).toBeTruthy();
              return null;
            }}
          </HigherConsumable.Consumer>
          <Lower initialValue={HigherConsumable} />
        </div>
      </HigherStore.Provider>
    );

    expect(renderMock).toBeCalledTimes(1);
    expect(errorSpy!).not.toBeCalled();
  });
});
