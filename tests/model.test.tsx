import React from 'react';
import {
  EmptyModel,
  EmptyPureModel,
  SingleStateModel,
  SingleStatePureModel,
  ParentModel,
} from './utils/models';
import { Model, PureModel, Accessor } from '../src/react-model-store';
import {
  setCurrentMetaAsNull,
  setCurrentMetaAsNew,
  expectMetaToHaveModelCount,
  expectMetaToBeFinalized,
  expectMetaToBeMounted,
  expectMetaToHaveHookCount,
  deceiveHooks,
  expectMetaToHaveModelBaseCount,
} from './utils/meta';
import { shallow } from 'enzyme';

describe('Model Tests', () => {
  afterEach(() => {
    setCurrentMetaAsNull();
  });

  test('Should throw an error when Model constructor is called.', () => {
    expect(() => new EmptyModel()).toThrow();
    expect(() => new EmptyPureModel()).toThrow();
  });

  test('Should succeed in creating instance when current.meta is set.', () => {
    function expectModelToBeCreatedTimes(expected: number): void {
      expectMetaToHaveModelBaseCount(expected);
      expectMetaToBeFinalized(false);
      expectMetaToBeMounted(true);
      expectMetaToHaveHookCount(0);
    }

    setCurrentMetaAsNew();
    expectMetaToHaveModelCount(0);
    expectModelToBeCreatedTimes(0);

    const model = new EmptyModel();
    expect(model).toBeInstanceOf(Model);
    expectMetaToHaveModelCount(1);
    expectModelToBeCreatedTimes(1);

    const pureModel = new EmptyPureModel();
    expectMetaToHaveModelCount(1);
    expect(pureModel).toBeInstanceOf(PureModel);
    expectModelToBeCreatedTimes(2);
  });

  test('Model constructors that have state should be called inside of the body of a function component.', () => {
    function expectSingleStateModelToBeCreatedTimes(expected: number): void {
      expectMetaToHaveModelBaseCount(expected);
      expectMetaToBeFinalized(false);
      expectMetaToBeMounted(true);
      expectMetaToHaveHookCount(expected);
    }

    setCurrentMetaAsNew();
    expectMetaToHaveModelCount(0);
    expectSingleStateModelToBeCreatedTimes(0);

    const mockComponent = jest.fn(() => {
      let mountRender = false;
      React.useMemo(() => (mountRender = true), []);

      if (mountRender) {
        const model = new SingleStateModel();
        expect(model).toBeInstanceOf(Model);
        expect(typeof model.value).toBe('function');
        const state = (model.value as unknown) as Accessor<boolean>;
        expect(state()).toBe(true);
        state(false);
        expect(state()).toBe(false);
        expectMetaToHaveModelCount(1);
        expectSingleStateModelToBeCreatedTimes(1);

        const pureModel = new SingleStatePureModel();
        expect(pureModel).toBeInstanceOf(PureModel);
        expect(typeof pureModel.value).toBe('function');
        expect(pureModel.value()).toBe(true);
        pureModel.value(false);
        expect(pureModel.value()).toBe(false);
        expectMetaToHaveModelCount(1);
        expectSingleStateModelToBeCreatedTimes(2);

        const parentModel = new ParentModel();
        expect(parentModel).toBeInstanceOf(ParentModel);
        expect(parentModel.child.grandchild).toBeInstanceOf(Model);
        expect(parentModel.child.pureGrandchild).toBeInstanceOf(PureModel);
        expectMetaToHaveModelCount(2);
        expectSingleStateModelToBeCreatedTimes(4);
      } else {
        deceiveHooks();
      }
      return null;
    });

    const Mock = (mockComponent as unknown) as () => React.ReactElement;

    const spy = jest.spyOn(console, 'error');
    try {
      shallow(<Mock />);
      expect(spy).not.toHaveBeenCalled();
    } finally {
      spy.mockRestore();
    }
    expect(mockComponent).toBeCalledTimes(2);
  });

  test('Should not call ModelBase constructors directly.', () => {
    setCurrentMetaAsNew();
    expect(() => new SingleStateModel()).toThrow();

    setCurrentMetaAsNew();
    expect(() => new SingleStatePureModel()).toThrow();
  });
});
