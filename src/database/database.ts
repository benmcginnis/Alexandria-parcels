import { addRxPlugin, createRxDatabase } from 'rxdb/plugins/core';
import { RxDBDevModePlugin } from 'rxdb/plugins/dev-mode';
import { getRxStorageLocalstorage } from 'rxdb/plugins/storage-localstorage';

addRxPlugin(RxDBDevModePlugin);

export async function initDb() {
  const db = await createRxDatabase({
    name: 'db',
    storage: getRxStorageLocalstorage(),
  });
  return db;
}
