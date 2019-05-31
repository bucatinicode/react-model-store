import React from 'react';
import { createStore, Action, Event } from '../src/react-model-store';
import { EventModel, ListenModel } from './utils/models';
import { mount } from 'enzyme';
import { expectRemoveListenerCount } from './utils/meta';

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
    let eventModel: EventModel | null = null;
    let listenModel: ListenModel | null = null;
    const EventStore = createStore(() => (eventModel = new EventModel()));
    const ListenStore = createStore(
      () => (listenModel = new ListenModel(EventStore))
    );
    const mockComponent = jest.fn(() => {
      const model = ListenStore.use();
      expect(getListeners(model.eventModel.addEvent).size).toBe(3);
      expectRemoveListenerCount(model, 2);
      const testValues = React.useMemo(
        () => [[7, 4, -7, 3], [3, 3, -3, 4], [0, 0, 0, 3]],
        []
      );
      const values = testValues.pop();
      expect(values).not.toBeUndefined();
      expect(model.eventModel.count).toBe(values![0]);
      expect(model.lastAdded).toBe(values![1]);
      expect(model.negativeCount).toBe(values![2]);
      model.add(values![3]);
      return null;
    });
    const Mock = mockComponent as () => null;
    mount(
      <EventStore.Provider>
        <EventStore.Consumer>
          {model =>
            model.count < 10 ? (
              <ListenStore.Provider>
                <Mock />
              </ListenStore.Provider>
            ) : null
          }
        </EventStore.Consumer>
      </EventStore.Provider>
    );
    expect(mockComponent).toBeCalledTimes(3);
    expect(eventModel!.count).toBe(10);
    expect(getListeners(eventModel!.addEvent).size).toBe(1);
    expectRemoveListenerCount(listenModel!, 0);
    expect(listenModel!.lastAdded).toBe(3);
    expect(listenModel!.negativeCount).toBe(-10);
    expect(() => listenModel!.addListener()).toThrow();
    expect(errorSpy).not.toBeCalled();
  });
});

function getListeners<TArgs extends any[]>(
  event: Event<TArgs>
): Set<Action<TArgs>> {
  return (event as any)._eventListeners as Set<Action<TArgs>>;
}
