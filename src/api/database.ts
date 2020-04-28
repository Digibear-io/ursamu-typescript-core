import DataStore from "nedb";
import { resolve } from "path";
import { DbAdapter, DBObj } from "../mu";

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
        return this.get({ id: en.location });
      } else {

        return this.get({
          $where: function () {
            if (this.name.toLowerCase() === tar) return true;
            return false;
          },
        });
      }
    } else {
      return this.get({ id: en.location });
    }
  }
}

export default new NeDB<DBObj>(resolve(__dirname, "../../data/ursa.db"));
