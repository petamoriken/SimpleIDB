type SimpleIDBKey = string | number | Date;
type SimpleIDBQuery = IDBKeyRange | SimpleIDBKey[] | null;
type SimpleIDBKeyAndValue = { key: SimpleIDBKey, value: any };

interface SimpleIDB {
    constructor(dbName: string, dbVersion: number, onupgradeneeded: (this: IDBOpenDBRequest, event: IDBVersionChangeEvent) => any);
    add(storeName: string, value: any, key?: SimpleIDBKey): Promise<SimpleIDBKey>;
    get(storeName: string, key: SimpleIDBKey): Promise<any>;
    update(storeName: string, value: any, key: SimpleIDBKey): Promise<void>;
    delete(storeName: string, key: SimpleIDBKey): Promise<void>;

    getAll(storeName: string, query?: SimpleIDBQuery, count?: number, direction?: "next" | "nextunique" | "prev" | "prevunique"): Promise<SimpleIDBKeyAndValue[]>;
    deleteAll(storeName: string, query?: SimpleIDBQuery, count?: number, direction?: "next" | "nextunique" | "prev" | "prevunique"): Promise<void>;
    getAndDeleteAll(storeName: string, query?: SimpleIDBQuery, count?: number, direction?: "next" | "nextunique" | "prev" | "prevunique"): Promise<SimpleIDBKeyAndValue[]>;
    clear(storeName: string): Promise<void>

    getObjectStores(storeName: string[], mode: "readonly" | "readwrite", oncomplete?: ((this: IDBTransaction, ev: Event) => any) | null, onerror?: ((this: IDBTransaction, ev: Event) => any) | null);
}
