import React from 'react';
import {
  Model,
  PureModel,
  Accessor,
  Event,
  Action,
  Consumable,
} from '../../src/react-model-store.dev';

export class EmptyModel extends Model {}

export class EmptyPureModel extends PureModel {}

export class SingleStateModel extends Model {
  value = this.state(true);
}

export class SingleStatePureModel extends PureModel {
  value = this.state(true);
}

export class UndefinableStateModel extends Model {
  value = this.state<number | undefined>(0);
  valueFunc = this.stateFunc<number | undefined>(0);
}

class ChildModel {
  grandchild = new SingleStateModel();
  pureGrandchild = new SingleStatePureModel();
}

export class ParentModel {
  child = new ChildModel();
}

export class IllegalHookModel extends Model {
  value = this.stateFunc(() => true);
  illegalHook = React.useState(true);
}

export class HasInitailValueModel {
  readonly value: any;

  constructor(initialValue: any) {
    this.value = initialValue;
  }
}

export class MountModel extends Model {
  private _stage: number = 0;

  value = this.state(true);

  get isMounted(): boolean {
    return this.mounted;
  }

  get stage(): number {
    return this._stage;
  }

  protected onMount(): void {
    this._stage++;
  }

  protected onUnmount(): void {
    this._stage++;
  }
}

export class LowerModel<T extends {}> extends Model {
  readonly higher: T;

  constructor(higherStore: Consumable<T>) {
    super();
    this.higher = this.consume(higherStore);
  }
}

export class RefModel extends Model {
  readonly refInput = this.ref<HTMLInputElement>();
  readonly refValue = this.ref(true);
}

export class IllegalHookMethodModel extends Model {
  constructor() {
    super();
    this.illegalHook();
    this.illegalState();
  }

  illegalHook(): void {
    return this.hook(() => {
      React.useRef();
    });
  }

  illegalState(): Accessor<{}> {
    return this.stateFunc({});
  }
}

export class EventModel extends Model {
  count: number = 0;
  onClick = this.event(() => this.count++);
  onChange = this.event<React.ChangeEvent<HTMLInputElement>>();
}

export class ListenerModel extends Model {
  add<TArgs extends any[]>(
    event: Event<TArgs>,
    listener: Action<TArgs>
  ): boolean {
    return this.addListener(event, listener);
  }

  remove<TArgs extends any[]>(
    event: Event<TArgs>,
    listener: Action<TArgs>
  ): boolean {
    return this.removeListener(event, listener);
  }
}

export class NumberModel extends Model {
  n: number = this.state(0);
}
