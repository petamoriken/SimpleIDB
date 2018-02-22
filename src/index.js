export class SimpleIDB {

    constructor(name, version, onupgradeneeded) {
        /**
         * @private {IDBDatabase | null}
         */
        this._db = null;

        /**
         * @private {Promise<SimpleIDB> | null}
         */
        this._ready = null;

        /**
         * @private {{name: string, version: number, onupgradeneeded: (this: IDBOpenDBRequest, event: IDBVersionChangeEvent) => any} | null}
         */
        this._readyData = {
            name,
            version,
            onupgradeneeded
        };
    }

    /**
     * IndexedDB を開き、成功したら自身を返す
     */
    ready() {
        if (this._ready === null && this._readyData !== null) {
            const {name, version, onupgradeneeded} = this._readyData;
            this._ready = new Promise((resolve, reject) => {
                const request = indexedDB.open(name, version);

                // migration
                request.onupgradeneeded = onupgradeneeded;

                request.onsuccess = () => {
                    this._db = request.result;
                    resolve(this);
                };
                request.onerror = () => reject(request.error);
            });
            this._readyData = null;
        }
        return this._ready;
    }

    /**
     * ObjectStore に値を追加する。追加された key を返す
     * @param storeName ObjectStore の名前
     * @param value 追加する値
     * @param key 追加する値のキー。ObjectStore が autoIncrement の場合は省略可能
     */
    add(storeName, value, key = undefined) {
        return new Promise((resolve, reject) => {
            const store = this.getObjectStore(storeName, "readwrite", () => resolve(key), reject);
            store.add(value, key).onsuccess = (event) => {
                key = event.target.result;
            };
        });
    }

    /**
     * ObjectStore の値を追加もしくは更新する。追加もしくは更新された key を返す
     * @param storeName ObjectStore の名前
     * @param value 追加もしくは更新する値
     * @param key 追加もしくは更新する値のキー
     */
    put(storeName, value, key) {
        return new Promise((resolve, reject) => {
            const store = this.getObjectStore(storeName, "readwrite", () => resolve(key), reject);
            store.put(value, key).onsuccess = (event) => {
                key = event.target.result;
            };
        });
    }

    /**
     * ObjectStore の値を取得する
     * @param storeName ObjectStore の名前
     * @param key 取得する値のキー
     */
    get(storeName, key) {
        return new Promise((resolve, reject) => {
            let value = null;
            const store = this.getObjectStore(storeName, "readonly", () => resolve(value), reject);
            store.get(key).onsuccess = (event) => {
                value = event.target.result;
            };
        });
    }

    /**
     * ObjectStore の値を削除する
     * @param storeName ObjectStore の名前
     * @param key 削除する値のキー
     */
    delete(storeName, key) {
        return new Promise((resolve, reject) => {
            const store = this.getObjectStore(storeName, "readwrite", resolve, reject);
            store.delete(key);
        });
    }

    /**
     * ObjectStore の値を取得し、同時に削除する
     * @param storeName ObjectStore の名前
     * @param key 取得、削除する値のキー
     */
    getAndDelete(storeName, key) {
        return new Promise((resolve, reject) => {
            let value = null;
            const store = this.getObjectStore(storeName, "readwrite", () => resolve(value), reject);
            store.get(key).onsuccess = (event) => {
                value = event.target.result;
                store.delete(key);
            };
        });
    }

    /**
     * ObjectStore の値を複数取得する
     * @param storeName ObjectStore の名前
     * @param query 取得する際のクエリ。null の場合全件取得する
     * @param count 取得する値の個数の上限値
     * @param direction 昇順、降順
     */
    getAll(storeName, query = null, count = Infinity, direction = "next") {
        return new Promise((resolve, reject) => {
            const ret = [];
            const store = this.getObjectStore(storeName, "readonly", () => resolve(ret), reject);

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
     * @param storeName ObjectStore の名前
     * @param query 削除する際のクエリ。null の場合全件を表す
     * @param count 削除する値の個数の上限値
     * @param direction 昇順、降順
     */
    deleteAll(storeName, query = null, count = Infinity, direction = "next") {
        return new Promise((resolve, reject) => {
            const store = this.getObjectStore(storeName, "readwrite", resolve, reject);

            if (count === Infinity) {
                if (query === null) {
                    store.clear();
                } else {
                    store.delete(query);
                }
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
     * @param storeName ObjectStore の名前
     * @param query 取得、削除する際のクエリ。null の場合全件を表す
     * @param count 取得、削除する値の個数の上限値
     * @param direction 昇順、降順
     */
    getAndDeleteAll(storeName, query = null, count = Infinity, direction = "next") {
        return new Promise((resolve, reject) => {
            const ret = [];
            const store = this.getObjectStore(storeName, "readwrite", () => resolve(ret), reject);

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
     * ObjectStore の値を全件削除する
     * @param storeName ObjectStore の名前
     */
    clear(storeName) {
        return new Promise((resolve, reject) => {
            const store = this.getObjectStore(storeName, "readwrite", resolve, reject);
            store.clear();
        });
    }

    /**
     * ObjectStore を直接入手する。複雑なクエリを使う必要がある時に用いる
     * @param storeNames ObjectStore の名前の配列
     * @param mode IDBTransaction のモード
     * @param oncomplete IDBTransaction が完了したときに呼ばれる callback
     * @param onerror IDBTransaction が失敗したときに呼ばれる callback
     */
    getObjectStores(storeNames, mode = "readonly", completeCallback, errorCallback) {
        const transaction = this.getTransaction(storeNames, mode, completeCallback, errorCallback);
        return storeNames.map(storeName => transaction.objectStore(storeName));
    }

    /**
     * @private
     */
    getObjectStore(storeName, mode, completeCallback, errorCallback) {
        const transaction = this.getTransaction(storeName, mode, completeCallback, errorCallback);
        return transaction.objectStore(storeName);
    }

    /**
     * @private
     */
    getTransaction(storeName, mode, completeCallback, errorCallback) {
        if (this._db === null) { throw new Error("Indexed DB hasn't been opened yet. Please await SimpleIDB#ready()"); }

        const transaction = this._db.transaction(storeName, mode);
        if (completeCallback != null) { transaction.oncomplete = () => completeCallback(); }
        if (errorCallback != null) { transaction.onerror = (e) => errorCallback(e.target.error); }
        return transaction;
    }
}
