import React from 'react';
import { createStore } from '../src/react-model-store';
import {
  IllegalHookModel,
  LowerModel,
  SingleStateModel,
  RefModel,
  IllegalHookMethodModel,
} from './utils/models';
import { mount, shallow } from 'enzyme';

describe('Hooks Tests', () => {
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

  test('Should not call illigaly react hooks functions.', () => {
    const Store = createStore(() => new IllegalHookModel());

    const Mock = jest.fn(() => {
      const model = Store.use();
      model.value(false);
      return null;
    }) as () => null;
    expect(errorSpy!).toBeCalledTimes(0);
    expect(() =>
      mount(
        <Store.Provider>
          <Mock />
        </Store.Provider>
      )
    ).toThrow();
    expect(Mock).toBeCalledTimes(1);
    expect(errorSpy!).toBeCalled();
  });

  test('Models provided by lower provider can use models provided by higher provider.', () => {
    const HigherStore = createStore(() => new SingleStateModel());
    const LowerStore = createStore(() => new LowerModel(HigherStore));

    const Mock = jest.fn(() => {
      let mountRender = false;
      React.useMemo(() => (mountRender = true), []);
      const lower = LowerStore.use();

      if (mountRender) {
        expect(lower.higher.value).toBe(true);
        lower.higher.value = false;
      } else {
        expect(lower.higher.value).toBe(false);
      }
      return null;
    }) as () => null;
    mount(
      <HigherStore.Provider>
        <div>
          <LowerStore.Provider>
            <div>
              <Mock />
            </div>
          </LowerStore.Provider>
        </div>
      </HigherStore.Provider>
    );
    expect(Mock).toBeCalledTimes(2);
    expect(errorSpy).not.toBeCalled();
  });

  test('ref() method that wraps useRef() should get React element refs.', () => {
    let model: RefModel | null = null;
    const Store = createStore(() => (model = new RefModel()));
    const Mock = jest.fn(() => (
      <input ref={Store.use().refInput} defaultValue={'input value'} />
    )) as () => React.ReactElement;
    mount(
      <Store.Provider>
        <Mock />
      </Store.Provider>
    );
    expect(model!.refValue.current).toBeTruthy();
    expect(model!.refInput.current).not.toBeNull();
    expect(model!.refInput.current!.value).toBe('input value');
    expect(Mock).toBeCalledTimes(1);
    expect(errorSpy).not.toBeCalled();
  });

  test('Hook methods of ModelBase class should not be call after model objects have been initialized.', () => {
    let model: IllegalHookMethodModel | null = null;
    const Store = createStore(() => (model = new IllegalHookMethodModel()));
    shallow(
      <Store.Provider>
        <div />
      </Store.Provider>
    );
    expect(() => model!.illegalRef()).toThrow();
    expect(() => model!.illegalState({})).toThrow();
    expect(errorSpy).not.toBeCalled();
  });
});
