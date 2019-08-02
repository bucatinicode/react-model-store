'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var React = _interopDefault(require('react'));

/**
 * @license ReactModelStore v0.4.0-beta1
 * (c) 2019 bucatini
 * License: MIT
 */

var Meta = function Meta() {
  this.models = [];
  this.finalized = false;
  this.mounted = true;
  this.hooks = [];
  this.mountEvents = [];
  this.unmountEvents = [];
};

Meta.prototype.deceiveHooks = function deceiveHooks () {
  this.hooks.forEach(function (useHook) {
    useHook();
  });
};

var metaStore = new Map();
var current = {
  meta: null
};
var listenerDependencyStore = new Map();

function createEvent() {
  var listenerMap = new Map();

  function event() {
    var args = [], len = arguments.length;
    while ( len-- ) args[ len ] = arguments[ len ];

    listenerMap.forEach(function (_, listener) {
      listener.apply(void 0, args);
    });
  }

  function add(listener, dep) {
    if (dep && !dep.mounted) {
      throw new Error('Cannot add event listener to unmounted model objects');
    }

    if (listenerMap.has(listener)) {
      return false;
    }

    listenerMap.set(listener, dep === undefined ? null : dep);

    if (dep) {
      var map = listenerDependencyStore.get(dep);

      if (map === undefined) {
        listenerDependencyStore.set(dep, map = new Map());
      }

      map.set(listener, event);
    }

    return true;
  }

  function remove(listener) {
    var dep = listenerMap.get(listener);

    if (dep === undefined) {
      return false;
    }

    listenerMap.delete(listener);

    if (dep) {
      listenerDependencyStore.get(dep).delete(listener);
    }

    return true;
  }

  function clear() {
    var listeners = [];
    listenerMap.forEach(function (_, listener) {
      listeners.push(listener);
    });
    listeners.forEach(function (listener) {
      remove(listener);
    });
  }

  Object.defineProperties(event, {
    add: {
      value: add
    },
    remove: {
      value: remove
    },
    clear: {
      value: clear
    }
  });
  return event;
}

function createStateAccessor(meta, initialValue, finalizeRequired) {
  if (meta.finalized) {
    throw new Error('createStateAccessor() must be called from constructors of classes that extend ModelBase');
  }

  var state = typeof initialValue === 'function' ? initialValue() : initialValue;
  var setState = React.useState(state)[1];
  meta.hooks.push(function () {
    setState = React.useState(state)[1];
  });

  var getter = function () { return state; };

  var setter = function (value) {
    if (meta.mounted) {
      state = value;
      setState(state);
    }
  };

  function accessor(value) {
    return arguments.length === 0 ? getter() : setter(value);
  }

  if (finalizeRequired) {
    Object.defineProperties(accessor, {
      _finalizeRequired: {
        value: true
      },
      _getter: {
        value: getter
      },
      _setter: {
        value: setter
      }
    });
  }

  return accessor;
}

var ModelBase = function ModelBase() {
  var this$1 = this;

  if (!current.meta) {
    throw new Error('ModelBase constructor must be called from Provider of Store created by createStore() or Component created by createComponent().');
  }

  this._meta = current.meta;

  this._meta.mountEvents.push(function () {
    this$1.onMount();
  });

  this._meta.unmountEvents.push(function () {
    this$1.onUnmount();
    var removeListenerMap = listenerDependencyStore.get(this$1);

    if (removeListenerMap !== undefined) {
      var targets = [];
      removeListenerMap.forEach(function (eventHandler, listener) { return targets.push([eventHandler, listener]); });
      targets.forEach(function (ref) {
        var eventHandler = ref[0];
        var listener = ref[1];

        eventHandler.remove(listener);
      });
      listenerDependencyStore.delete(this$1);
    }
  });
};

var prototypeAccessors = { mounted: { configurable: true } };

prototypeAccessors.mounted.get = function () {
  return this._meta.mounted;
}; // tslint:disable-next-line: no-empty


ModelBase.prototype.onMount = function onMount () {}; // tslint:disable-next-line: no-empty


ModelBase.prototype.onUnmount = function onUnmount () {};

ModelBase.prototype.hook = function hook (useHook) {
  if (this._meta.finalized) {
    throw new Error('hook() must be called from the constructor of classes that extend ModelBase');
  }

  var result = useHook();

  this._meta.hooks.push(useHook);

  return result;
};

ModelBase.prototype.consume = function consume (consumable) {
  return this.hook(function () { return consumable.consume(); });
};

ModelBase.prototype.ref = function ref (initialValue) {
  return arguments.length === 0 ? React.createRef() : {
    current: initialValue
  };
};

ModelBase.prototype.event = function event (listener) {
  var e = createEvent();

  if (listener) {
    e.add(listener, this);
  }

  return e;
};

ModelBase.prototype.addListener = function addListener (event, listener) {
  return event.add(listener, this);
};

ModelBase.prototype.removeListener = function removeListener (event, listener) {
  return event.remove(listener);
};

Object.defineProperties( ModelBase.prototype, prototypeAccessors );
/**
 * PureModel can only use functional state accessors.
 * In case model objects are created frequently,
 * PureModel objects are created at a lower cost than Model objects.
 */

var PureModel = /*@__PURE__*/(function (ModelBase) {
  function PureModel () {
    ModelBase.apply(this, arguments);
  }

  if ( ModelBase ) PureModel.__proto__ = ModelBase;
  PureModel.prototype = Object.create( ModelBase && ModelBase.prototype );
  PureModel.prototype.constructor = PureModel;

  PureModel.prototype.state = function state (initialValue) {
    return createStateAccessor(this._meta, initialValue, false);
  };

  return PureModel;
}(ModelBase));
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

var Model = /*@__PURE__*/(function (ModelBase) {
  function Model() {
    ModelBase.call(this);

    this._meta.models.push(this);
  }

  if ( ModelBase ) Model.__proto__ = ModelBase;
  Model.prototype = Object.create( ModelBase && ModelBase.prototype );
  Model.prototype.constructor = Model;
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
   * @param initialValue an initial value or a function that returns it.
   */


  Model.prototype.state = function state (initialValue) {
    return createStateAccessor(this._meta, initialValue, true);
  };
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


  Model.prototype.stateFunc = function stateFunc (initialValue) {
    return createStateAccessor(this._meta, initialValue, false);
  };

  return Model;
}(ModelBase));

function finalize(meta) {
  var loop = function () {
    var model = list[i];

    Object.entries(model).forEach(function (ref) {
      var k = ref[0];
      var v = ref[1];

      if (typeof v === 'function' && v._finalizeRequired === true) {
        Object.defineProperty(model, k, {
          get: v._getter,
          set: v._setter
        });
      }
    });
  };

  for (var i = 0, list = meta.models; i < list.length; i += 1) loop();
}

function resolveModel(createModel) {
  var ref = React.useRef();
  var meta;

  if (!ref.current) {
    var model;
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
    meta = metaStore.get(ref.current);
    meta.deceiveHooks();
  }

  React.useEffect(function () {
    meta.mountEvents.forEach(function (onMount) { return onMount(); });
    return function () {
      for (var i = meta.unmountEvents.length - 1; i >= 0; i--) {
        meta.unmountEvents[i]();
      }

      meta.mounted = false;
      metaStore.delete(ref.current);
    };
  }, []);
  return ref.current;
}
/**
 * Create a model store that wrapped Context API.
 * It is useful when nested components need to reference the model.
 * Every time <Store.Provider> is mounted, Store creates a model object.
 * <Store.Provider> provides the model object to nested components.
 * Then <Store.Consumer> or useStore(Store) can consume the model object.
 * @param modelClass
 * @returns Store
 */


function createStore(modelClass) {
  var Context = React.createContext(null);

  var Provider = function (props) {
    var createModel = Object.prototype.hasOwnProperty.call(props, 'initialValue') ? function () { return new modelClass(props.initialValue); } : function () { return new modelClass(); };
    var model = resolveModel(createModel);
    return React.createElement(Context.Provider, {
      value: {
        inner: model
      }
    }, props.children);
  };

  var Consumer = function (props) {
    var consumerProps = {
      children: function children(box) {
        if (box === null) {
          throw new Error('<Store.Consumer> must be wrapped with <Store.Provider>');
        }

        return props.children(box.inner);
      }

    };
    return React.createElement(Context.Consumer, consumerProps);
  };

  var consume = function () {
    var box = React.useContext(Context);

    if (box === null) {
      throw new Error('Consumable.consume() must be wrapped with <Store.Provider>');
    }

    return box.inner;
  };

  Object.defineProperties(Consumer, {
    consume: {
      value: consume
    }
  });
  var store = {};
  Object.defineProperties(store, {
    Provider: {
      value: Provider
    },
    Consumer: {
      value: Consumer
    },
    consume: {
      value: consume
    }
  });
  return store;
}
function useStore(consumable) {
  return consumable.consume();
}
/**
 * useModel returns a model object related to functional component.
 * @param modelClass is model class constructor
 * @param initialValue is passed to the model class constructor.
 * @returns model object
 */

function useModel(modelClass, initialValue) {
  var createModel = arguments.length > 1 ? function () { return new modelClass(initialValue); } : function () { return new modelClass(); };
  return resolveModel(createModel);
}

exports.ModelBase = ModelBase;
exports.PureModel = PureModel;
exports.Model = Model;
exports.createStore = createStore;
exports.useStore = useStore;
exports.useModel = useModel;
//# sourceMappingURL=react-model-store.js.map
