import DataStore from "nedb";
import { resolve } from "path";
import { DbAdapter, DBObj } from "../types";
import { flags, attrs } from "../mu";

export class NeDB<T> implements DbAdapter {
  path?: string;
  db: DataStore | undefined;

  constructor(path?: string) {
    this.path = path || "";

    this.init();
  }

  /** create the database model  */
  model() {
    if (this.path) {
      this.db = new DataStore<T>({
        filename: this.path,
        autoload: true,
      });
    } else {
      this.db = new DataStore<T>();
    }
  }

  /** Initialize the database */
  init() {
    this.model();
    console.log(`Database loaded: ${this.path}`);
  }

  /** Create a new DBObj */
  create(data: T): Promise<T> {
    return new Promise((resolve: any, reject: any) =>
      this.db?.insert(data, (err: Error, doc: T) => {
        if (err) reject(err);
        return resolve(doc);
      })
    );
  }

  /**
   * Get a single database document.
   * @param query The query object to search for.
   */
  get(query: any): Promise<T | undefined> {
    return new Promise((resolve: any, reject: any) =>
      this.db?.findOne<T>(query, (err: Error, doc: any) => {
        if (err) reject(err);
        return resolve(doc);
      })
    );
  }

  /**
   * Find an array of documents that match the query
   * @param query The query object.
   */
  find(query: any): Promise<T[]> {
    return new Promise((resolve: any, reject: any) =>
      this.db?.find<T>(query, (err: Error, docs: any[]) => {
        if (err) reject(err);
        return resolve(docs);
      })
    );
  }

  /**
   * Update fields of the NeDB database
   * @param query The NeDB query for the fields to be updated.
   * @param data The data to update with
   */
  update(query: any, data: T): Promise<T | T[]> {
    return new Promise((resolve: any, reject: any) =>
      this.db?.update(
        query,
        data,
        { returnUpdatedDocs: true },
        (err: Error, _, docs: T) => {
          if (err) return reject(err);
          return resolve(docs);
        }
      )
    );
  }

  /**
   * Delete a a field from the NeDB instance.
   * @param query The object to query against.
   */
  delete(query: any): Promise<number> {
    return new Promise((resolve: any, reject: any) =>
      this.db?.remove(query, {}, (err: Error, n: number) => {
        if (err) reject(err);
        return resolve(n);
      })
    );
  }

  /**
   * Find a DBObj from a string name, here, or me.
   * @param en The enactor DBObj
   * @param tar the target string to search for
   */
  target(en: DBObj, tar: string) {
    if (tar) {
      tar = tar.toLowerCase();
      if (tar === "me") {
        return Promise.resolve(en);
      } else if (tar === "here") {
        return this.get({ _id: en.location });
      } else {
        return this.get({
          $where: function () {
            if (this.name.toLowerCase() === tar) return true;
            return false;
          },
        });
      }
    } else {
      return this.get({ _id: en.location });
    }
  }

  /**
   * Modify name appearance depending on the bit
   * level of the looker.  If staff or higher, or
   * owner of the object, they should see the flag
   * codes associated with the thing/room/exit/etc.
   * @param en The enactor DBObj
   * @param tar The target DBObj
   */
  name(en: DBObj, tar: DBObj) {
    const moniker = attrs.get(en, tar, "moniker");
    let name = moniker ? moniker : tar.name;

    if (flags.canEdit(en, tar)) {
      return `${name}&lpar;<span style='font-weight: normal'>#${
        tar.dbref
      }${flags.codes(tar)}</span>&rpar;`;
    } else {
      return name;
    }
  }
}

const dbase = new NeDB<DBObj>(resolve(__dirname, "../../data/ursa.db"));

const index = async () => {
  // Get a list of all used dbrefs.
  const _index = (await dbase.find({})).map((obj) => obj.dbref);
  const mia: number[] = _index.reduce(function (acc: number[], cur, ind, arr) {
    var diff = cur - arr[ind - 1];
    if (diff > 1) {
      var i = 1;
      while (i < diff) {
        acc.push(arr[ind - 1] + i);
        i++;
      }
    }
    return acc;
  }, []);

  return [_index, mia];
};

export const dbref = async (ref?: number): Promise<number> => {
  const [_index, mia] = await index();
  const curr = _index.sort().pop() || 0;
  if (ref) {
    if (_index.indexOf(ref) != -1) {
      return ref;
    } else if (mia.length > 0) {
      mia.shift();
    } else {
      if (curr) {
        return curr + 1;
      } else {
        return curr + 1;
      }
    }
  } else if (mia) {
    mia.shift();
  }

  return curr + 1;
};

export default dbase;
