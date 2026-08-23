const DB_NAME = "fogg-behavior-lab-appearance";
const STORE_NAME = "appearance";
const BACKGROUND_KEY = "custom-background";
const DEFAULT_BACKGROUND = "url('/ambient-mountains-v1.png')";

let activeObjectUrl: string | null = null;

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) request.result.createObjectStore(STORE_NAME);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function useStore<T>(mode: IDBTransactionMode, work: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, mode);
    const request = work(transaction.objectStore(STORE_NAME));
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    transaction.oncomplete = () => db.close();
    transaction.onerror = () => reject(transaction.error);
  });
}

function displayBackground(blob: Blob | null) {
  if (activeObjectUrl) URL.revokeObjectURL(activeObjectUrl);
  activeObjectUrl = blob ? URL.createObjectURL(blob) : null;
  document.documentElement.style.setProperty("--app-background-image", activeObjectUrl ? `url("${activeObjectUrl}")` : DEFAULT_BACKGROUND);
}

export async function loadBackgroundPreference() {
  try {
    const blob = await useStore<Blob | undefined>("readonly", (store) => store.get(BACKGROUND_KEY));
    displayBackground(blob ?? null);
    return Boolean(blob);
  } catch {
    displayBackground(null);
    return false;
  }
}

export async function saveBackgroundPreference(file: File) {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) throw new Error("请选择 JPG、PNG 或 WebP 图片。");
  if (file.size > 20 * 1024 * 1024) throw new Error("图片不能超过 20 MB。");
  await useStore<IDBValidKey>("readwrite", (store) => store.put(file, BACKGROUND_KEY));
  displayBackground(file);
}

export async function clearBackgroundPreference() {
  await useStore<undefined>("readwrite", (store) => store.delete(BACKGROUND_KEY));
  displayBackground(null);
}
