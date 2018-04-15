"use strict";

require("fake-indexeddb/build/global");

const assert = require("power-assert");
const faker = require("faker");

const SimpleIDB = require("../lib").SimpleIDB;

describe("SimpleIDB test", () => {
    describe("basic", () => {
        let simpleIDB;

        const storeName = "zip";
        const setupData = Object.freeze([
            { primaryKey: 1, value: faker.address.zipCode() },
            { primaryKey: 2, value: faker.address.zipCode() },
            { primaryKey: 3, value: faker.address.zipCode() },
        ]);

        beforeEach(async () => {
            simpleIDB = new SimpleIDB("basic test" + Math.random(), 1, (event, simpleIDB) => {
                const db = event.target.result;
                db.createObjectStore(storeName, { autoIncrement: true });

                // setup
                simpleIDB.addAll(storeName, setupData);
            });

            await simpleIDB.ready();
        });

        afterEach(async () => {
            simpleIDB.close();
            SimpleIDB.deleteDatabase(simpleIDB.name);
        });

        async function checkCurrentStore(results) {
            const current = await simpleIDB.getAll(storeName);
            assert(current.length === results.length);
            for (let i = 0; i < current.length; ++i) {
                assert(current[i].primaryKey = results[i].primaryKey);
                assert(current[i].value === results[i].value);
            }
        }

        it("name, version", () => {
            assert(simpleIDB.name === simpleIDB._db.name);
            assert(simpleIDB.version === simpleIDB._db.version);
        });

        it("add", async () => {
            const zipValue1 = faker.address.zipCode();
            const zipValue2 = faker.address.zipCode();
            assert(await simpleIDB.add(storeName, zipValue1) === 4);
            assert(await simpleIDB.add(storeName, zipValue2, 10) === 10);
            await checkCurrentStore([
                ...setupData,
                { primaryKey: 4, value: zipValue1 },
                { primaryKey: 10, value: zipValue2 },
            ]);
        });

        it("put", async () => {
            const zipValue1 = faker.address.zipCode();
            assert(await simpleIDB.put(storeName, zipValue1, 10) === 10);
            await checkCurrentStore([
                ...setupData,
                { primaryKey: 10, value: zipValue1 },
            ]);
        });

        it("get", async () => {
            const [{ value: zipValue1 }, { value: zipValue2 }, { value: zipValue3 }] = setupData;
            assert(await simpleIDB.get(storeName, 1) === zipValue1);
            assert(await simpleIDB.get(storeName, 2) === zipValue2);
            assert(await simpleIDB.get(storeName, 3) === zipValue3);
        });

        it("update", async () => {
            const zipValue1 = faker.address.zipCode();
            assert(await simpleIDB.update(storeName, 1, (value) => {
                assert(value === setupData[0].value);
                return zipValue1;
            }) === undefined);
            assert(await simpleIDB.update(storeName, 100, () => { throw new Error("unreachable"); }) === undefined);

            const testData = [].concat(setupData);
            testData[0].value = zipValue1;
            await checkCurrentStore(testData);
        });

        it("delete", async () => {
            assert(await simpleIDB.delete(storeName, 1) === undefined);
            await checkCurrentStore(setupData.slice(1));
        });

        it("take", async () => {
            assert(await simpleIDB.take(storeName, 1) === setupData[0].value);
            await checkCurrentStore(setupData.slice(1));
        });

        it("addAll", async () => {
            const zipValue1 = faker.address.zipCode();
            const zipValue2 = faker.address.zipCode();
            assert.deepStrictEqual(await simpleIDB.addAll(storeName, [
                { value: zipValue1 },
                { primaryKey: 10, value: zipValue2 },
            ]), [4, 10]);
            await checkCurrentStore([
                ...setupData,
                { primaryKey: 4, value: zipValue1 },
                { primaryKey: 10, value: zipValue2 },
            ]);
        });

        it("putAll", async () => {
            const zipValue1 = faker.address.zipCode();
            const zipValue2 = faker.address.zipCode();
            assert.deepStrictEqual(await simpleIDB.addAll(storeName, [
                { primaryKey: 4, value: zipValue1 },
                { primaryKey: 10, value: zipValue2 },
            ]), [4, 10]);
            await checkCurrentStore([
                ...setupData,
                { primaryKey: 4, value: zipValue1 },
                { primaryKey: 10, value: zipValue2 },
            ]);
        });

        it("getAll", async () => {
            assert.deepStrictEqual(await simpleIDB.getAll(storeName, { query: IDBKeyRange.lowerBound(1, true) }), [
                { key: 2, primaryKey: 2, value: setupData[1].value},
                { key: 3, primaryKey: 3, value: setupData[2].value},
            ]);
            assert.deepStrictEqual(await simpleIDB.getAll(storeName, { query: IDBKeyRange.lowerBound(100) }), []);
        });

        it("getAllKeys", async () => {
            assert.deepStrictEqual(await simpleIDB.getAllKeys(storeName), [
                { key: 1, primaryKey: 1 },
                { key: 2, primaryKey: 2 },
                { key: 3, primaryKey: 3 },
            ]);
            assert.deepStrictEqual(await simpleIDB.getAllKeys(storeName, { query: IDBKeyRange.lowerBound(1, true) }), [
                { key: 2, primaryKey: 2 },
                { key: 3, primaryKey: 3 },
            ]);
            assert.deepStrictEqual(await simpleIDB.getAllKeys(storeName, { query: IDBKeyRange.lowerBound(100) }), []);

            // fallback
            simpleIDB._useOpenKeyCursor = false;
            assert.deepStrictEqual(await simpleIDB.getAllKeys(storeName), [
                { key: 1, primaryKey: 1 },
                { key: 2, primaryKey: 2 },
                { key: 3, primaryKey: 3 },
            ]);
            assert.deepStrictEqual(await simpleIDB.getAllKeys(storeName, { query: IDBKeyRange.lowerBound(1, true) }), [
                { key: 2, primaryKey: 2 },
                { key: 3, primaryKey: 3 },
            ]);
            assert.deepStrictEqual(await simpleIDB.getAllKeys(storeName, { query: IDBKeyRange.lowerBound(100) }), []);
            simpleIDB._useOpenKeyCursor = true;
        });

        it("getAllValues", async () => {
            assert.deepStrictEqual(await simpleIDB.getAllValues(storeName), [
                { value: setupData[0].value },
                { value: setupData[1].value },
                { value: setupData[2].value },
            ]);
            assert.deepStrictEqual(await simpleIDB.getAllValues(storeName, { query: IDBKeyRange.lowerBound(1, true) }), [
                { value: setupData[1].value },
                { value: setupData[2].value },
            ]);
            assert.deepStrictEqual(await simpleIDB.getAllValues(storeName, { query: IDBKeyRange.lowerBound(100) }), []);

            // fallback
            simpleIDB._useGetAll = false;
            assert.deepStrictEqual(await simpleIDB.getAllValues(storeName), [
                { value: setupData[0].value },
                { value: setupData[1].value },
                { value: setupData[2].value },
            ]);
            assert.deepStrictEqual(await simpleIDB.getAllValues(storeName, { query: IDBKeyRange.lowerBound(1, true) }), [
                { value: setupData[1].value },
                { value: setupData[2].value },
            ]);
            assert.deepStrictEqual(await simpleIDB.getAllValues(storeName, { query: IDBKeyRange.lowerBound(100) }), []);
            simpleIDB._useGetAll = true;
        });

        it("updateAll", async () => {
            const zipValue1 = faker.address.zipCode();
            assert(await simpleIDB.updateAll(storeName, () => zipValue1, { query: IDBKeyRange.lowerBound(1, true) }) === undefined);
            await checkCurrentStore([
                setupData[0],
                { primaryKey: 1, value: zipValue1 },
                { primaryKey: 2, value: zipValue1 },
            ]);
        });

        it("deleteAll", async () => {
            assert(await simpleIDB.deleteAll(storeName, { query: IDBKeyRange.lowerBound(1, true), count: 1 }) === undefined);
            await checkCurrentStore([
                setupData[0],
                setupData[2],
            ]);
        });

        it("takeAll", async () => {
            assert.deepStrictEqual(await simpleIDB.takeAll(storeName, { query: IDBKeyRange.lowerBound(1, true), count: 1 }), [
                { key: 2, primaryKey: 2, value: setupData[1].value},
            ]);
            await checkCurrentStore([
                setupData[0],
                setupData[2],
            ]);
        });

        it("count", async () => {
            assert(await simpleIDB.count(storeName) === 3);
        });

        it("clear", async () => {
            assert(await simpleIDB.clear(storeName) === undefined);
            await checkCurrentStore([]);
        });
    });
});
