import React from 'react';
import { Model, PureModel, Store, Accessor } from '../../src/react-model-store';

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

  constructor(higherStore: Store<T>) {
    super();
    this.higher = this.use(higherStore);
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
  private readonly _count = this.stateFunc<number>(0);
  readonly addEvent = this.event<[number]>((n: number) =>
    this._count(this.count + n)
  );
  readonly addEventHandler = this.handler(this.addEvent);
  get count(): number {
    return this._count();
  }
}

export class ListenModel extends Model {
  private _lastAdded: number = 0;
  private _negativeCount: number = 0;

  readonly eventModel: EventModel;

  constructor(eventStore: Store<EventModel>) {
    super();
    this.eventModel = this.use(eventStore);
    this.listen(this.eventModel.addEvent, this.onAddToLastAdded);
    this.listen(this.eventModel.addEventHandler, this.onAddToSubtract);
  }

  get lastAdded(): number {
    return this._lastAdded;
  }
  get negativeCount(): number {
    return this._negativeCount;
  }
  readonly onAddToLastAdded = (n: number) => (this._lastAdded = n);
  readonly onAddToSubtract = (n: number) => (this._negativeCount -= n);
  add(n: number): void {
    this.eventModel.addEvent(n);
  }
  addListener(): void {
    this.listen(this.eventModel.addEventHandler, this.onAddToLastAdded);
  }
}
