import mu, { DbAdapter, UrsaMajor } from "../classes/ursamajor.class";
import DataStore from "nedb";

export interface DBObj {
  _id?: string;
  id?: string;
  name: string;
  type: "thing" | "player" | "room" | "exit";
  alias?: string;
  password?: string;
  attribites: Attribute[];
  flags: string[];
  location?: string;
  contents: string[];
  exits?: string[];
}

export interface Attribute {
  name: string;
  value: string;
  lastEdit: string;
}

export class NeDB<T> implements DbAdapter {
  app: UrsaMajor;
  path?: string;
  db: DataStore | undefined;

  constructor(path?: string) {
    this.app = mu;
    this.path = path || "";
  }

  /** create the database model  */
  model() {
    if (this.path) {
      this.db = new DataStore({
        filename: this.path,
        autoload: true
      });
    } else {
      this.db = new DataStore();
    }
  }

  /** Initialize the database */
  init() {
    this.model();
    this.app.register("db", this);
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
  get(query: any): Promise<T> {
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
  find(query: any): Promise<T | T[]> {
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
          if (err) reject(err);
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
        if (err) reject(resolve);
        return resolve(n);
      })
    );
  }
}
