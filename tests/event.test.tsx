import React from 'react';
import { act } from 'react-dom/test-utils';
import {
  ModelBase,
  Action,
  Event,
  createComponent,
} from '../src/react-model-store.dev';
import { EventModel, ListenerModel, NumberModel } from './utils/models';
import { mount } from 'enzyme';
import { expectListenerDependencyCount } from './utils/meta';

describe('Event Tests', () => {
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

  test('Model event should work.', () => {
    let root: NumberModel | null = null;
    let event: EventModel | null = null;
    let listener: ListenerModel | null = null;

    const renderListener = jest.fn((model: ListenerModel) => {
      listener = model;
      return null;
    }) as (model: ListenerModel) => null;
    const Listener = createComponent(ListenerModel, renderListener);

    const renderEvent = jest.fn((model: EventModel) => {
      const { onChange, onClick } = (event = model);
      return (
        <div>
          <input type='text' onChange={onChange} />
          <button onClick={onClick} />
        </div>
      );
    }) as (model: EventModel) => React.ReactElement;
    const Event = createComponent(EventModel, renderEvent);

    const renderRoot = jest.fn((model: NumberModel) => {
      root = model;
      return (
        <div>
          {model.n > 1 ? null : <Event />}
          {model.n > 0 ? null : <Listener />}
        </div>
      );
    }) as (model: NumberModel) => React.ReactElement;
    const Root = createComponent(NumberModel, renderRoot);

    const wrapper = mount(<Root />);
    const change = (value: string) => {
      const input = wrapper.find('input');
      input.getDOMNode<HTMLInputElement>().value = value;
      input.simulate('change');
    };
    const click = () => wrapper.find('button').simulate('click');

    expect(renderRoot).toBeCalledTimes(1);
    expect(renderEvent).toBeCalledTimes(1);
    expect(renderListener).toBeCalledTimes(1);
    expect(map(event!.onClick).size).toBe(1);
    expect(map(event!.onChange).size).toBe(0);
    expectListenerDependencyCount(event!, 1);
    expectListenerDependencyCount(listener!);

    let count = 0;
    let text = '';
    const onClick = () => count--;
    const onChange = (e: React.ChangeEvent<HTMLInputElement>) =>
      (text = e.target.value);

    expect(listener!.add(event!.onClick, onClick)).toBeTruthy();
    expectListenerDependencyCount(listener!, 1);
    expect(map(event!.onClick).size).toBe(2);
    expect(listener!.add(event!.onClick, onClick)).toBeFalsy();
    expectListenerDependencyCount(listener!, 1);
    expect(map(event!.onClick).size).toBe(2);
    expect(listener!.remove(event!.onClick, onClick)).toBeTruthy();
    expectListenerDependencyCount(listener!, 0);
    expect(map(event!.onClick).size).toBe(1);
    expect(listener!.remove(event!.onClick, onClick)).toBeFalsy();
    expectListenerDependencyCount(listener!, 0);
    expect(map(event!.onClick).size).toBe(1);

    expect(listener!.add(event!.onChange, onChange)).toBeTruthy();
    expectListenerDependencyCount(listener!, 1);
    expect(map(event!.onChange).size).toBe(1);
    event!.onChange.clear();
    expectListenerDependencyCount(listener!, 0);
    expect(map(event!.onChange).size).toBe(0);

    expect(listener!.add(event!.onClick, onClick)).toBeTruthy();
    expect(listener!.add(event!.onChange, onChange)).toBeTruthy();
    expectListenerDependencyCount(event!, 1);
    expectListenerDependencyCount(listener!, 2);
    expect(map(event!.onClick).size).toBe(2);
    expect(map(event!.onChange).size).toBe(1);

    change('change value');
    expect(text).toBe('change value');
    click();
    expect(event!.count).toBe(1);
    expect(count).toBe(-1);

    act(() => {
      root!.n = 1;
    });
    expect(renderRoot).toBeCalledTimes(2);
    expect(renderEvent).toBeCalledTimes(2);
    expect(renderListener).toBeCalledTimes(1);
    expectListenerDependencyCount(event!, 1);
    expectListenerDependencyCount(listener!);
    expect(map(event!.onClick).size).toBe(1);
    expect(map(event!.onChange).size).toBe(0);

    expect(() => listener!.add(event!.onClick, onClick)).toThrow();
    expect(event!.onClick.add(onClick)).toBeTruthy();
    expect(map(event!.onClick).size).toBe(2);

    act(() => {
      root!.n = 2;
    });
    expect(renderRoot).toBeCalledTimes(3);
    expect(renderEvent).toBeCalledTimes(2);
    expect(renderListener).toBeCalledTimes(1);
    expectListenerDependencyCount(event!);
    expectListenerDependencyCount(listener!);
    expect(map(event!.onClick).size).toBe(1);
    expect(map(event!.onChange).size).toBe(0);

    expect(event!.onClick.remove(onClick)).toBeTruthy();
    expect(map(event!.onClick).size).toBe(0);

    expect(errorSpy).not.toBeCalled();
  });
});

function map<TArgs extends any[]>(
  event: Event<TArgs>
): Map<Action<TArgs>, ModelBase | null> {
  return (event as any)._listenerMap as Map<Action<TArgs>, ModelBase | null>;
}
