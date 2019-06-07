import React from 'react';
import { createStore } from '../src/react-model-store';
import {
  SingleStateModel,
  EmptyModel,
  HasInitailValueModel,
  ParentModel,
  MountModel,
  UndefinableStateModel,
} from './utils/models';
import { shallow, mount } from 'enzyme';
import { findMeta } from './utils/meta';

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

  test('<Store.Provider> should create model object.', () => {
    let model: SingleStateModel | null = null;
    const Store = createStore(() => (model = new SingleStateModel()));
    shallow(
      <Store.Provider>
        <div />
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
    const Store = createStore(() => (model = new ParentModel()));
    shallow(
      <Store.Provider>
        <div />
      </Store.Provider>
    );
    expect(typeof model!.child.grandchild.value).toBe('boolean');
    expect(model!.child.grandchild.value).toBeTruthy();
    expect(errorSpy!).not.toBeCalled();
  });

  test('<Store.Provider> should provide Store.use() with model instance.', () => {
    const Store = createStore(() => new EmptyModel());
    const mockComponent = jest.fn(() => {
      const model = Store.use();
      expect(model).toBeInstanceOf(EmptyModel);
      return null;
    });
    const Mock = mockComponent as () => null;
    mount(
      <Store.Provider>
        <div>
          <Mock />
        </div>
      </Store.Provider>
    );
    expect(mockComponent).toBeCalledTimes(1);
    expect(errorSpy!).not.toBeCalled();
  });

  test('Store.use() should not be provided with model instance without <Store.Provider>.', () => {
    const Store = createStore(() => new EmptyModel());
    const mockComponent = jest.fn(() => {
      expect(() => Store.use()).toThrow();
      return null;
    });
    const Mock = mockComponent as () => null;
    mount(
      <div>
        <Mock />
      </div>
    );
    expect(mockComponent).toBeCalledTimes(1);
    expect(errorSpy!).not.toBeCalled();
  });

  test('<Store.Provider> should provide <Store.Consumer> with model instance.', () => {
    const Store = createStore(() => new EmptyModel());
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

  test('<Store.Consumer> should not be provided with model instance without <Store.Provider>.', () => {
    const Store = createStore(() => new EmptyModel());
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
    const Store = createStore<HasInitailValueModel, string>(
      initialValue => new HasInitailValueModel(initialValue)
    );
    const mockComponent = jest.fn(() => {
      const model = Store.use();
      expect(model.value).toBe(INITIAL_VALUE);
      return null;
    });
    const Mock = mockComponent as () => null;
    mount(
      <Store.Provider initialValue={INITIAL_VALUE}>
        <div>
          <Mock />
        </div>
      </Store.Provider>
    );
    expect(mockComponent).toBeCalledTimes(1);
    expect(errorSpy!).not.toBeCalled();
  });

  test('Classes that extend ModelBase class can override onMount() and onUnmount() methods.', () => {
    let model: MountModel | null = null;
    const Store = createStore(() => (model = new MountModel()));

    shallow(
      <Store.Provider>
        <div />
      </Store.Provider>
    );
    expect(model!.stage).toBe(0);
    expect(model!.mounted).toBeTruthy();
    expect(findMeta(model!)).not.toBeUndefined();

    model = null;
    mount(
      <Store.Provider>
        <div />
      </Store.Provider>
    );
    expect(model!.stage).toBe(1);
    expect(model!.mounted).toBeTruthy();
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
            <Context.Consumer>
              {_ => {
                setRender(false);
                return null;
              }}
            </Context.Consumer>
          </Store.Provider>
        </Context.Provider>
      );
    };

    model = null;
    mount(<Unmounter />);
    expect(model!.stage).toBe(2);
    expect(model!.mounted).toBeFalsy();
    expect(model!.value).toBeTruthy();
    model!.value = false;
    expect(model!.value).toBeTruthy();
    expect(findMeta(model!)).toBeUndefined();
    expect(errorSpy!).not.toBeCalled();
  });

  test('createModel argument of createStore() should return a new object', () => {
    function expectCreateStore(createModel: () => any, toThrow: boolean) {
      const Store = createStore(createModel);

      const create = () =>
        shallow(
          <Store.Provider>
            <div />
          </Store.Provider>
        );

      if (toThrow) {
        expect(create).toThrow();
      } else {
        create();
      }
    }
    const obj = {};
    const testvalues: [() => any, boolean][] = [
      [() => undefined, true],
      [() => null, true],
      [() => true, true],
      [() => 1, true],
      [() => 'str', true],
      [() => obj, false],
      [() => obj, true],
    ];
    testvalues.forEach(args => expectCreateStore(...args));
    expect(errorSpy!).not.toBeCalled();
  });

  test('State should get and set undefined value.', () => {
    const Store = createStore(() => new UndefinableStateModel());
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
  });
});
