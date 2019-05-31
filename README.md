# React Model Store

[![npm version](https://badge.fury.io/js/react-model-store.svg)](https://badge.fury.io/js/react-model-store)
[![Build Status](https://travis-ci.org/bucatinicode/react-model-store.svg?branch=master)](https://travis-ci.org/bucatinicode/react-model-store)
[![Coverage Status](https://coveralls.io/repos/github/bucatinicode/react-model-store/badge.svg)](https://coveralls.io/github/bucatinicode/react-model-store)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)


A simple state management library for React.

This library provides model-based state management.

## Install

```sh
npm install react-model-store
```
or
```sh
yarn add react-model-store
```

## Requirements

- React 16.8.0 or newer

## Example

```tsx
import React from 'react';
import ReactDOM from 'react-dom';
import { Model, createStore } from 'react-model-store';

class SyncCounterModel extends Model {
  count: number = this.state(0);

  increment = () => this.count++;

  decrement = () => this.count--;
}

class AsyncCounterModel extends Model {
  count: number = this.state(0);

  increment = () => setTimeout(() => this.count++, 1000);

  decrement = () => setTimeout(() => this.count--, 1000);
}

class RootModel {
  syncCounter = new SyncCounterModel();
  asyncCounter = new AsyncCounterModel();
}

const Store = createStore(() => new RootModel());

const SyncCounter = () => {
  const { syncCounter: { count, increment, decrement } } = Store.use();

  return React.useMemo(() => (
    <div>
      <p>Sync Count: {count}</p>
      <div>
        <button onClick={increment}>Increment</button>
        <button onClick={decrement}>Decrement</button>
      </div>
    </div>
  ), [count]);
};

const AsyncCounter = () => {
  const { asyncCounter: { count, increment, decrement } } = Store.use();

  return React.useMemo(() => (
    <div>
      <p>Async Count: {count}</p>
      <div>
        <button onClick={increment}>Increment</button>
        <button onClick={decrement}>Decrement</button>
      </div>
    </div>
  ), [count]);
};

const App = () => (
  <Store.Provider>
    <div>
      <SyncCounter />
      <AsyncCounter />
    </div>
  </Store.Provider>
);

ReactDOM.render(<App />, document.getElementById('root'));
```

