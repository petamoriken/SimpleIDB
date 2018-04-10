export type SimpleIDBKey = string | number | Date | ArrayBuffer | SimpleIDBKeyArray;
export type SimpleIDBInputKey = string | number | Date | ArrayBuffer | ArrayBufferView | SimpleIDBInputKeyArray;
export type SimpleIDBQuery = IDBKeyRange | null;
export type SimpleIDBCursorDirection = "next" | "nextunique" | "prev" | "prevunique";

export interface SimpleIDBKeyArray extends Array<SimpleIDBKey> {}
export interface SimpleIDBInputKeyArray extends Array<SimpleIDBInputKey> {}

export interface SimpleIDBKeyAndValue {
    key: SimpleIDBKey,
    value: any,
}

export interface SimpleIDBQueryOptions {
    query?: SimpleIDBQuery,
    count?: number,
    direction?: SimpleIDBCursorDirection,
}

export declare class SimpleIDB {
    constructor(name: string, version: number, onupgradeneeded: (this: IDBOpenDBRequest, event: IDBVersionChangeEvent) => any);

    /**
     * IndexedDB を開き, 成功したら自身を返す
     */
    ready(): Promise<this>;

    /**
     * ObjectStore に値を追加する. 追加された key を返す
     * @param storeName ObjectStore の名前
     * @param value 追加する値
     * @param key 追加する値のキー. ObjectStore が autoIncrement の場合は省略可能
     */
    add(storeName: string, value: any, key?: SimpleIDBInputKey): Promise<SimpleIDBKey>;

    /**
     * ObjectStore の値を追加もしくは更新する. 追加もしくは更新された key を返す
     * @param storeName ObjectStore の名前
     * @param value 追加もしくは更新する値
     * @param key 追加もしくは更新する値のキー
     */
    put(storeName: string, value: any, key: SimpleIDBInputKey): Promise<SimpleIDBKey>;

    /**
     * ObjectStore の値を取得する
     * @param storeName ObjectStore の名前
     * @param key 取得する値のキー
     */
    get(storeName: string, key: SimpleIDBInputKey): Promise<any>;

    /**
     * ObjectStore の値を削除する
     * @param storeName ObjectStore の名前
     * @param key 削除する値のキー
     */
    delete(storeName: string, key: SimpleIDBInputKey): Promise<void>;

    /**
     * ObjectStore の値を取得し, 同時に削除する
     * @param storeName ObjectStore の名前
     * @param key 取得, 削除する値のキー
     */
    take(storeName: string, key: SimpleIDBInputKey): Promise<any>;

    /**
     * ObjectStore の値を複数取得する
     * @param storeName ObjectStore の名前
     * @param indexName ObjectStore の Index の名前. null の場合は直接 ObjectStore から取得する
     * @param options 取得する際のオプション
     * @param options.query 取得する際のクエリ
     * @param options.count 取得する値の個数の上限値
     * @param options.direction 昇順, 降順
     */
    getAll(storeName: string, indexName?: string | null, options?: SimpleIDBQueryOptions): Promise<SimpleIDBKeyAndValue[]>;

    /**
     * ObjectStore の値を複数削除する
     * @param storeName ObjectStore の名前
     * @param indexName ObjectStore の Index の名前. null の場合は直接 ObjectStore から削除する
     * @param options 削除する際のオプション
     * @param options.query 削除する際のクエリ
     * @param options.count 削除する値の個数の上限値
     * @param options.direction 昇順, 降順
     */
    deleteAll(storeName: string, indexName?: string | null, options?: SimpleIDBQueryOptions): Promise<void>;

    /**
     * ObjectStore の値を複数取得し, 同時に削除する
     * @param storeName ObjectStore の名前
     * @param indexName ObjectStore の Index の名前. null の場合は直接 ObjectStore から取得, 削除する
     * @param options 取得, 削除する際のオプション
     * @param options.query 取得, 削除する際のクエリ
     * @param options.count 取得, 削除する値の個数の上限値
     * @param options.direction 昇順, 降順
     */
    takeAll(storeName: string, indexName?: string | null, options?: SimpleIDBQueryOptions): Promise<SimpleIDBKeyAndValue[]>;

    /**
     * ObjectStore の値数を数える
     * @param storeName ObjectStore の名前
     * @param indexName ObjectStore の Index の名前. null の場合は直接 ObjectStore から取得する
     * @param query 取得する際のクエリ
     */
    count(storeName: string, indexName?: string | null, query?: SimpleIDBQuery);

    /**
     * ObjectStore の値を全件削除する
     * @param storeName ObjectStore の名前
     */
    clear(storeName: string): Promise<void>;

    /**
     * ObjectStore を直接入手する. 複雑なクエリを使う必要がある時に用いる
     * @param storeNames ObjectStore の名前の配列
     * @param mode IDBTransaction のモード
     * @param oncomplete IDBTransaction が完了したときに呼ばれる callback
     * @param onerror IDBTransaction が失敗したときに呼ばれる callback
     */
    getObjectStores(storeName: string[], mode?: "readonly" | "readwrite", oncomplete?: ((this: SimpleIDB) => any) | null, onerror?: ((this: SimpleIDB, error: DOMException) => any) | null): IDBObjectStore[];
}
