import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const CHUNK_SIZE = 2000;
const CHUNK_COUNT_SUFFIX = '_chunk_count';

async function getChunkedItem(key: string): Promise<string | null> {
  const chunkCountRaw = await SecureStore.getItemAsync(`${key}${CHUNK_COUNT_SUFFIX}`);
  if (!chunkCountRaw) return SecureStore.getItemAsync(key);

  const chunkCount = Number(chunkCountRaw);
  if (!Number.isFinite(chunkCount) || chunkCount <= 0) return null;

  const chunks: string[] = [];
  for (let index = 0; index < chunkCount; index += 1) {
    const chunk = await SecureStore.getItemAsync(`${key}_chunk_${index}`);
    if (chunk === null) return null;
    chunks.push(chunk);
  }
  return chunks.join('');
}

async function deleteChunkKeys(key: string, chunkCount: number) {
  for (let index = 0; index < chunkCount; index += 1) {
    await SecureStore.deleteItemAsync(`${key}_chunk_${index}`).catch(() => undefined);
  }
}

async function setChunkedItem(key: string, value: string): Promise<void> {
  if (value.length <= CHUNK_SIZE) {
    await removeChunkedItem(key);
    await SecureStore.setItemAsync(key, value);
    return;
  }

  const previousChunkCountRaw = await SecureStore.getItemAsync(`${key}${CHUNK_COUNT_SUFFIX}`);
  const previousChunkCount = Number(previousChunkCountRaw);
  const chunkCount = Math.ceil(value.length / CHUNK_SIZE);

  await SecureStore.deleteItemAsync(key).catch(() => undefined);
  await SecureStore.deleteItemAsync(`${key}${CHUNK_COUNT_SUFFIX}`).catch(() => undefined);

  for (let index = 0; index < chunkCount; index += 1) {
    const chunk = value.slice(index * CHUNK_SIZE, (index + 1) * CHUNK_SIZE);
    await SecureStore.setItemAsync(`${key}_chunk_${index}`, chunk);
  }

  await SecureStore.setItemAsync(`${key}${CHUNK_COUNT_SUFFIX}`, String(chunkCount));

  if (Number.isFinite(previousChunkCount) && previousChunkCount > chunkCount) {
    await deleteChunkKeys(key, previousChunkCount);
  }
}

async function removeChunkedItem(key: string): Promise<void> {
  const chunkCountRaw = await SecureStore.getItemAsync(`${key}${CHUNK_COUNT_SUFFIX}`);
  if (chunkCountRaw) {
    const chunkCount = Number(chunkCountRaw);
    if (Number.isFinite(chunkCount) && chunkCount > 0) {
      await deleteChunkKeys(key, chunkCount);
    }
    await SecureStore.deleteItemAsync(`${key}${CHUNK_COUNT_SUFFIX}`).catch(() => undefined);
  }
  await SecureStore.deleteItemAsync(key).catch(() => undefined);
}

const webStorage = {
  getItem(key: string) {
    if (typeof localStorage === 'undefined') return null;
    return localStorage.getItem(key);
  },
  setItem(key: string, value: string) {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(key, value);
  },
  removeItem(key: string) {
    if (typeof localStorage === 'undefined') return;
    localStorage.removeItem(key);
  },
};

const nativeStorage = {
  getItem: getChunkedItem,
  setItem: setChunkedItem,
  removeItem: removeChunkedItem,
};

export const SUPABASE_AUTH_STORAGE_KEY = 'myshepherdline.auth.session';

export const supabaseAuthStorage = Platform.OS === 'web' ? webStorage : nativeStorage;
