import { KKVRecord } from '../../data/data';

class DBHandle_base {
  DB?: IDBDatabase;
  name: string;
  callback: (() => void)[];
  constructor(name: string, stores?: typeof storeRecord, version?: number) {
    this.name = name;
    this.callback = [];
    const re = indexedDB.open(this.name, version);
    re.onupgradeneeded = (e: any) => {
      const db = e.target.result;
      if (stores) {
        Object.values(stores).forEach(({ key: base, index }) => {
          if (db.objectStoreNames.contains(base)) {
            console.warn(this.name, '已创建过', [base, index]);
            return;
          }
          let objectStore = db.createObjectStore(base, { keyPath: index[0][0] });
          index.forEach(([key, unique]) => {
            objectStore.createIndex(key, key, { unique: unique });
          });
        });
      }
    };
    re.onsuccess = (e: any) => {
      const db = e.target.result;
      this.DB = db;
      console.log(this.name, 'DB连接成功', this.DB);
      this.callback.forEach((f) => f());
    };
    re.onerror = (e) => console.log('error', e);
  }
}
const storeControlRequestGetterRecord = {
  add: function (this: IDBObjectStore, line: Record<string | number, any>) {
    return this.add(line);
  },
  put: function (this: IDBObjectStore, line: Record<string | number, any>) {
    return this.put(line);
  },
  get: function (this: IDBObjectStore, primaryKey: string | number) {
    return this.get(primaryKey);
  },
  delete: function (this: IDBObjectStore, primaryKey: string | number) {
    return this.delete(primaryKey);
  },
  addM: function (this: IDBObjectStore, lines: Record<string | number, any>[]) {
    return lines.map((line) => this.add(line));
  },
  putM: function (this: IDBObjectStore, lines: Record<string | number, any>[]) {
    return lines.map((line) => this.put(line));
  },
  getM: function (this: IDBObjectStore, primaryKeys: (string | number)[]) {
    return primaryKeys.map((primaryKey) => this.get(primaryKey));
  },
  getMRange: function (this: IDBObjectStore, primaryKeysRange: { lower: string | number; upper: string | number }) {
    const keyRange = IDBKeyRange.bound(primaryKeysRange.lower, primaryKeysRange.upper, false, true);
    return this.openCursor(keyRange);
  },
  deleteM: function (this: IDBObjectStore, primaryKeys: (string | number)[]) {
    return primaryKeys.map((primaryKey) => this.delete(primaryKey));
  },
  getByIndex: function (this: IDBObjectStore, indexName: string, key: string | number) {
    return this.index(indexName).getAll(key);
  },
  count: function (this: IDBObjectStore) {
    return this.count();
  },
};
class DBHandle extends DBHandle_base implements Record<keyof typeof storeControlRequestGetterRecord, Function> {
  add(base: StoreKey, line: Record<string | number, any>) {
    return this.storeController('add', base, line);
  }
  put(base: StoreKey, line: Record<string | number, any>) {
    return this.storeController('put', base, line);
  }
  get(base: StoreKey, primaryKey: string | number) {
    return this.storeController('get', base, primaryKey);
  }
  delete(base: StoreKey, primaryKey: string | number) {
    return this.storeController('delete', base, primaryKey);
  }
  addM(base: StoreKey, lines: Record<string | number, any>[]) {
    return this.storeController('addM', base, lines);
  }
  putM(base: StoreKey, lines: Record<string | number, any>[]) {
    return this.storeController('putM', base, lines);
  }
  getM(base: StoreKey, primaryKeys: (string | number)[]) {
    return this.storeController('getM', base, primaryKeys);
  }
  getMRange(base: StoreKey, primaryKeysRange: { lower: string | number; upper: string | number }) {
    return this.storeController('getMRange', base, primaryKeysRange);
  }
  deleteM(base: StoreKey, primaryKeys: (string | number)[]) {
    return this.storeController('deleteM', base, primaryKeys);
  }
  getByIndex(base: StoreKey, indexName: string, key: string | number) {
    return this.storeController('getByIndex', base, indexName, key);
  }
  count(base: StoreKey) {
    return this.storeController('getByIndex', base);
  }
  private action(
    resolve: (re: any) => void,
    reject: (re: any) => void,
    controllerProps: [fnName: keyof typeof storeControlRequestGetterRecord, base: StoreKey, ...props: any[]]
  ) {
    const [fnName, base, props] = controllerProps;
    let request = storeControlRequestGetterRecord[fnName].bind((this.DB as IDBDatabase).transaction([base], 'readwrite').objectStore(base))(...props);
    if (['getMRange'].includes(fnName)) {
      const req = request as IDBRequest<IDBCursorWithValue | null>;
      const res: any[] = [];
      req.onerror = (e: any) => {
        console.warn([fnName, base], props, '数据操作失败', e);
        reject(e);
      };
      req.onsuccess = (e: any) => {
        const re = req.result;
        if (re) {
          res.push(re.value);
          re.continue();
        } else {
          resolve(res);
        }
      };
    } else if (Array.isArray(request)) {
      const errorLogs: any[] = [];
      const successLogs: any[] = [];
      Promise.all(
        request.map(
          (req, i) =>
            new Promise((_resolve, _reject) => {
              req.onerror = (e: any) => {
                errorLogs.push([[fnName, base], ...props.map((e: any) => e[i]), e]);
                _reject(e);
              };
              req.onsuccess = (e: any) => {
                successLogs.push([[fnName, base], ...props.map((e: any) => e[i]), req]);
                _resolve(req.result);
              };
            })
        )
      )
        .then((e) => {
          console.log('数据库批量操作成功:', { successLogs });
          resolve(e);
        })
        .catch((e) => {
          console.warn('数据库批量操作失败:', { errorLogs, successLogs });
          reject(e);
        });
    } else {
      request.onerror = (e: any) => {
        console.warn([fnName, base], props, '数据操作失败', e);
        reject(e);
      };
      request.onsuccess = (e: any) => {
        // console.log([fnName, base], props, '数据操作成功');
        resolve((request as IDBRequest<any>).result);
      };
    }
  }
  private storeController(fnName: keyof typeof storeControlRequestGetterRecord, base: StoreKey, ...props: any[]) {
    return new Promise((resolve, reject) => {
      this.DB ? this.action(resolve, reject, [fnName, base, props]) : this.callback.push(() => this.action(resolve, reject, [fnName, base, props]));
    }).catch((e) => console.warn(`数据库操作失败`, e.target ? { source: e.target.source, error: e.target.error } : e)) as Promise<any>;
  }
}

type StoreKey = 'Book' | 'Story' | 'Sentence' | 'Files';
const storeList: { key: StoreKey; index: [[primaryKey: string, isUnique: true], ...[key: string, isUnique: boolean][]] }[] = [
  { key: 'Book', index: [['ID', true]] },
  { key: 'Story', index: [['ID', true]] },
  { key: 'Sentence', index: [['ID', true]] },
  {
    key: 'Files',
    index: [
      ['path', true],
      ['packageKey', false],
    ],
  },
];
storeList.sort((a, b) => a.key.toString().localeCompare(b.key.toString()));
const storeRecord = new KKVRecord(storeList); // 数据库配置
export const dbh: DBHandle = (function () {
  const storeRecordJson = JSON.stringify(storeRecord);
  const versionString = localStorage.getItem('version');
  const now = Date.now();
  let version = versionString === null ? now : parseInt(versionString);
  if (localStorage.getItem('storeRecord') !== storeRecordJson) {
    localStorage.setItem('storeRecord', storeRecordJson);
    version = now;
  }
  localStorage.setItem('version', version.toString());
  return new DBHandle('VN', storeRecord, version);
})();
