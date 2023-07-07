const IDB_NAME = "ynbt-lite";

// Function to open the IndexedDB
export async function OpenIDB(idbName="", idbStoreName="") {
    return new Promise((resolve, reject) => {
    const request = window.indexedDB.open(idbName, 1);

    request.onerror = (event) => {
        reject(event.target.error);
    };

    request.onsuccess = (event) => {
        const db = event.target.result;
        resolve(db);
    };

    request.onupgradeneeded = (event) => {
        const db = event.target.result;
        const objectStore = db.createObjectStore(idbStoreName, { keyPath: 'dataType' });
        //objectStore.createIndex('id', 'id', { unique: true });
    };
    });
}
// Function to add or update the vdbObj in IndexedDB
export async function SaveIDBObject(idbName="",idbStoreName="",idbObj={}) {
    const db = await OpenIDB(IDB_NAME);

    return new Promise((resolve, reject) => {
        const transaction = db.transaction([idbStoreName], 'readwrite');
        const objectStore = transaction.objectStore(idbStoreName);
        const request = objectStore.put(idbObj);
    
        request.onerror = (event) => {
            reject(event.target.error);
        };
    
        request.onsuccess = () => {
            resolve();
        };
    });
}

// Function to retrieve the vdbObj from IndexedDB
export async function GetIDBObject(idbName="",idbStoreName="", dataType="") {
    const db = await OpenIDB(IDB_NAME);

    return new Promise((resolve, reject) => {
    const transaction = db.transaction([idbStoreName], 'readonly');
    const objectStore = transaction.objectStore(idbStoreName);
    const request = objectStore.get(dataType);

    request.onerror = (event) => {
        reject(event.target.error);
    };

    request.onsuccess = () => {
        const vdbObj = request.result[0];
        resolve(vdbObj);
    };
    });
}