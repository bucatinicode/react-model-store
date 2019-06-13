import 'react-app-polyfill/ie11';
import 'react-app-polyfill/stable';

import React from 'react';
import ReactDOM from 'react-dom';
import { Model, createStore, createComponent } from '../src/react-model-store';

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
  logic = this.use(Store).logic;
  todo: Todo;
  onRemoveClick: () => void;

  constructor(todo: Todo) {
    super();
    this.todo = todo;
    this.onRemoveClick = this.logic.remove.bind(this.logic, todo.key);
  }
}

const Store = createStore(RootModel);

const ControlPanel = () => {
  const {
    control: { textInput, onAddClick, onKeyPress },
  } = Store.use();

  return (
    <div>
      <input type='text' ref={textInput} onKeyPress={onKeyPress} />
      <button onClick={onAddClick}>Add</button>
    </div>
  );
};

const TodoItem = createComponent(
  TodoModel,
  ({ todo: { text }, onRemoveClick }) => (
    <li>
      <button onClick={onRemoveClick}>Remove</button>
      <span>{text}</span>
    </li>
  )
);

const App = () => (
  <Store.Provider>
    <div>
      <ControlPanel />
      <ul>
        <Store.Consumer>
          {({ logic: { todos } }) =>
            todos.map(todo => (
              <li>
                <TodoItem key={todo.key} initialValue={todo} />
              </li>
            ))
          }
        </Store.Consumer>
      </ul>
    </div>
  </Store.Provider>
);

ReactDOM.render(
  <div>
    <h2>Todo Example</h2>
    <App />
  </div>,
  document.getElementById('root')
);
