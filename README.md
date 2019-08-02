# React Model Store

[![npm version](https://img.shields.io/npm/v/react-model-store.svg)](https://www.npmjs.com/package/react-model-store)
[![Build Status](https://travis-ci.org/bucatinicode/react-model-store.svg?branch=master)](https://travis-ci.org/bucatinicode/react-model-store)
[![Coverage Status](https://coveralls.io/repos/github/bucatinicode/react-model-store/badge.svg)](https://coveralls.io/github/bucatinicode/react-model-store)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)


The simple state management library for React.

This library provides model-based state management with Hooks and Context API of React.

## Install

```sh
npm install https://github.com/bucatinicode/react-model-store#v0.4.0-beta1
```
or
```sh
yarn add https://github.com/bucatinicode/react-model-store#v0.4.0-beta1
```

## Requirements

- React 16.8.0 or newer

## Examples for Typescript

#### [Counter Example (single component pattern)](https://bucatinicode.github.io/react-model-store/example/counter.html)
```tsx
import React from 'react';
import ReactDOM from 'react-dom';
import { Model, useModel } from 'react-model-store';

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

ReactDOM.render(<Counter />, document.getElementById('root'));
```

#### [Todo Example (model provider pattern)](https://bucatinicode.github.io/react-model-store/example/todo.html)

```tsx
import React from 'react';
import ReactDOM from 'react-dom';
import {
  Model,
  createStore,
  useStore,
  useModel,
} from 'react-model-store';

interface Todo {
  key: number;
  text: string;
}

class ControlModel extends Model {
  textInput = this.ref<HTMLInputElement>();
  onAddClick = this.event();
  onKeyPress = this.event<React.KeyboardEvent<HTMLInputElement>>();

  get text(): string {
    return this.textInput.current!.value;
  }

  refresh(): void {
    this.textInput.current!.value = '';
    this.textInput.current!.focus();
  }
}

class LogicModel extends Model {
  private control: ControlModel;
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
  todo: Todo;
  onRemoveClick: () => void;

  constructor(todo: Todo) {
    super();
    this.todo = todo;
    const { logic } = this.consume(RootModelStore);
    this.onRemoveClick = logic.remove.bind(logic, todo.key);
  }
}

const RootModelStore = createStore(RootModel);

const ControlPanel = () => {
  const {
    control: { textInput, onAddClick, onKeyPress },
  } = useStore(RootModelStore);
  return (
    <div>
      <input type='text' ref={textInput} onKeyPress={onKeyPress} />
      <button onClick={onAddClick}>Add</button>
    </div>
  );
};

const TodoItem = (props: { todo: Todo }) => {
  const {
    todo: { text },
    onRemoveClick,
  } = useModel(TodoModel, props.todo);
  return (
    <li>
      <button onClick={onRemoveClick}>Remove</button>
      <span>{text}</span>
    </li>
  );
};

ReactDOM.render(  
  <RootModelStore.Provider>
    <div>
      <ControlPanel />
      <ul>
        <RootModelStore.Consumer>
          {({ logic: { todos } }) =>
            todos.map(todo => (
              <li>
                <TodoItem key={todo.key} todo={todo} />
              </li>
            ))
          }
        </RootModelStore.Consumer>
      </ul>
    </div>
  </RootModelStore.Provider>,
  document.getElementById('root')
);
```

#### [Timer Example (high frequency re-render pattern)](https://bucatinicode.github.io/react-model-store/example/timer.html)

```tsx
import React from 'react';
import ReactDOM from 'react-dom';
import {
  Model,
  createStore,
  useStore,
  useModel,
} from 'react-model-store';

class RootModel extends Model {
  // RootModelStore.Provider component is re-rendered when this state is changed.
  running = this.state(false);

  resetButton = this.ref<HTMLButtonElement>();

  onReset = this.event();

  onToggle = this.event(() => {
    this.running = !this.running;
    this.resetButton.current!.disabled = this.running;
  });

  get toggleText(): string {
    return this.running ? 'Stop' : 'Start';
  }
}

const RootModelStore = createStore(RootModel);

class HighFrequencyTimerModel extends Model {
  root = this.consume(RootModelStore); // use RootModel

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

const HighFrequencyTimer = () => {
  const { time } = useModel(HighFrequencyTimerModel);
  return <span>{(time / 1000).toFixed(2)}</span>;
};

const Controller = () => {
  const { onReset, onToggle, toggleText, resetButton } = useStore(
    RootModelStore
  );
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
  <RootModelStore.Provider>
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
  </RootModelStore.Provider>,
  document.getElementById('root')
);
```
