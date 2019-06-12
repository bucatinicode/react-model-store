import React from 'react';
export declare type Accessor<T extends any> = (() => T) & ((value: T) => void);
export declare type Action<TArgs extends any[] = []> = (...args: TArgs) => void;
export declare type Event<TArgs extends any[]> = Action<TArgs> & {
    add(listener: Action<TArgs>, dep?: ModelBase): boolean;
    remove(listener: Action<TArgs>): boolean;
    clear(): void;
};
export interface ModelClass<TModel extends {}, TValue = void> {
    new (initialValue: TValue): TModel;
}
export declare abstract class ModelBase {
    private readonly _meta;
    constructor();
    protected readonly mounted: boolean;
    protected onMount(): void;
    protected onUnmount(): void;
    protected hook<T = void>(useHook: () => T): T;
    protected use<TModel extends {}, TValue = void>(store: Store<TModel, TValue>): TModel;
    protected ref<T>(initialValue?: T): React.RefObject<T>;
    protected event<TArgs extends any[]>(listener?: Action<TArgs>): Event<TArgs>;
    protected addListener<TArgs extends any[]>(event: Event<TArgs>, listener: Action<TArgs>): boolean;
    protected removeListener<TArgs extends any[]>(event: Event<TArgs>, listener: Action<TArgs>): boolean;
}
/**
 * PureModel can only use functional getter/setter.
 * In case of using React Hooks from constructor of derived classes,
 * React Hooks functions must be called through the use of hook function.
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
 * React Hooks functions must be called through the use of hook() function.
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
export declare function createStore<TModel extends {}, TValue = void>(modelClass: ModelClass<TModel, TValue>): Store<TModel, TValue>;
export declare type ModelComponentProps<TProps = {}, TValue = void> = TProps & {
    initialValue?: TValue;
};
/**
 * Create a function component that references a model object created by createModel argument.
 * It is useful when the model is referenced by only a created component.
 * @param createModel
 * @param render
 * @returns A function component
 */
export declare function createComponent<TModel extends {}, TProps = {}, TValue = void>(modelClass: ModelClass<TModel, TValue>, render: (model: TModel, props: TProps, context?: any) => React.ReactElement | null): React.FunctionComponent<ModelComponentProps<TProps, TValue>>;
//# sourceMappingURL=react-model-store.d.ts.map