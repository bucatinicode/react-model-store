import 'react-app-polyfill/ie11';
import 'react-app-polyfill/stable';

import React from 'react';
import ReactDOM from 'react-dom';
import { Model, createStore } from '../src/react-model-store';

class SyncCounterModel extends Model {
  count: number = this.state(0);

  readonly increment = () => this.count++;

  readonly decrement = () => this.count--;
}

class AsyncCounterModel extends Model {
  count: number;

  constructor(initialValue?: number) {
    super();
    this.count = this.state(initialValue || 0);
  }

  readonly increment = () => setTimeout(() => this.count++, 1000);

  readonly decrement = () => setTimeout(() => this.count--, 1000);
}

class RootModel {
  readonly syncCounter = new SyncCounterModel();
  readonly asyncCounter: AsyncCounterModel;

  constructor(initialValue?: number) {
    this.asyncCounter = new AsyncCounterModel(initialValue);
  }
}

const Store = createStore(
  (initialValue?: number) => new RootModel(initialValue)
);

const SyncCounter = () => {
  const {
    syncCounter: { count, increment, decrement },
  } = Store.use();

  return React.useMemo(
    () => (
      <div>
        <p>Sync Count: {count}</p>
        <div>
          <button onClick={increment}>Increment</button>
          <button onClick={decrement}>Decrement</button>
        </div>
      </div>
    ),
    [count]
  );
};

const AsyncCounter = (props: { children?: string }) => {
  const {
    asyncCounter: { count, increment, decrement },
  } = Store.use();

  return React.useMemo(
    () => (
      <div>
        <p>
          Async Count{props.children}: {count}
        </p>
        <div>
          <button onClick={increment}>Increment</button>
          <button onClick={decrement}>Decrement</button>
        </div>
      </div>
    ),
    [count]
  );
};

const App = () => (
  <Store.Provider>
    <div>
      <SyncCounter />
      <AsyncCounter />
      <AsyncCounter> (same as above)</AsyncCounter>
      <Store.Provider initialValue={30}>
        <AsyncCounter> (default: 30)</AsyncCounter>
      </Store.Provider>
    </div>
  </Store.Provider>
);

ReactDOM.render(<App />, document.getElementById('root'));
