import React from 'react';

export type Accessor<T extends any> = (() => T) & ((value: T) => void);
export type Action<TArgs extends any[] = []> = (...args: TArgs) => void;
export type Event<TArgs extends any[]> = Action<TArgs> & {
  add(listener: Action<TArgs>, dep?: ModelBase): boolean;
  remove(listener: Action<TArgs>): boolean;
  clear(): void;
};
export type ModelClass<TModel extends {}, TValue> = TValue extends void
  ? {
      new (): TModel;
    }
  : {
      new (initialValue: TValue): TModel;
    };
export type InferModel<
  TModelClass extends ModelClass<any, any>
> = TModelClass extends { new (initialValue?: any): infer T } ? T : never;
export type InferValue<
  TModelClass extends ModelClass<any, any>
> = TModelClass extends { new (): any }
  ? TModelClass extends { new (initialValue?: infer T): any }
    ? unknown extends T
      ? void
      : T | void
    : never
  : TModelClass extends { new (initialValue: infer T): any }
  ? T
  : never;

export type StoreProviderProps<TValue> = (TValue extends void
  ? {}
  : { initialValue: TValue }) & { children?: React.ReactNode };

export interface StoreConsumerProps<TModel extends {}> {
  children: (model: TModel) => React.ReactNode;
}

export interface Consumable<TModel extends {}> {
  consume(): TModel;
}

export type StoreProvider<TValue> = React.FunctionComponent<
  StoreProviderProps<TValue>
>;
export type StoreConsumer<TModel extends {}> = React.FunctionComponent<
  StoreConsumerProps<TModel>
> &
  Consumable<TModel>;

export interface Store<TModel extends {}, TValue> extends Consumable<TModel> {
  readonly Provider: StoreProvider<TValue>;
  readonly Consumer: StoreConsumer<TModel>;
}

interface Box<T> {
  inner: T;
}

class Meta {
  readonly models: ModelBase[] = [];
  finalized: boolean = false;
  mounted: boolean = true;
  readonly hooks: Action[] = [];
  readonly mountEvents: Action[] = [];
  readonly unmountEvents: Action[] = [];

  deceiveHooks(): void {
    this.hooks.forEach(useHook => {
      useHook();
    });
  }
}

const metaStore = new Map<{}, Meta>();
const current = {
  meta: null as Meta | null,
};
const listenerDependencyStore = new Map<
  ModelBase,
  Map<Action<any>, Event<any>>
>();

// START DEVELOPMENT BLOCK

export const __META__: any = {};

Object.defineProperties(__META__, {
  metaStore: {
    value: metaStore,
  },
  current: {
    value: current,
  },
  Meta: {
    value: Meta,
  },
  listenerDependencyStore: {
    value: listenerDependencyStore,
  },
});

// END DEVELOPMENT BLOCK

function isConsumable(source: any): boolean {
  return typeof source['consume'] === 'function';
}

function createEvent<TArgs extends any[]>(): Event<TArgs> {
  const listenerMap = new Map<Action<TArgs>, ModelBase | null>();

  function event(...args: TArgs): void {
    listenerMap.forEach((_, listener) => {
      listener(...args);
    });
  }

  function add(listener: Action<TArgs>, dep?: ModelBase): boolean {
    if (dep && !(dep as any).mounted) {
      throw new Error('Cannot add event listener to unmounted model objects');
    }
    if (listenerMap.has(listener)) {
      return false;
    }
    listenerMap.set(listener, dep === undefined ? null : dep);
    if (dep) {
      let map = listenerDependencyStore.get(dep);
      if (map === undefined) {
        listenerDependencyStore.set(dep, (map = new Map()));
      }
      map.set(listener, event as Event<TArgs>);
    }
    return true;
  }

  function remove(listener: Action<TArgs>): boolean {
    const dep = listenerMap.get(listener);
    if (dep === undefined) {
      return false;
    }
    listenerMap.delete(listener);
    if (dep) {
      listenerDependencyStore.get(dep)!.delete(listener);
    }
    return true;
  }

  function clear(): void {
    const listeners: Action<TArgs>[] = [];
    listenerMap.forEach((_, listener) => {
      listeners.push(listener);
    });
    listeners.forEach(listener => {
      remove(listener);
    });
  }

  Object.defineProperties(event, {
    add: {
      value: add,
    },
    remove: {
      value: remove,
    },
    clear: {
      value: clear,
    },
  });

  // START DEVELOPMENT BLOCK

  Object.defineProperty(event, '_listenerMap', {
    value: listenerMap,
  });

  // END DEVELOPMENT BLOCK

  return event as Event<TArgs>;
}

function createStateAccessor<T extends any>(
  meta: Meta,
  initialValue: T,
  finalizeRequired: boolean
): Accessor<T> {
  if (meta.finalized) {
    throw new Error(
      'createStateAccessor() must be called from constructors of classes that extend ModelBase'
    );
  }

  let state = initialValue;
  let setState = React.useState(state)[1];
  meta.hooks.push(() => {
    setState = React.useState(state)[1];
  });

  const getter = () => state;
  const setter = (value: T) => {
    if (meta.mounted) {
      state = value;
      setState(state);
    }
  };

  function accessor(value?: T): any {
    return arguments.length === 0 ? getter() : setter(value!);
  }

  if (finalizeRequired) {
    Object.defineProperties(accessor, {
      _finalizeRequired: { value: true },
      _getter: { value: getter },
      _setter: { value: setter },
    });
  }
  return accessor;
}

export abstract class ModelBase {
  private readonly _meta: Meta;

  constructor() {
    if (!current.meta) {
      throw new Error(
        'ModelBase constructor must be called from useModel() or Provider of Store created by createStore().'
      );
    }
    this._meta = current.meta;
    this._meta.mountEvents.push(() => {
      this.onMount();
    });
    this._meta.unmountEvents.push(() => {
      this.onUnmount();
      const removeListenerMap = listenerDependencyStore.get(this);
      if (removeListenerMap !== undefined) {
        const targets: [Event<any>, Action<any>][] = [];
        removeListenerMap.forEach((eventHandler, listener) =>
          targets.push([eventHandler, listener])
        );
        targets.forEach(([eventHandler, listener]) => {
          eventHandler.remove(listener);
        });
        listenerDependencyStore.delete(this);
      }
    });
  }

  protected get mounted(): boolean {
    return this._meta.mounted;
  }

  // tslint:disable-next-line: no-empty
  protected onMount(): void {}

  // tslint:disable-next-line: no-empty
  protected onUnmount(): void {}

  protected hook<T = void>(useHook: () => T): T {
    if (this._meta.finalized) {
      throw new Error(
        'hook() must be called from the constructor of classes that extend ModelBase'
      );
    }
    const result = useHook();
    this._meta.hooks.push(useHook);
    return result;
  }

  protected model<TModel extends {}>(
    consumable: Store<TModel, any> | StoreConsumer<TModel> | Consumable<TModel>
  ): TModel;

  protected model<TModelClass extends ModelClass<any, void>>(
    modelClass: TModelClass
  ): InferModel<TModelClass>;

  protected model<TModelClass extends ModelClass<any, any>>(
    modelClass: TModelClass,
    initialValue: InferValue<TModelClass>
  ): InferModel<TModelClass>;

  protected model<TModel extends {}>(
    source: ModelClass<TModel, any> | Consumable<TModel>,
    initialValue?: any
  ): TModel {
    if (isConsumable(source)) {
      const consumable = source as Consumable<TModel>;
      return this.hook(() => consumable.consume());
    } else {
      return arguments.length > 1
        ? new (source as ModelClass<TModel, any>)(initialValue)
        : new (source as ModelClass<TModel, void>)();
    }
  }

  protected ref<T>(initialValue?: T): React.RefObject<T> {
    return arguments.length === 0
      ? React.createRef()
      : ({ current: initialValue } as React.RefObject<T>);
  }

  protected event(): Event<[]>;

  protected event<TArgs extends any[]>(listener?: Action<TArgs>): Event<TArgs>;

  protected event<T>(listener?: Action<[T]>): Event<[T]>;
  protected event<T1, T2>(listener?: Action<[T1, T2]>): Event<[T1, T2]>;
  protected event<T1, T2, T3>(
    listener?: Action<[T1, T2, T3]>
  ): Event<[T1, T2, T3]>;
  protected event<T1, T2, T3, T4>(
    listener?: Action<[T1, T2, T3, T4]>
  ): Event<[T1, T2, T3, T4]>;
  protected event<T1, T2, T3, T4, T5>(
    listener?: Action<[T1, T2, T3, T4, T5]>
  ): Event<[T1, T2, T3, T4, T5]>;
  protected event<T1, T2, T3, T4, T5, T6>(
    listener?: Action<[T1, T2, T3, T4, T5, T6]>
  ): Event<[T1, T2, T3, T4, T5, T6]>;
  protected event<T1, T2, T3, T4, T5, T6, T7>(
    listener?: Action<[T1, T2, T3, T4, T5, T6, T7]>
  ): Event<[T1, T2, T3, T4, T5, T6, T7]>;
  protected event<T1, T2, T3, T4, T5, T6, T7, T8>(
    listener?: Action<[T1, T2, T3, T4, T5, T6, T7, T8]>
  ): Event<[T1, T2, T3, T4, T5, T6, T7, T8]>;

  protected event(listener?: Action<any[]>): Event<any[]> {
    const e = createEvent<any[]>();
    if (listener) {
      e.add(listener, this);
    }
    return e;
  }

  protected addListener<TArgs extends any[]>(
    event: Event<TArgs>,
    listener: Action<TArgs>
  ): boolean {
    return event.add(listener, this);
  }

  protected removeListener<TArgs extends any[]>(
    event: Event<TArgs>,
    listener: Action<TArgs>
  ): boolean {
    return event.remove(listener);
  }
}

/**
 * PureModel can only use functional state accessors.
 * In case model objects are created frequently,
 * PureModel objects are created at a lower cost than Model objects.
 */
export abstract class PureModel extends ModelBase {
  /**
   * @example
   * class CounterModel extends PureModel {
   *   // state() is used to define functional state getter/setter.
   *   private readonly _count= this.state<number>(0);
   *
   *   get count(): number {
   *     return this._count();
   *   }
   *
   *   readonly increment = () => this._count(this.count + 1);
   * }
   *
   * @param initialValue
   */
  protected state<T extends any>(initialValue: T): Accessor<T> {
    return createStateAccessor(
      (this as any)._meta as Meta,
      initialValue,
      false
    );
  }
}

/**
 * Model-based React Hooks wrapper.
 * In case of using React Hooks from constructor of derived classes,
 * React Hooks functions must be called through the use of useHook() function.
 *
 * @example
 * class ComponentModel extends Model {
 *   // this.state() method is React.useState() wrapper.
 *   message: string = this.state('initial state value');
 *
 *   update(newMessage: string): void {
 *     this.message = newMessage; // call setState()
 *   }
 * }
 */
export abstract class Model extends ModelBase {
  constructor() {
    super();
    ((this as any)._meta as Meta).models.push(this);
  }

  /**
   * This function must be called from constructor, and properties defined by this function must not be accessed from constructor.
   *
   * @example
   * class CounterModel extends Model {
   *   // State values can be accessed as variable after Model constructor is called.
   *   count: number = this.state(0);
   *
   *   readonly increment = () => this.count = this.count + 1;
   * }
   *
   * @param initialValue
   */
  protected state<T extends any>(initialValue: T): T {
    return (createStateAccessor(
      (this as any)._meta as Meta,
      initialValue,
      true
    ) as unknown) as T;
  }

  /**
   * @example
   * class CounterModel extends Model {
   *   // stateFunc() is used to define functional state getter/setter.
   *   private readonly _count = this.stateFunc<number>(0);
   *
   *   get count(): number {
   *     return this._count();
   *   }
   *
   *   readonly increment = () => this._count(this.count + 1);
   * }
   *
   * @param initialValue
   */
  protected stateFunc<T extends any>(initialValue: T): Accessor<T> {
    return createStateAccessor(
      (this as any)._meta as Meta,
      initialValue,
      false
    );
  }
}

function finalize(meta: Meta): void {
  for (const model of meta.models) {
    Object.entries(model).forEach(([k, v]) => {
      if (typeof v === 'function' && v._finalizeRequired === true) {
        Object.defineProperty(model, k, {
          get: v._getter,
          set: v._setter,
        });
      }
    });
  }
}

function resolveModel<TModel extends {}>(createModel: () => TModel): TModel {
  const ref = React.useRef<TModel>();
  let meta: Meta;
  if (!ref.current) {
    let model: TModel;
    current.meta = meta = new Meta();
    try {
      model = createModel();
    } finally {
      current.meta = null;
    }
    metaStore.set(model, meta);
    finalize(meta);
    meta.finalized = true;
    ref.current = model;
  } else {
    meta = metaStore.get(ref.current)!;
    meta.deceiveHooks();
  }

  React.useEffect(() => {
    meta.mountEvents.forEach(onMount => onMount());
    return () => {
      for (let i = meta.unmountEvents.length - 1; i >= 0; i--) {
        meta.unmountEvents[i]();
      }
      meta.mounted = false;
      metaStore.delete(ref.current!);
    };
  }, []);

  return ref.current!;
}

/**
 * Create a model store that wrapped Context API.
 * It is useful when nested components need to reference the model.
 * Every time <Store.Provider> is mounted, Store creates a model object.
 * <Store.Provider> provides the model object to nested components.
 * Then <Store.Consumer> or useModel(Store) can consume the model object.
 * @param modelClass
 * @returns Store object
 */
export function createStore<TModelClass extends ModelClass<any, any>>(
  modelClass: TModelClass
): Store<InferModel<TModelClass>, InferValue<TModelClass>> {
  type TModel = InferModel<TModelClass>;
  type TValue = InferValue<TModelClass>;
  const Context = React.createContext<Box<TModel> | null>(null);

  const Provider = (props: StoreProviderProps<TValue>) => {
    const createModel =
      'initialValue' in props
        ? () =>
            new (modelClass as ModelClass<TModel, any>)(
              (props as { initialValue: TValue }).initialValue
            )
        : () => new (modelClass as ModelClass<TModel, void>)();
    const model = resolveModel(createModel);
    return React.createElement(
      Context.Provider,
      { value: { inner: model } },
      props.children
    );
  };

  const Consumer = (props: StoreConsumerProps<TModel>) => {
    const consumerProps = {
      children(box: Box<TModel> | null): React.ReactNode {
        if (box === null) {
          throw new Error(
            '<Store.Consumer> must be wrapped with <Store.Provider>'
          );
        }
        return props.children(box.inner);
      },
    };
    return React.createElement(Context.Consumer, consumerProps);
  };

  const consume = () => {
    const box = React.useContext(Context);
    if (box === null) {
      throw new Error(
        'Consumable.consume() must be wrapped with <Store.Provider>'
      );
    }
    return box.inner;
  };

  Object.defineProperties(Consumer, {
    consume: { value: consume },
  });

  const store = {};

  Object.defineProperties(store, {
    Provider: { value: Provider },
    Consumer: { value: Consumer },
    consume: { value: consume },
  });

  return store as Store<TModel, TValue>;
}

/**
 * useModel returns a model object provided by Store.Provider element in functional component.
 * @param consumable is an object that implements Consumable interface.
 * @returns model object
 */
export function useModel<TModel extends {}>(
  consumable: Store<TModel, any> | StoreConsumer<TModel> | Consumable<TModel>
): TModel;

/**
 * useModel returns a model object related to functional component.
 * @param modelClass is model class constructor
 * @returns model object
 */
export function useModel<TModelClass extends ModelClass<any, void>>(
  modelClass: TModelClass
): InferModel<TModelClass>;

/**
 * useModel returns a model object related to functional component.
 * @param modelClass is model class constructor
 * @param initialValue is passed to the model class constructor.
 * @returns model object
 */
export function useModel<TModelClass extends ModelClass<any, any>>(
  modelClass: TModelClass,
  initialValue: InferValue<TModelClass>
): InferModel<TModelClass>;

export function useModel<TModel extends {}>(
  source: ModelClass<TModel, any> | Consumable<TModel>,
  initialValue?: any
): TModel {
  if (isConsumable(source)) {
    const consumable = source as Consumable<TModel>;
    return consumable.consume();
  } else {
    const createModel =
      arguments.length > 1
        ? () => new (source as ModelClass<TModel, any>)(initialValue)
        : () => new (source as ModelClass<TModel, void>)();
    return resolveModel(createModel);
  }
}
