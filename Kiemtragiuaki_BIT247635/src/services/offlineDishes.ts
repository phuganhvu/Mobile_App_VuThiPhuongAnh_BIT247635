import AsyncStorage from '@react-native-async-storage/async-storage';
import { Dish } from '../types';

const DISH_CACHE_KEY = 'cached_dishes';
const OFFLINE_QUEUE_KEY = 'offline_queue';

export type OfflineDishAction =
  | { type: 'ADD'; id: string; data: Dish }
  | { type: 'EDIT'; id: string; data: Dish }
  | { type: 'DELETE'; id: string };

export async function readCachedDishes(): Promise<Dish[]> {
  const value = await AsyncStorage.getItem(DISH_CACHE_KEY);
  return value ? JSON.parse(value) as Dish[] : [];
}

export async function writeCachedDishes(dishes: Dish[]): Promise<void> {
  await AsyncStorage.setItem(DISH_CACHE_KEY, JSON.stringify(dishes));
}

async function readQueue(): Promise<OfflineDishAction[]> {
  const value = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
  return value ? JSON.parse(value) as OfflineDishAction[] : [];
}

async function writeQueue(actions: OfflineDishAction[]): Promise<void> {
  await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(actions));
}

export async function saveDishOffline(dish: Dish, isNew: boolean): Promise<void> {
  const [cachedDishes, actions] = await Promise.all([readCachedDishes(), readQueue()]);
  const cachedIndex = cachedDishes.findIndex(item => item.id === dish.id);

  if (cachedIndex >= 0) {
    cachedDishes[cachedIndex] = dish;
  } else {
    cachedDishes.unshift(dish);
  }

  const pendingAdd = actions.find(action => action.type === 'ADD' && action.id === dish.id);
  if (pendingAdd?.type === 'ADD') {
    pendingAdd.data = dish;
  } else if (isNew) {
    actions.push({ type: 'ADD', id: dish.id, data: dish });
  } else {
    const pendingEdit = actions.find(action => action.type === 'EDIT' && action.id === dish.id);
    if (pendingEdit?.type === 'EDIT') {
      pendingEdit.data = dish;
    } else {
      actions.push({ type: 'EDIT', id: dish.id, data: dish });
    }
  }

  await Promise.all([writeCachedDishes(cachedDishes), writeQueue(actions)]);
}

export async function deleteDishOffline(id: string): Promise<void> {
  const [cachedDishes, actions] = await Promise.all([readCachedDishes(), readQueue()]);
  const pendingAdd = actions.some(action => action.type === 'ADD' && action.id === id);
  const nextActions = pendingAdd
    ? actions.filter(action => action.id !== id)
    : [...actions.filter(action => action.id !== id), { type: 'DELETE' as const, id }];

  await Promise.all([
    writeCachedDishes(cachedDishes.filter(dish => dish.id !== id)),
    writeQueue(nextActions),
  ]);
}

export async function readOfflineQueue(): Promise<OfflineDishAction[]> {
  return readQueue();
}

export async function replaceCachedDish(localId: string, serverDish: Dish): Promise<void> {
  const cachedDishes = await readCachedDishes();
  const index = cachedDishes.findIndex(dish => dish.id === localId);
  if (index >= 0) {
    cachedDishes[index] = serverDish;
    await writeCachedDishes(cachedDishes);
  }
}

export async function applyPendingActions(
  serverDishes: Dish[],
  actions: OfflineDishAction[]
): Promise<Dish[]> {
  const merged = [...serverDishes];
  for (const action of actions) {
    if (action.type === 'ADD') {
      if (!merged.some(dish =>
        dish.id === action.id || dish.BIT247635_Id === action.data.BIT247635_Id
      )) {
        merged.unshift(action.data);
      }
    } else if (action.type === 'EDIT') {
      const index = merged.findIndex(dish => dish.id === action.id);
      if (index >= 0) merged[index] = action.data;
    } else {
      const index = merged.findIndex(dish => dish.id === action.id);
      if (index >= 0) merged.splice(index, 1);
    }
  }
  return merged;
}

export async function removeOfflineAction(actionId: string): Promise<void> {
  const actions = await readQueue();
  await writeQueue(actions.filter(action => action.id !== actionId));
}
