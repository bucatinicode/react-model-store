# React Model Store

[![npm version](https://badge.fury.io/js/react-model-store.svg)](https://badge.fury.io/js/react-model-store)
[![Build Status](https://travis-ci.org/bucatinicode/react-model-store.svg?branch=master)](https://travis-ci.org/bucatinicode/react-model-store)
[![Coverage Status](https://coveralls.io/repos/github/bucatinicode/react-model-store/badge.svg)](https://coveralls.io/github/bucatinicode/react-model-store)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)


The simple state management library for React.

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

## Examples for Typescript

#### [Counter Example (single component pattern)](https://bucatinicode.github.io/react-model-store/example/counter.html)
```tsx
import React from 'react';
import ReactDOM from 'react-dom';
import { Model, createModelComponent } from 'react-model-store';

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

ReactDOM.render(<Counter />, document.getElementById('root'));
```

#### [Todo Example (model provider pattern)](https://bucatinicode.github.io/react-model-store/example/todo.html)

```tsx
import React from 'react';
import ReactDOM from 'react-dom';
import { Model, createStore, createModelComponent } from 'react-model-store';

interface Todo {
  key: number;
  text: string;
}

class ControlModel extends Model {
  textInput = this.ref<HTMLInputElement>();
  onAddClick = this.event<[]>();
  onKeyPress = this.event<[React.KeyboardEvent<HTMLInputElement>]>();

  get text(): string {
    return this.textInput.current!.value;
  }

  refresh(): void {
    this.textInput.current!.value = '';
    this.textInput.current!.focus();
  }
}

class LogicModel extends Model {
  control: ControlModel;
  lastKey: number = this.state(0);
  todos: Todo[] = this.state([]);

  constructor(control: ControlModel) {
    super();
    this.control = control;

    this.addListener(this.control.onAddClick, () => {
      this.add();
    });
    this.addListener(
      this.control.onKeyPress,
      (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
          this.add();
        }
      }
    );
  }

  add(): void {
    if (this.control.text) {
      this.todos.push({
        key: ++this.lastKey,
        text: this.control.text,
      });
      this.control.refresh();
    }
  }

  remove(key: number): void {
    this.todos = this.todos.filter(todo => todo.key !== key);
  }
}

class RootModel {
  control = new ControlModel();
  logic = new LogicModel(this.control);
}

class TodoModel extends Model {
  logic = this.use(Store).logic;
  todo: Todo;
  onRemoveClick: () => void;

  constructor(todo: Todo) {
    super();
    this.todo = todo;
    this.onRemoveClick = this.logic.remove.bind(this.logic, todo.key);
  }
}

const Store = createStore(() => new RootModel());

const ControlPanel = () => {
  const { control: { textInput, onAddClick, onKeyPress } } = Store.use();

  return (
    <div>
      <input type='text' ref={textInput} onKeyPress={onKeyPress} />
      <button onClick={onAddClick}>Add</button>
    </div>
  );
};

const TodoItem = createModelComponent(
  (todo?: Todo) => new TodoModel(todo!),
  ({ todo: { text }, onRemoveClick }) => (
    <li>
      <button onClick={onRemoveClick}>Remove</button>
      <span>{text}</span>
    </li>
  )
);

const App = () => {
  const { logic: { todos } } = Store.use();
  return (
    <div>
      <ControlPanel />
      <ul>
        {todos.map(todo => (
          <TodoItem key={todo.key} initialValue={todo} />
        ))}
      </ul>
    </div>
  );
};

ReactDOM.render(
  <Store.Provider>
    <App />
  </Store.Provider>,
  document.getElementById('root')
);
```

#### [Timer Example (high frequency re-render pattern)](https://bucatinicode.github.io/react-model-store/example/timer.html)

```tsx
import React from 'react';
import ReactDOM from 'react-dom';
import { Model, createModelComponent, createStore } from 'react-model-store';

class RootModel extends Model {
  // Store.Provider component is re-rendered when this state is changed.
  running = this.state(false);

  resetButton = this.ref<HTMLButtonElement>();

  onReset = this.event<[]>();

  onToggle = this.event(() => {
    this.running = !this.running;
    this.resetButton.current!.disabled = this.running;
  });

  get toggleText(): string {
    return this.running ? 'Stop' : 'Start';
  }
}

const Store = createStore(() => new RootModel());

class HighFrequencyTimerModel extends Model {
  root = this.use(Store); // use RootModel

  // HighFrequencyTimer component is re-rendered when this state is changed.
  time = this.state(0);
  started: number = 0;
  stored: number = 0;

  constructor() {
    super();
    this.addListener(this.root.onToggle, this.toggle);
    this.addListener(this.root.onReset, this.reset);
  }

  update(): void {
    this.time = this.stored + new Date().getTime() - this.started;
  }

  run = () => {
    if (this.root.running) {
      this.update();
      setTimeout(this.run, 50);
    }
  };

  toggle = () => {
    if (this.root.running) {
      this.started = new Date().getTime();
      this.run();
    } else {
      this.update();
      this.stored = this.time;
    }
  };

  reset = () => {
    this.stored = 0;
    this.time = 0;
  };
}

const HighFrequencyTimer = createModelComponent(
  () => new HighFrequencyTimerModel(),
  ({ time }) => <span>{(time / 1000).toFixed(2)}</span>
);

const Controller = () => {
  const { onReset, onToggle, toggleText, resetButton } = Store.use();
  return (
    <div>
      <button onClick={onToggle}>{toggleText}</button>
      <button onClick={onReset} ref={resetButton}>
        Reset
      </button>
    </div>
  );
};

ReactDOM.render(
  <Store.Provider>
    <div>
      <div>
        {/*
         * HighFrequencyTimer component is re-rendered frequently.
         * But that re-rendering doesn't cause re-rendering of the provider.
         */}
        <HighFrequencyTimer />
      </div>
      <Controller />
    </div>
  </Store.Provider>,
  document.getElementById('root')
);
```
