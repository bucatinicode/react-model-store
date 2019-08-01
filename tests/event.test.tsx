import React from 'react';
import { act } from 'react-dom/test-utils';
import {
  ModelBase,
  Action,
  Event,
  useModel,
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

    const Listener = jest.fn(() => {
      listener = useModel(ListenerModel);
      return null;
    }) as () => null;

    const Event = jest.fn(() => {
      const { onChange, onClick } = (event = useModel(EventModel));
      return (
        <div>
          <input type='text' onChange={onChange} />
          <button onClick={onClick} />
        </div>
      );
    }) as () => React.ReactElement;

    const Root = jest.fn(() => {
      root = useModel(NumberModel);
      return (
        <div>
          {root.n > 1 ? null : <Event />}
          {root.n > 0 ? null : <Listener />}
        </div>
      );
    }) as () => React.ReactElement;

    const wrapper = mount(<Root />);
    const change = (value: string) => {
      const input = wrapper.find('input');
      input.getDOMNode<HTMLInputElement>().value = value;
      input.simulate('change');
    };
    const click = () => wrapper.find('button').simulate('click');

    expect(Root).toBeCalledTimes(1);
    expect(Event).toBeCalledTimes(1);
    expect(Listener).toBeCalledTimes(1);
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
    expect(Root).toBeCalledTimes(2);
    expect(Event).toBeCalledTimes(2);
    expect(Listener).toBeCalledTimes(1);
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
    expect(Root).toBeCalledTimes(3);
    expect(Event).toBeCalledTimes(2);
    expect(Listener).toBeCalledTimes(1);
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
