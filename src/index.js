const MAX_UINT32_INTEGER = -1 >>> 0;

export class SimpleIDB {

    /**
     * @param name データベースの名前
     */
    static deleteDatabase(name) {
        return new Promise((resolve, reject) => {
            const request = indexedDB.deleteDatabase(name);
            request.onsuccess = () => resolve();
            request.onerror = (event) => reject(event.target.error);
        });
    }

    /**
     * データベースの名前
     */
    get name() {
        return this._name;
    }

    /**
     * データベースのバージョン
     */
    get version() {
        return this._version;
    }

    /**
     * @param name データベースの名前
     * @param version データベースのバージョン. ObjectStore や Index の変更時に増やしていく
     * @param onupgradeneeded ObjectStore や Index の初期化, 変更を行う函数
     */
    constructor(name, version, onupgradeneeded) {
        /**
         * @private {string}
         */
        this._name = name;

        /**
         * @private {number}
         */
        this._version = version | 0;

        /**
         * @private {(this: SimpleIDB, db: IDBDatabase, transaction: IDBTransaction, oldVersion: number, newVersion: number) => any | null}
         */
        this._onupgradeneeded = onupgradeneeded;

        /**
         * @private {IDBDatabase | null}
         */
        this._db = null;

        /**
         * @private {Promise<SimpleIDB> | null}
         */
        this._ready = null;

        /**
         * @private {IDBTransaction | null}
         */
        this._versionChangeTransaction = null;

        /**
         * @private {boolean}
         */
        this._useOpenKeyCursor = IDBObjectStore.prototype.openKeyCursor !== undefined && IDBIndex.prototype.openKeyCursor !== undefined;

        /**
         * @private {boolean}
         */
        this._useGetAll = IDBObjectStore.prototype.getAll !== undefined && IDBIndex.prototype.getAll !== undefined;
    }

    /**
     * IndexedDB を開き, 成功したら自身を返す
     */
    ready() {
        if (this._ready === null && this._onupgradeneeded !== null) {
            const {_name: name, _version: version, _onupgradeneeded: onupgradeneeded} = this;
            this._ready = new Promise((resolve, reject) => {
                const request = indexedDB.open(name, version);

                request.onupgradeneeded = (event) => {
                    const {oldVersion, newVersion} = event;
                    const {result: db, transaction} = request;

                    this._db = db;
                    this._versionChangeTransaction = transaction;
                    onupgradeneeded.call(this, db, transaction, oldVersion, newVersion);
                    this._db = null;
                    this._versionChangeTransaction = null;
                };

                request.onsuccess = () => {
                    this._db = request.result;
                    resolve(this);
                };
                request.onerror = () => reject(request.error);
            });
            // for GC
            this._onupgradeneeded = null;
        }
        return this._ready;
    }

    /**
     * ObjectStore に値を追加する. 追加されたプライマリキーを返す
     * @param storeName ObjectStore の名前
     * @param value 追加する値
     * @param primaryKey 追加する値のプライマリキー. ObjectStore が autoIncrement の場合は省略可能
     */
    add(storeName, value, primaryKey = undefined) {
        return new Promise((resolve, reject) => {
            let ret;
            const store = this.getObjectStore(storeName, "readwrite", () => resolve(ret), reject);
            store.add(value, primaryKey).onsuccess = (event) => {
                ret = event.target.result;
            };
        });
    }

    /**
     * ObjectStore の値を追加もしくは更新する. 追加もしくは更新されたプライマリキーを返す
     * @param storeName ObjectStore の名前
     * @param value 追加もしくは更新する値
     * @param primaryKey 追加もしくは更新する値のプライマリキー
     */
    put(storeName, value, primaryKey) {
        return new Promise((resolve, reject) => {
            let ret;
            const store = this.getObjectStore(storeName, "readwrite", () => resolve(ret), reject);
            store.put(value, primaryKey).onsuccess = (event) => {
                ret = event.target.result;
            };
        });
    }

    /**
     * ObjectStore の値を取得する
     * @param storeName ObjectStore の名前
     * @param primaryKey 取得する値のプライマリキー
     */
    get(storeName, primaryKey) {
        return new Promise((resolve, reject) => {
            let ret;
            const store = this.getObjectStore(storeName, "readonly", () => resolve(ret), reject);
            store.get(primaryKey).onsuccess = (event) => {
                ret = event.target.result;
            };
        });
    }

    /**
     * ObjectStore の値を更新する
     * @param storeName ObjectStore の名前
     * @param primaryKey 更新する値のプライマリキー
     * @param mapFn 更新を行う函数
     */
    update(storeName, primaryKey, mapFn) {
        return new Promise((resolve, reject) => {
            const store = this.getObjectStore(storeName, "readwrite", resolve, reject);
            store.openCursor(primaryKey).onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor == null) { return; }

                cursor.update(mapFn.call(this, cursor.value));
            };
        });
    }

    /**
     * ObjectStore の値を削除する
     * @param storeName ObjectStore の名前
     * @param primaryKey 削除する値のプライマリキー
     */
    delete(storeName, primaryKey) {
        return new Promise((resolve, reject) => {
            const store = this.getObjectStore(storeName, "readwrite", resolve, reject);
            store.delete(primaryKey);
        });
    }

    /**
     * ObjectStore の値を取得し, 同時に削除する
     * @param storeName ObjectStore の名前
     * @param primaryKey 取得, 削除する値のプライマリキー
     */
    take(storeName, primaryKey) {
        return new Promise((resolve, reject) => {
            let ret;
            const store = this.getObjectStore(storeName, "readwrite", () => resolve(ret), reject);
            store.get(primaryKey).onsuccess = (event) => {
                ret = event.target.result;
            };
            store.delete(primaryKey);
        });
    }

    /**
     * ObjectStore に値を複数追加する. 追加されたキーを返す
     * @param storeName ObjectStore の名前
     * @param keyAndValues 追加するプライマリキーと値のペア. プライマリキーはObjectStore が autoIncrement の場合は省略可能
     */
    addAll(storeName, keyAndValues) {
        return new Promise((resolve, reject) => {
            const ret = [];
            const store = this.getObjectStore(storeName, "readwrite", () => resolve(ret), reject);
            for (const {primaryKey, value} of keyAndValues) {
                store.add(value, primaryKey).onsuccess = (event) => {
                    ret.push(event.target.result);
                };
            }
        });
    }

    /**
     * ObjectStore に値を複数追加もしくは更新する. 追加もしくは更新されたプライマリキーを返す
     * @param storeName ObjectStore の名前
     * @param keyAndValues 追加するプライマリキーと値のペア
     */
    putAll(storeName, keyAndValues) {
        return new Promise((resolve, reject) => {
            const ret = [];
            const store = this.getObjectStore(storeName, "readwrite", () => resolve(ret), reject);
            for (const {primaryKey, value} of keyAndValues) {
                store.put(value, primaryKey).onsuccess = (event) => {
                    ret.push(event.target.result);
                };
            }
        });
    }

    /**
     * ObjectStore の値を複数取得する
     * @param storeName ObjectStore の名前
     * @param options 取得する際のオプション
     * @param options.indexName ObjectStore の Index の名前
     * @param options.query 取得する際のクエリ
     * @param options.count 取得する値の個数の上限値
     * @param options.direction 昇順, 降順
     */
    getAll(storeName, {indexName = null, query = null, count = MAX_UINT32_INTEGER, direction = "next"} = {}) {
        return new Promise((resolve, reject) => {
            const ret = [];
            if (count === 0) { resolve(ret); return; }

            const store = this.getObjectStore(storeName, "readonly", () => resolve(ret), reject);
            const index = indexName !== null ? store.index(indexName) : null;

            let i = 1;
            (index || store).openCursor(query, direction).onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor == null) { return; }

                ret.push({ primaryKey: cursor.primaryKey, key: cursor.key, value: cursor.value });
                if (i < count) {
                    ++i;
                    cursor.continue();
                }
            };
        });
    }

    /**
     * ObjectStore のキーのみを複数取得する. 値を取らない分効率的
     * @param storeName ObjectStore の名前
     * @param options 取得する際のオプション
     * @param options.indexName ObjectStore の Index の名前
     * @param options.query 取得する際のクエリ
     * @param options.count 取得する値の個数の上限値
     * @param options.direction 昇順, 降順
     */
    getAllKeys(storeName, {indexName = null, query = null, count = MAX_UINT32_INTEGER, direction = "next"} = {}) {
        return new Promise((resolve, reject) => {
            const ret = [];
            if (count === 0) { resolve(ret); return; }

            const store = this.getObjectStore(storeName, "readonly", () => resolve(ret), reject);
            const index = indexName !== null ? store.index(indexName) : null;

            let i = 1;
            (index || store)[this._useOpenKeyCursor ? "openKeyCursor" : "openCursor"](query, direction).onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor == null) { return; }

                ret.push({ primaryKey: cursor.primaryKey, key: cursor.key });
                if (i < count) {
                    ++i;
                    cursor.continue();
                }
            };
        });
    }

    /**
     * ObjectStore の値のみを複数取得する. キーを取らない分効率的
     * @param storeName ObjectStore の名前
     * @param options 取得する際のオプション
     * @param options.indexName ObjectStore の Index の名前
     * @param options.query 取得する際のクエリ
     * @param options.count 取得する値の個数の上限値
     * @param options.direction 昇順, 降順
     */
    getAllValues(storeName, {indexName = null, query = null, count = MAX_UINT32_INTEGER, direction = "next"} = {}) {
        return new Promise((resolve, reject) => {
            let ret = [];
            if (count === 0) { resolve(ret); return; }

            const store = this.getObjectStore(storeName, "readonly", () => resolve(ret), reject);
            const index = indexName !== null ? store.index(indexName) : null;

            if (this._useGetAll && direction === "next") {
                (index || store).getAll(query, count).onsuccess = (event) => {
                    ret = event.target.result.map((value) => ({ value }));
                };
                return;
            }

            let i = 1;
            (index || store).openCursor(query, direction).onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor == null) { return; }

                ret.push({ value: cursor.value });
                if (i < count) {
                    ++i;
                    cursor.continue();
                }
            };
        });
    }

    /**
     * ObjectStore の値を複数更新する
     * @param storeName ObjectStore の名前
     * @param mapFn 更新を行う函数
     * @param options 削除する際のオプション
     * @param options.indexName ObjectStore の Index の名前
     * @param options.query 更新する際のクエリ
     * @param options.count 更新する値の個数の上限値
     * @param options.direction 昇順, 降順
     */
    updateAll(storeName, mapFn, {indexName = null, query = null, count = MAX_UINT32_INTEGER, direction = "next"} = {}) {
        return new Promise((resolve, reject) => {
            if (count === 0) { resolve(); return; }

            const store = this.getObjectStore(storeName, "readwrite", resolve, reject);
            const index = indexName !== null ? store.index(indexName) : null;

            let i = 1;
            (index || store).openCursor(query, direction).onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor == null) { return; }

                cursor.update(mapFn.call(this, cursor.value, cursor.key, cursor.primaryKey));
                if (i < count) {
                    ++i;
                    cursor.continue();
                }
            };
        });
    }

    /**
     * ObjectStore の値を複数削除する
     * @param storeName ObjectStore の名前
     * @param options 削除する際のオプション
     * @param options.indexName ObjectStore の Index の名前
     * @param options.query 削除する際のクエリ
     * @param options.count 削除する値の個数の上限値
     * @param options.direction 昇順, 降順
     */
    deleteAll(storeName, {indexName = null, query = null, count = MAX_UINT32_INTEGER, direction = "next"} = {}) {
        return new Promise((resolve, reject) => {
            if (count === 0) { resolve(); return; }

            const store = this.getObjectStore(storeName, "readwrite", resolve, reject);
            const index = indexName !== null ? store.index(indexName) : null;

            if (index === null && count === MAX_UINT32_INTEGER) {
                if (query === null) {
                    store.clear();
                } else {
                    store.delete(query);
                }
            } else {
                let i = 1;
                (index || store).openCursor(query, direction).onsuccess = (event) => {
                    const cursor = event.target.result;
                    if (cursor == null) { return; }

                    cursor.delete();
                    if (i < count) {
                        ++i;
                        cursor.continue();
                    }
                };
            }
        });
    }

    /**
     * ObjectStore の値を複数取得し, 同時に削除する
     * @param storeName ObjectStore の名前
     * @param options 取得, 削除する際のオプション
     * @param options.indexName ObjectStore の Index の名前
     * @param options.query 取得, 削除する際のクエリ
     * @param options.count 取得, 削除する値の個数の上限値
     * @param options.direction 昇順, 降順
     */
    takeAll(storeName, {indexName = null, query = null, count = MAX_UINT32_INTEGER, direction = "next"} = {}) {
        return new Promise((resolve, reject) => {
            const ret = [];
            if (count === 0) { resolve(ret); return; }

            const store = this.getObjectStore(storeName, "readwrite", () => resolve(ret), reject);
            const index = indexName !== null ? store.index(indexName) : null;

            let i = 1;
            (index || store).openCursor(query, direction).onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor == null) { return; }

                ret.push({ primaryKey: cursor.primaryKey, key: cursor.key, value: cursor.value });
                cursor.delete();
                if (i < count) {
                    ++i;
                    cursor.continue();
                }
            };
        });
    }

    /**
     * ObjectStore の値の個数を数える
     * @param storeName ObjectStore の名前
     * @param options 取得する際のオプション
     * @param options.indexName ObjectStore の Index の名前
     * @param options.query 取得する際のクエリ
     */
    count(storeName, {indexName = null, query = null} = {}) {
        return new Promise((resolve, reject) => {
            let ret;
            const store = this.getObjectStore(storeName, "readonly", () => resolve(ret), reject);
            const index = indexName !== null ? store.index(indexName) : null;

            (index || store).count(query).onsuccess = (event) => {
                ret = event.target.result;
            };
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
     * ObjectStore を直接入手する. 複雑なクエリを使う必要がある時に用いる
     * @param storeNames ObjectStore の名前の配列
     * @param mode IDBTransaction のモード
     * @param oncomplete IDBTransaction が完了したときに呼ばれる callback
     * @param onerror IDBTransaction が失敗したときに呼ばれる callback
     */
    getObjectStores(storeNames, mode = "readonly", completeCallback = null, errorCallback = null) {
        const transaction = this.getTransaction(storeNames, mode, completeCallback, errorCallback);
        if (completeCallback !== null) { transaction.oncomplete = () => completeCallback(); }
        if (errorCallback !== null) { transaction.onerror = (event) => errorCallback(event.target.error); }
        return storeNames.map(storeName => transaction.objectStore(storeName));
    }

    /**
     * データベースとのコネクションを閉じる
     */
    close() {
        this._db.close();
    }

    /**
     * @private
     */
    getObjectStore(storeName, mode, completeCallback, errorCallback) {
        const transaction = this.getTransaction(storeName, mode, completeCallback, errorCallback);
        transaction.oncomplete = () => completeCallback();
        transaction.onerror = (event) => errorCallback(event.target.error);
        return transaction.objectStore(storeName);
    }

    /**
     * @private
     */
    getTransaction(storeName, mode) {
        if (this._db === null) { throw new Error("Indexed DB hasn't been opened yet. Please await SimpleIDB#ready()"); }
        const transaction = this._versionChangeTransaction || this._db.transaction(storeName, mode);
        return transaction;
    }
}
