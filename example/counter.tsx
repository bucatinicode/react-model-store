import 'react-app-polyfill/ie11';
import 'react-app-polyfill/stable';

import React from 'react';
import ReactDOM from 'react-dom';
import { Model, useModel } from '../src/react-model-store';

class CounterModel extends Model {
  count: number = this.state(0);

  // Synchronous
  increment = () => this.count++;

  // Asynchronous
  decrement = () => setTimeout(() => this.count--, 1000);
}

const Counter = () => {
  const { count, increment, decrement } = useModel(CounterModel);
  return (
    <div>
      <p>Count: {count}</p>
      <div>
        <button onClick={increment}>Increment</button>
        <button onClick={decrement}>Decrement</button>
      </div>
    </div>
  );
};

ReactDOM.render(
  <div>
    <h2>Counter Example</h2>
    <Counter />
  </div>,
  document.getElementById('root')
);
