import 'react-app-polyfill/ie11';
import 'react-app-polyfill/stable';

import React from 'react';
import ReactDOM from 'react-dom';
import { Model, createStore, useModel } from '../src/react-model-store';

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
  root = this.model(RootModelStore); // use RootModel

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
  const { onReset, onToggle, toggleText, resetButton } = useModel(
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
  <div>
    <h2>Timer Example</h2>
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
    </RootModelStore.Provider>
  </div>,
  document.getElementById('root')
);
