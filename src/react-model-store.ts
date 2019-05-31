import React from 'react';

// START DEVELOPMENT BLOCK

const __DEV__ = (window as any).__DEV__;

// END DEVELOPMENT BLOCK

export type Accessor<T extends any> = (() => T) & ((value: T) => void);
export type Action<TArgs extends any[] = []> = (...args: TArgs) => void;
export interface EventHandler<TArgs extends any[]> {
  addListener(model: ModelBase, listener: Action<TArgs>): void;
}
export type Event<TArgs extends any[]> = Action<TArgs> & EventHandler<TArgs>;

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
}

const metaStore = new Map<{}, Meta>();
const current = {
  meta: null as Meta | null,
};
const removeListenerStore = new Map<ModelBase, Action[]>();

// START DEVELOPMENT BLOCK

export const __META__: any = {};

if (__DEV__) {
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
    removeListenerStore: {
      value: removeListenerStore,
    },
  });
}

// END DEVELOPMENT BLOCK

function createEvent<TArgs extends any[]>(): Event<TArgs> {
  const listeners = new Set<Action<TArgs>>();

  function event(...args: TArgs): void {
    listeners.forEach(listener => listener(...args));
  }

  function addListener(model: ModelBase, listener: Action<TArgs>): void {
    if (!model.mounted) {
      throw new Error('Unmounted model objects cannot add event listener');
    }
    const wrapper = (...args: TArgs) => listener(...args);
    listeners.add(wrapper);
    let removeListeners = removeListenerStore.get(model);
    if (removeListeners === undefined) {
      removeListenerStore.set(model, (removeListeners = []));
    }
    removeListeners.push(() => listeners.delete(wrapper));
  }

  const handler = {};

  Object.defineProperty(handler, 'addListener', {
    value: addListener,
    enumerable: true,
  });

  Object.defineProperties(event, {
    addListener: {
      value: addListener,
      enumerable: true,
    },
    _handler: {
      value: handler,
    },
  });

  // START DEVELOPMENT BLOCK

  if (__DEV__) {
    Object.defineProperty(event, '_eventListeners', {
      value: listeners,
    });
  }

  // END DEVELOPMENT BLOCK

  return event as Event<TArgs>;
}

function createStateAccessor<T extends any>(
  meta: Meta,
  initialValue: T | (() => T),
  finalizeRequired: boolean
): Accessor<T> {
  if (meta.finalized) {
    throw new Error(
      'createStateAccessor() must be called from constructors of classes that extend Model or PureModel'
    );
  }

  let state =
    typeof initialValue === 'function'
      ? (initialValue as () => T)()
      : initialValue;
  let setState = React.useState(state)[1];
  meta.hooks.push(() => (setState = React.useState(state)[1]));

  const getter = () => {
    return state;
  };
  const setter = (value: T) => {
    if (meta.mounted) {
      state = value;
      setState(state);
    }
  };
  const accessor = ((value?: T) =>
    value === undefined ? getter() : setter(value)) as Accessor<T>;
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
  private readonly _meta0: Meta;

  constructor() {
    if (!current.meta) {
      throw new Error(
        'Model constructors must be called from createModel argument of createStore() function.'
      );
    }
    this._meta0 = current.meta;
    this._meta0.mountEvents.push(() => this.onMount());
    this._meta0.unmountEvents.push(() => {
      this.onUnmount();
      const removeListeners = removeListenerStore.get(this);
      if (removeListeners !== undefined) {
        removeListenerStore.delete(this);
        removeListeners.forEach(removeListener => removeListener());
      }
    });

    // START DEVELOPMENT BLOCK

    if (__DEV__) {
      Object.defineProperty(this, '_meta', {
        value: this._meta0,
      });
    }

    // END DEVELOPMENT BLOCK
  }

  get mounted(): boolean {
    return this._meta0.mounted;
  }

  // tslint:disable-next-line: no-empty
  protected onMount(): void {}

  // tslint:disable-next-line: no-empty
  protected onUnmount(): void {}

  protected hook<T = void>(useHook: () => T): T {
    if (this._meta0.finalized) {
      throw new Error(
        'hook() must be called from constructors of Model classes'
      );
    }
    const result = useHook();
    this._meta0.hooks.push(useHook);
    return result;
  }

  protected use<TModel extends {}, TValue = void>(
    store: Store<TModel, TValue>
  ): TModel {
    return this.hook(() => store.use());
  }

  protected ref<T>(initialValue?: T): React.RefObject<T> {
    return this.hook(() =>
      React.useRef(initialValue === undefined ? null : initialValue)
    );
  }

  protected event<TArgs extends any[]>(listener?: Action<TArgs>): Event<TArgs> {
    const d = createEvent<TArgs>();
    if (listener) {
      d.addListener(this, listener);
    }
    return d;
  }

  protected handler<TArgs extends any[]>(
    event: Event<TArgs>
  ): EventHandler<TArgs> {
    return (event as any)._handler as EventHandler<TArgs>;
  }

  protected listen<TArgs extends any[]>(
    event: Event<TArgs> | EventHandler<TArgs>,
    listener: Action<TArgs>
  ): void {
    return event.addListener(this, listener);
  }
}

/**
 * PureModel can only use functional getter/setter.
 * In case of using React Hooks from constructor of derived classes,
 * React Hooks functions must be called through the use of hook function.
 */
export abstract class PureModel extends ModelBase {
  private readonly _meta1 = current.meta!;

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
   * @param initialValue an initial value or a function that returns it.
   */
  protected state<T extends any>(initialValue: T | (() => T)): Accessor<T> {
    return createStateAccessor(this._meta1, initialValue, false);
  }
}

/**
 * Model-based React Hooks wrapper.
 * In case of using React Hooks from constructor of derived classes,
 * React Hooks functions must be called through the use of hook() function.
 *
 * @example
 * class ComponentModel extends Model {
 *   message: string = this.state('initial state value');
 *
 *   update(newMessage: string): void {
 *     this.message = newMessage; // call setState()
 *   }
 * }
 */
export abstract class Model extends ModelBase {
  private readonly _meta1 = current.meta!;

  constructor() {
    super();
    this._meta1.models.push(this);
  }

  /**
   * This function must be called from constructor, and properties defined by this function must not be accessed from constructor.
   *
   * @example
   * class CounterModel extends Model {
   *   // state() must be used to define public state.
   *   count: number = this.state(0);
   *
   *   readonly increment = () => this.count = this.count + 1;
   * }
   *
   * @param initialValue an initial value or a function that returns it.
   */
  protected state<T extends any>(initialValue: T | (() => T)): T {
    return (createStateAccessor(
      this._meta1,
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
   * @param initialValue an initial value or a function that returns it.
   */
  protected stateFunc<T extends any>(initialValue: T | (() => T)): Accessor<T> {
    return createStateAccessor(this._meta1, initialValue, false);
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

function deceiveHooks<TModel extends {}>(createModel: () => TModel): TModel {
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
    if (!model || typeof model !== 'object' || metaStore.has(model)) {
      throw new Error('createModel() must return a new object');
    }
    metaStore.set(model, meta);
    finalize(meta);
    meta.finalized = true;
    ref.current = model;
  } else {
    meta = metaStore.get(ref.current)!;
    meta.hooks.forEach(useHook => useHook());
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

export interface StoreProviderProps<TValue = void> {
  initialValue?: TValue;
  children: React.ReactNode;
}

export interface StoreConsumerProps<TModel extends {}> {
  children: (model: TModel) => React.ReactNode;
}

export interface Store<TModel extends {}, TValue = void> {
  readonly Provider: React.FunctionComponent<StoreProviderProps<TValue>>;
  readonly Consumer: React.FunctionComponent<StoreConsumerProps<TModel>>;
  use(): TModel;
}

export function createStore<TModel extends {}, TValue = void>(
  createModel: (initialValue?: TValue) => TModel
): Store<TModel, TValue> {
  const Context = React.createContext<Box<TModel> | null>(null);

  const Provider = (props: StoreProviderProps<TValue>) => {
    const model = deceiveHooks(() => createModel(props.initialValue));
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

  const use = () => {
    const box = React.useContext(Context);
    if (box === null) {
      throw new Error('Store.use() must be wrapped with <Store.Provider>');
    }
    return box.inner;
  };

  return { Provider, Consumer, use };
}
