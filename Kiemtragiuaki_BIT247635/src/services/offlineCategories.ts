import AsyncStorage from '@react-native-async-storage/async-storage';
import { DishCategory } from '../types';

const CATEGORY_CACHE_KEY = 'cached_categories';
const CATEGORY_QUEUE_KEY = 'offline_category_queue';

export type PendingCategory =
  | { type: 'ADD' | 'EDIT'; localId: string; data: DishCategory }
  | { type: 'DELETE'; localId: string; serverId: string; logicalId: string };

export async function readCachedCategories(): Promise<DishCategory[]> {
  const value = await AsyncStorage.getItem(CATEGORY_CACHE_KEY);
  return value ? JSON.parse(value) as DishCategory[] : [];
}

async function readQueue(): Promise<PendingCategory[]> {
  const value = await AsyncStorage.getItem(CATEGORY_QUEUE_KEY);
  if (!value) return [];
  const saved = JSON.parse(value) as (PendingCategory | { localId: string; data: DishCategory })[];
  return saved.map(item => 'type' in item
    ? item
    : { type: 'ADD' as const, localId: item.localId, data: item.data });
}

export async function saveCategoryOffline(category: DishCategory, isNew: boolean): Promise<void> {
  const [cached, queue] = await Promise.all([readCachedCategories(), readQueue()]);
  const cachedIndex = cached.findIndex(item => item.id === category.id);
  if (cachedIndex >= 0) cached[cachedIndex] = category;
  else cached.unshift(category);

  const queuedIndex = queue.findIndex(item => item.localId === category.id);
  if (queuedIndex >= 0) {
    const previous = queue[queuedIndex];
    if (previous.type !== 'DELETE') {
      queue[queuedIndex] = {
        type: previous.type === 'ADD' ? 'ADD' : isNew ? 'ADD' : 'EDIT',
        localId: category.id,
        data: category,
      };
    }
  } else {
    queue.push({ type: isNew ? 'ADD' : 'EDIT', localId: category.id, data: category });
  }

  await Promise.all([
    AsyncStorage.setItem(CATEGORY_CACHE_KEY, JSON.stringify(cached)),
    AsyncStorage.setItem(CATEGORY_QUEUE_KEY, JSON.stringify(queue)),
  ]);
}

export async function deleteCategoryOffline(category: DishCategory): Promise<void> {
  const [cached, queue] = await Promise.all([readCachedCategories(), readQueue()]);
  const pendingAdd = queue.some(item => item.localId === category.id && item.type === 'ADD');
  const nextQueue = pendingAdd
    ? queue.filter(item => item.localId !== category.id)
    : [
      ...queue.filter(item => item.localId !== category.id),
      {
        type: 'DELETE' as const,
        localId: category.id,
        serverId: category.id,
        logicalId: category.BIT247635_Id,
      },
    ];

  await Promise.all([
    AsyncStorage.setItem(CATEGORY_CACHE_KEY, JSON.stringify(cached.filter(item => item.id !== category.id))),
    AsyncStorage.setItem(CATEGORY_QUEUE_KEY, JSON.stringify(nextQueue)),
  ]);
}

export async function readPendingCategories(): Promise<PendingCategory[]> {
  return readQueue();
}

export async function replaceCachedCategory(
  localId: string,
  category: DishCategory
): Promise<void> {
  const cached = await readCachedCategories();
  const index = cached.findIndex(item =>
    item.id === localId || item.BIT247635_Id === category.BIT247635_Id
  );
  if (index >= 0) cached[index] = category;
  else cached.unshift(category);
  await AsyncStorage.setItem(CATEGORY_CACHE_KEY, JSON.stringify(cached));
}

export async function removePendingCategory(localId: string): Promise<void> {
  const queue = await readQueue();
  await AsyncStorage.setItem(
    CATEGORY_QUEUE_KEY,
    JSON.stringify(queue.filter(item => item.localId !== localId))
  );
}

export function mergePendingCategories(
  categories: DishCategory[],
  pending: PendingCategory[]
): DishCategory[] {
  const merged = [...categories];
  for (const item of pending) {
    if (item.type === 'DELETE') {
      const index = merged.findIndex(category =>
        category.id === item.serverId || category.BIT247635_Id === item.logicalId
      );
      if (index >= 0) merged.splice(index, 1);
      continue;
    }

    const index = merged.findIndex(category =>
      category.id === item.localId ||
      category.BIT247635_Id === item.data.BIT247635_Id
    );
    if (item.type === 'EDIT' && index >= 0) merged[index] = item.data;
    else if (index < 0) merged.unshift(item.data);
  }
  return merged;
}
