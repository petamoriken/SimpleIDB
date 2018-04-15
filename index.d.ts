export type SimpleIDBKey = string | number | Date | ArrayBuffer | SimpleIDBKeyArray;
export type SimpleIDBInputKey = string | number | Date | ArrayBuffer | ArrayBufferView | SimpleIDBInputKeyArray;
export type SimpleIDBQuery = IDBKeyRange | null;
export type SimpleIDBCursorDirection = "next" | "nextunique" | "prev" | "prevunique";
export type SimpleIDBResult = SimpleIDBResultKey & SimpleIDBResultValue;

export interface SimpleIDBKeyArray extends Array<SimpleIDBKey> {}
export interface SimpleIDBInputKeyArray extends Array<SimpleIDBInputKey> {}

export interface SimpleIDBResultKey {
    key: SimpleIDBKey,
    primaryKey: SimpleIDBKey,
}

export interface SimpleIDBResultValue {
    value: any,
}

export interface SimpleIDBQueryOptions {
    indexName?: string,
    query?: SimpleIDBQuery,
    count?: number,
    direction?: SimpleIDBCursorDirection,
}

export declare class SimpleIDB {
    /**
     * @param name データベースの名前
     */
    static deleteDatabase(name: string): Promise<void>;

    /**
     * データベースの名前
     */
    readonly name: string;

    /**
     * データベースのバージョン
     */
    readonly version: number;

    /**
     * @param name データベースの名前
     * @param version データベースのバージョン. ObjectStore や Index の変更時に増やしていく
     * @param onupgradeneeded ObjectStore や Index の初期化, 変更を行う函数
     */
    constructor(name: string, version: number, onupgradeneeded: (this: IDBOpenDBRequest, event: IDBVersionChangeEvent, self: SimpleIDB) => any);

    /**
     * IndexedDB を開き, 成功したら自身を返す
     */
    ready(): Promise<this>;

    /**
     * ObjectStore に値を追加する. 追加されたプライマリキーを返す
     * @param storeName ObjectStore の名前
     * @param value 追加する値
     * @param primaryKey 追加する値のプライマリキー. ObjectStore が autoIncrement の場合は省略可能
     */
    add(storeName: string, value: any, primaryKey?: SimpleIDBInputKey): Promise<SimpleIDBKey>;

    /**
     * ObjectStore の値を追加もしくは更新する. 追加もしくは更新されたプライマリキーを返す
     * @param storeName ObjectStore の名前
     * @param value 追加もしくは更新する値
     * @param primaryKey 追加もしくは更新する値のプライマリキー
     */
    put(storeName: string, value: any, primaryKey: SimpleIDBInputKey): Promise<SimpleIDBKey>;

    /**
     * ObjectStore の値を取得する
     * @param storeName ObjectStore の名前
     * @param primaryKey 取得する値のプライマリキー
     */
    get(storeName: string, primaryKey: SimpleIDBInputKey): Promise<any>;

    /**
     * ObjectStore の値を更新する. 存在しない場合更新を行う函数は呼ばれない
     * @param storeName ObjectStore の名前
     * @param primaryKey 更新する値のプライマリキー
     * @param mapFn 更新を行う函数
     */
    update(storeName: string, primaryKey: SimpleIDBInputKey, mapFn: (this: this, value: any) => any): Promise<void>;

    /**
     * ObjectStore の値を削除する
     * @param storeName ObjectStore の名前
     * @param primaryKey 削除する値のプライマリキー
     */
    delete(storeName: string, primaryKey: SimpleIDBInputKey): Promise<void>;

    /**
     * ObjectStore の値を取得し, 同時に削除する
     * @param storeName ObjectStore の名前
     * @param primaryKey 取得, 削除する値のプライマリキー
     */
    take(storeName: string, primaryKey: SimpleIDBInputKey): Promise<any>;

    /**
     * ObjectStore に値を複数追加する. 追加されたプライマリキーを返す
     * @param storeName ObjectStore の名前
     * @param keyAndValues 追加するプライマリキーと値のペア. プライマリキーはObjectStore が autoIncrement の場合は省略可能
     */
    addAll(storeName: string, values: {value: any, primaryKey?: SimpleIDBInputKey}[]): Promise<SimpleIDBKey[]>;

    /**
     * ObjectStore に値を複数追加もしくは更新する. 追加もしくは更新されたキーを返す
     * @param storeName ObjectStore の名前
     * @param keyAndValues 追加するプライマリキーと値のペア
     */
    putAll(storeName: string, keyAndValues: {value: any, primaryKey: SimpleIDBInputKey}[]): Promise<SimpleIDBKey[]>;

    /**
     * ObjectStore の値を複数取得する
     * @param storeName ObjectStore の名前
     * @param options 取得する際のオプション
     * @param options.indexName ObjectStore の Index の名前
     * @param options.query 取得する際のクエリ
     * @param options.count 取得する値の個数の上限値
     * @param options.direction 昇順, 降順
     */
    getAll(storeName: string, options?: SimpleIDBQueryOptions): Promise<SimpleIDBResult[]>;

    /**
     * ObjectStore のキーのみを複数取得する. 値を取らない分効率的
     * @param storeName ObjectStore の名前
     * @param options 取得する際のオプション
     * @param options.indexName ObjectStore の Index の名前
     * @param options.query 取得する際のクエリ
     * @param options.count 取得する値の個数の上限値
     * @param options.direction 昇順, 降順
     */
    getAllKeys(storeName: string, options?: SimpleIDBQueryOptions): Promise<SimpleIDBResultKey[]>;

    /**
     * ObjectStore の値のみを複数取得する. キーを取らない分効率的
     * @param storeName ObjectStore の名前
     * @param options 取得する際のオプション
     * @param options.indexName ObjectStore の Index の名前
     * @param options.query 取得する際のクエリ
     * @param options.count 取得する値の個数の上限値
     * @param options.direction 昇順, 降順
     */
    getAllValues(storeName: string, options?: SimpleIDBQueryOptions): Promise<SimpleIDBResultKey[]>;

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
    updateAll(storeName: string, mapFn: (this: this, value: any, key: SimpleIDBKey, primaryKey: SimpleIDBKey) => any, options: SimpleIDBQueryOptions): Promise<void>;

    /**
     * ObjectStore の値を複数削除する
     * @param storeName ObjectStore の名前
     * @param options 削除する際のオプション
     * @param options.indexName ObjectStore の Index の名前
     * @param options.query 削除する際のクエリ
     * @param options.count 削除する値の個数の上限値
     * @param options.direction 昇順, 降順
     */
    deleteAll(storeName: string, options: SimpleIDBQueryOptions): Promise<void>;

    /**
     * ObjectStore の値を複数取得し, 同時に削除する
     * @param storeName ObjectStore の名前
     * @param options 取得, 削除する際のオプション
     * @param options.indexName ObjectStore の Index の名前
     * @param options.query 取得, 削除する際のクエリ
     * @param options.count 取得, 削除する値の個数の上限値
     * @param options.direction 昇順, 降順
     */
    takeAll(storeName: string, options?: SimpleIDBQueryOptions): Promise<SimpleIDBResult[]>;

    /**
     * ObjectStore の値の個数を数える
     * @param storeName ObjectStore の名前
     * @param indexName ObjectStore の Index の名前. null の場合は直接 ObjectStore から取得する
     * @param query 取得する際のクエリ
     */
    count(storeName: string, options?: {indexName?: string, query?: SimpleIDBQuery}): number;

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

    /**
     * データベースとのコネクションを閉じる
     */
    close(): void;
}
