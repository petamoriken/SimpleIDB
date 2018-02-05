export type SimpleIDBKey = string | number | Date | ArrayBuffer | SimpleIDBKeyArray;
export type SimpleIDBInputKey = string | number | Date | ArrayBuffer | ArrayBufferView | SimpleIDBInputKeyArray;
export type SimpleIDBQuery = IDBKeyRange | null;
export type SimpleIDBCursorDirection = "next" | "nextunique" | "prev" | "prevunique";

export interface SimpleIDBKeyAndValue {
    key: SimpleIDBKey,
    value: any,
}

export interface SimpleIDBKeyArray extends Array<SimpleIDBKey> {}
export interface SimpleIDBInputKeyArray extends Array<SimpleIDBInputKey> {}

export declare class SimpleIDB {
    constructor(dbName: string, dbVersion: number, onupgradeneeded: (this: IDBOpenDBRequest, event: IDBVersionChangeEvent) => any);

    /**
     * IndexedDB の open に成功したら fullfilled する Promise を返す
     */
    ready(): Promise<void>;

    /**
     * ObjectStore に値を追加する。追加された key を返す
     * @param storeName ObjectStore の名前
     * @param value 追加する値
     * @param key 追加する値のキー。ObjectStore が autoIncrement の場合は省略可能
     */
    add(storeName: string, value: any, key?: SimpleIDBInputKey): Promise<SimpleIDBKey>;

    /**
     * ObjectStore の値を追加もしくは更新する。追加もしくは更新された key を返す
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
     * ObjectStore の値を取得し、同時に削除する
     * @param storeName ObjectStore の名前
     * @param key 取得、削除する値のキー
     */
    getAndDelete(storeName: string, key: SimpleIDBInputKey): Promise<any>;

    /**
     * ObjectStore の値を複数取得する
     * @param storeName ObjectStore の名前
     * @param query 取得する際のクエリ。null の場合全件取得する
     * @param count 取得する値の個数の上限値
     * @param direction 昇順、降順
     */
    getAll(storeName: string, query?: SimpleIDBQuery, count?: number, direction?: SimpleIDBCursorDirection): Promise<SimpleIDBKeyAndValue[]>;

    /**
     * ObjectStore の値を複数削除する
     * @param storeName ObjectStore の名前
     * @param query 削除する際のクエリ。null の場合全件を表す
     * @param count 削除する値の個数の上限値
     * @param direction 昇順、降順
     */
    deleteAll(storeName: string, query?: SimpleIDBQuery, count?: number, direction?: SimpleIDBCursorDirection): Promise<void>;

    /**
     * ObjectStore の値を複数取得し、同時に削除する
     * @param storeName ObjectStore の名前
     * @param query 取得、削除する際のクエリ。null の場合全件を表す
     * @param count 取得、削除する値の個数の上限値
     * @param direction 昇順、降順
     */
    getAndDeleteAll(storeName: string, query?: SimpleIDBQuery, count?: number, direction?: SimpleIDBCursorDirection): Promise<SimpleIDBKeyAndValue[]>;

    /**
     * ObjectStore の値を全件削除する
     * @param storeName ObjectStore の名前
     */
    clear(storeName: string): Promise<void>;

    /**
     * ObjectStore を直接入手する。複雑なクエリを使う必要がある時に用いる
     * @param storeNames ObjectStore の名前の配列
     * @param mode IDBTransaction のモード
     * @param oncomplete IDBTransaction が完了したときに呼ばれる callback
     * @param onerror IDBTransaction が失敗したときに呼ばれる callback
     */
    getObjectStores(storeName: string[], mode?: "readonly" | "readwrite", oncomplete?: ((this: SimpleIDB) => any) | null, onerror?: ((this: SimpleIDB, error: DOMException) => any) | null): IDBObjectStore[];
}
