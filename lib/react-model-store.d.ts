/**
 * @license ReactModelStore v0.4.0-beta2
 * (c) 2019 bucatini
 * License: MIT
 */
import React from 'react';
export declare type Accessor<T extends any> = (() => T) & ((value: T) => void);
export declare type Action<TArgs extends any[] = []> = (...args: TArgs) => void;
export declare type Event<TArgs extends any[]> = Action<TArgs> & {
    add(listener: Action<TArgs>, dep?: ModelBase): boolean;
    remove(listener: Action<TArgs>): boolean;
    clear(): void;
};
export declare type ModelClass<TModel extends {}, TValue> = TValue extends void ? {
    new (): TModel;
} : {
    new (initialValue: TValue): TModel;
};
declare type InitialValue<TValue> = TValue extends void ? {} : unknown extends TValue ? {
    initialValue?: TValue;
} : {
    initialValue: TValue;
};
export declare type StoreProviderProps<TValue = void> = InitialValue<TValue> & {
    children?: React.ReactNode;
};
export interface StoreConsumerProps<TModel extends {}> {
    children: (model: TModel) => React.ReactNode;
}
export interface Consumable<TModel extends {}> {
    consume(): TModel;
}
export declare type StoreProvider<TValue = void> = React.FunctionComponent<StoreProviderProps<TValue>>;
export declare type StoreConsumer<TModel extends {}> = React.FunctionComponent<StoreConsumerProps<TModel>> & Consumable<TModel>;
export interface Store<TModel extends {}, TValue = void> extends Consumable<TModel> {
    readonly Provider: StoreProvider<TValue>;
    readonly Consumer: StoreConsumer<TModel>;
}
export declare abstract class ModelBase {
    private readonly _meta;
    constructor();
    protected readonly mounted: boolean;
    protected onMount(): void;
    protected onUnmount(): void;
    protected hook<T = void>(useHook: () => T): T;
    protected model<TModel extends {}, TValue>(modelClass: ModelClass<TModel, TValue>, initialValue: TValue): TModel;
    protected model<TModel extends {}>(consubable: Store<TModel, any> | StoreConsumer<TModel> | Consumable<TModel>): TModel;
    protected ref<T>(initialValue?: T): React.RefObject<T>;
    protected event(): Event<[]>;
    protected event<TArgs extends any[]>(listener?: Action<TArgs>): Event<TArgs>;
    protected event<T>(listener?: Action<[T]>): Event<[T]>;
    protected event<T1, T2>(listener?: Action<[T1, T2]>): Event<[T1, T2]>;
    protected event<T1, T2, T3>(listener?: Action<[T1, T2, T3]>): Event<[T1, T2, T3]>;
    protected event<T1, T2, T3, T4>(listener?: Action<[T1, T2, T3, T4]>): Event<[T1, T2, T3, T4]>;
    protected event<T1, T2, T3, T4, T5>(listener?: Action<[T1, T2, T3, T4, T5]>): Event<[T1, T2, T3, T4, T5]>;
    protected event<T1, T2, T3, T4, T5, T6>(listener?: Action<[T1, T2, T3, T4, T5, T6]>): Event<[T1, T2, T3, T4, T5, T6]>;
    protected event<T1, T2, T3, T4, T5, T6, T7>(listener?: Action<[T1, T2, T3, T4, T5, T6, T7]>): Event<[T1, T2, T3, T4, T5, T6, T7]>;
    protected event<T1, T2, T3, T4, T5, T6, T7, T8>(listener?: Action<[T1, T2, T3, T4, T5, T6, T7, T8]>): Event<[T1, T2, T3, T4, T5, T6, T7, T8]>;
    protected addListener<TArgs extends any[]>(event: Event<TArgs>, listener: Action<TArgs>): boolean;
    protected removeListener<TArgs extends any[]>(event: Event<TArgs>, listener: Action<TArgs>): boolean;
}
/**
 * PureModel can only use functional state accessors.
 * In case model objects are created frequently,
 * PureModel objects are created at a lower cost than Model objects.
 */
export declare abstract class PureModel extends ModelBase {
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
    protected state<T extends any>(initialValue: T | (() => T)): Accessor<T>;
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
export declare abstract class Model extends ModelBase {
    constructor();
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
    protected state<T extends any>(initialValue: T | (() => T)): T;
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
    protected stateFunc<T extends any>(initialValue: T | (() => T)): Accessor<T>;
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
export declare function createStore<TModel extends {}, TValue>(modelClass: ModelClass<TModel, TValue>): Store<TModel, TValue>;
/**
 * useModel returns a model object provided by Store.Provider element in functional component.
 * @param consumable is an object that implements Consumable interface.
 * @returns model object
 */
export declare function useModel<TModel extends {}>(consumable: Store<TModel, any> | StoreConsumer<TModel> | Consumable<TModel>): TModel;
/**
 * useModel returns a model object related to functional component.
 * @param modelClass is model class constructor
 * @param initialValue is passed to the model class constructor.
 * @returns model object
 */
export declare function useModel<TModel extends {}, TValue>(modelClass: ModelClass<TModel, TValue>, initialValue: TValue): TModel;
export {};
//# sourceMappingURL=react-model-store.d.ts.map