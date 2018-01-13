export class SimpleIDB {

    constructor(dbName, dbVersion, onupgradeneeded) {
        const request = indexedDB.open(dbName, dbVersion);

        // migration
        request.onupgradeneeded = onupgradeneeded

        /**
         * @private {IDBDatabase | null}
         */
        this.db = null;

        /**
         * @private {Promise<void>}
         */
        this.loaded = new Promise((resolve, reject) => {
            request.onsuccess = (event) => {
                this.db = event.target.result;
                resolve();
            };
            request.onerror = reject;
        });
    }

    /**
     * ObjectStore に値を追加する。追加された key を返す
     */
    add(storeName, value, key) {
        return new Promise(async (resolve, reject) => {
            const store = await this.getObjectStore(storeName, "readwrite", () => resolve(key), reject);
            store.add(value, key).onsuccess = (event) => {
                key = event.target.result;
            };
        });
    }

    /**
     * ObjectStore の値を取得する
     */
    get(storeName, key) {
        return new Promise(async (resolve, reject) => {
            let value = null;
            const store = await this.getObjectStore(storeName, "readonly", () => resolve(value), reject);
            store.get(key).onsuccess = (event) => {
                value = event.target.result;
            };
        });
    }

    /**
     * ObjectStore の値を更新する
     */
    update(storeName, value, key) {
        return new Promise(async (resolve, reject) => {
            const store = await this.getObjectStore(storeName, "readwrite", () => resolve(), reject);

            store.openCursor(key).onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor == null) { reject(new RangeError(`Invalid key: ${ key }`)); }

                cursor.update(value);
            }
        });
    }

    /**
     * ObjectStore の値を削除する
     */
    delete(storeName, key) {
        return new Promise(async (resolve, reject) => {
            const store = await this.getObjectStore(storeName, "readwrite", () => resolve(), reject);
            store.delete(key);
        });
    }

    /**
     * ObjectStore の値を複数取得する
     */
    getAll(storeName, query = null, count = Infinity, direction = "next") {
        return new Promise(async (resolve, reject) => {
            let ret = [];
            const store = await this.getObjectStore(storeName, "readonly", () => resolve(ret), reject);

            let index = 0;
            store.openCursor(query, direction).onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor == null) { return; }

                ret.push({ key: cursor.key, value: cursor.value });
                if (index < count) {
                    ++index;
                    cursor.continue();
                }
            }
        });
    }

    /**
     * ObjectStore の値を複数削除する
     */
    deleteAll(storeName, query = null, count = Infinity, direction = "next") {
        return new Promise(async (resolve, reject) => {
            const store = await this.getObjectStore(storeName, "readwrite", () => resolve(), reject);

            if (query !== null && count === Infinity) {
                store.delete(query);
            } else {
                let index = 0;

                store.openCursor(query, direction).onsuccess = (event) => {
                    const cursor = event.target.result;
                    if (cursor == null) { return; }

                    cursor.delete();
                    if (index < count) {
                        ++index;
                        cursor.continue();
                    }
                }
            }
        });
    }

    /**
     * ObjectStore の値を複数取得し、同時に削除する
     */
    getAndDeleteAll(storeName, query = null, count = Infinity, direction = "next") {
        return new Promise(async (resolve, reject) => {
            let ret = [];
            const store = await this.getObjectStore(storeName, "readwrite", () => resolve(ret), reject);

            let index = 0;
            store.openCursor(query, direction).onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor == null) { return; }

                ret.push({ key: cursor.key, value: cursor.value });
                cursor.delete();
                if (index < count) {
                    ++index;
                    cursor.continue();
                }
            }
        });
    }

    /**
     * ObjectStore の値を全て削除する
     */
    clear(storeName) {
        return new Promise(async (resolve, reject) => {
            const store = await this.getObjectStore(storeName, "readwrite", () => resolve(), reject);
            store.clear();
        });
    }

    /**
     * ObjectStore を複数取得する。複雑なクエリを送る必要がある時に使う
     */
    async getObjectStores(storeNames, mode = "readonly", completeCallback = null, errorCallback = null) {
        const transaction = await this.getTransaction(storeNames, mode, completeCallback, errorCallback);
        return storeNames.map(storeName => transaction.objectStore(storeName));
    }

    /**
     * @private
     */
    async getObjectStore(storeName, mode = "readonly", completeCallback = null, errorCallback = null) {
        const transaction = await this.getTransaction(storeName, mode, completeCallback, errorCallback);
        return transaction.objectStore(storeName);
    }

    /**
     * @private
     */
    async getTransaction(storeName, mode, completeCallback, errorCallback) {
        await this.loaded;
        const transaction = this.db.transaction(storeName, mode);
        transaction.oncomplete = completeCallback;
        transaction.onerror = errorCallback;
        return transaction;
    }
}
