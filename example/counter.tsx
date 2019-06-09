import 'react-app-polyfill/ie11';
import 'react-app-polyfill/stable';

import React from 'react';
import ReactDOM from 'react-dom';
import { Model, createModelComponent } from '../src/react-model-store';

class CounterModel extends Model {
  count: number = this.state(0);

  // Synchronous
  increment = () => this.count++;

  // Asynchronous
  decrement = () => setTimeout(() => this.count--, 1000);
}

const Counter = createModelComponent(
  () => new CounterModel(),
  ({ count, increment, decrement }) => (
    <div>
      <p>Count: {count}</p>
      <div>
        <button onClick={increment}>Increment</button>
        <button onClick={decrement}>Decrement</button>
      </div>
    </div>
  )
);

ReactDOM.render(
  <div>
    <h2>Counter Example</h2>
    <Counter />
  </div>,
  document.getElementById('root')
);
