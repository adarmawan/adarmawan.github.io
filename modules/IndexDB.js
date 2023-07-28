var IDB_NAME = "ynbt-lite";
const IDB_STORES = ["persona","conversation","knowledgebase"];

export function SetDBName(dbName=IDB_NAME)
{
    IDB_NAME = dbName;
}
// Function to open the IndexedDB
export async function OpenIDB() {
    return new Promise((resolve, reject) => {
    const request = window.indexedDB.open(IDB_NAME, 1);

    request.onerror = (event) => {
        reject(event.target.error);
    };

    request.onsuccess = (event) => {
        const db = event.target.result;
        resolve(db);
    };


    //Create data stores
    request.onupgradeneeded = (event) => {
        const db = event.target.result;
        for (const s of IDB_STORES) {
            const objectStore = db.createObjectStore(s, { keyPath: 'dataType' });
        //objectStore.createIndex('id', 'id', { unique: true });
        }
    };
    });
}
// Function to add or update the vdbObj in IndexedDB
export async function SaveIDBObject(idbObj={}) {
    const db = await OpenIDB();

    return new Promise((resolve, reject) => {
        //console.log(idbObj);
        const transaction = db.transaction([idbObj.dataType], 'readwrite');
        const objectStore = transaction.objectStore(idbObj.dataType);
        const request = objectStore.put(idbObj);
    
        request.onerror = (event) => {
            reject(event.target.error);
        };
    
        request.onsuccess = () => {
            resolve();
        };
    });
}
export async function SaveIDBObject2(kp="", idbObj={}) {
    const db = await OpenIDB();
   
    return new Promise((resolve, reject) => {
        //console.log(idbObj);
        const transaction = db.transaction([kp], 'readwrite');
        const objectStore = transaction.objectStore(kp);
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
export async function GetIDBObject(dataType="") {
    const db = await OpenIDB();

    return new Promise((resolve, reject) => {
    const transaction = db.transaction([dataType], 'readonly');
    const objectStore = transaction.objectStore(dataType);
    const request = objectStore.get(dataType);

    request.onerror = (event) => {
        console.log(event.target.error)
        reject(event.target.error);
    };

    request.onsuccess = () => {
        const vdbObj = resolve(request.result);
        return vdbObj;
    };
    });
}