import { __META__, Action, ModelBase } from '../../src/react-model-store';

export interface Meta {
  readonly models: ModelBase[];
  readonly finalized: boolean;
  readonly mounted: boolean;
  readonly hooks: Action[];
  readonly mountEvents: Action[];
  readonly unmountEvents: Action[];
}

interface MetaConstructor {
  new (): Meta;
}

const current: { meta: Meta | null } = __META__.current;
const Meta: MetaConstructor = __META__.Meta;
const metaStore: Map<{}, Meta> = __META__.metaStore;
const removeListenerStore: Map<ModelBase, Action[]> =
  __META__.removeListenerStore;

export function setCurrentMetaAsNew(): void {
  current.meta = new Meta();
}

export function setCurrentMetaAsNull(): void {
  current.meta = null;
}

export function expectMetaToHaveModelCount(expected: number): void {
  const meta = current.meta!;
  expect(meta).not.toBeNull();
  expect(meta.models).toHaveLength(expected);
}

export function expectMetaToHaveModelBaseCount(expected: number): void {
  const meta = current.meta!;
  expect(meta).not.toBeNull();
  expect(meta.mountEvents).toHaveLength(expected);
  expect(meta.unmountEvents).toHaveLength(expected);
}

export function expectMetaToBeMounted(expected: boolean): void {
  const meta = current.meta!;
  expect(meta).not.toBeNull();
  expect(meta.mounted).toBe(expected);
}

export function expectMetaToBeFinalized(expected: boolean): void {
  const meta = current.meta!;
  expect(meta).not.toBeNull();
  expect(meta.finalized).toBe(expected);
}

export function expectMetaToHaveHookCount(expected: number): void {
  const meta = current.meta!;
  expect(meta).not.toBeNull();
  expect(meta.hooks).toHaveLength(expected);
}

export function deceiveHooks() {
  current.meta!.hooks.forEach(useHook => useHook());
}

export function findMeta<TModel extends {}>(model: TModel): Meta | undefined {
  return metaStore.get(model);
}

export function expectRemoveListenerCount(
  model: ModelBase,
  expected: number
): void {
  const removeListeners = removeListenerStore.get(model) || [];
  expect(removeListeners).toHaveLength(expected);
}
