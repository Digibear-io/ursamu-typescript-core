import { DbAdapter, UrsaMajor } from "../classes/ursamajor.class";
import DataStore from "nedb";

export interface DBObj {
  _id?: string;
  name: string;
  type: "thing" | "player";
  alias?: string;
  password?: string;
  attribites: Attribute[];
  flags: string[];
  location: string;
  contents: string[];
}

export interface Attribute {
  name: string;
  value: string;
  lastEdit: string;
}

export class NeDB implements DbAdapter {
  app: UrsaMajor;
  path: string;
  db: DataStore | undefined;

  constructor({ app, path }: { app: UrsaMajor; path: string }) {
    this.app = app;
    this.path = path;
  }

  /** create the database model  */
  model() {
    this.db = new DataStore({
      filename: this.path,
      autoload: true
    });
  }

  /** Initialize the database */
  init() {
    this.model();
    this.app.register("db", this);
    console.log(`Database loaded: ${this.path}`);
  }

  /** Create a new DBObj */
  create(data: DBObj): Promise<DBObj> {
    return new Promise((resolve: any, reject: any) =>
      this.db?.insert(data, (err: Error, doc: DBObj) => {
        if (err) reject(err);
        return resolve(doc);
      })
    );
  }

  /**
   * Get a single database document.
   * @param query The query object to search for.
   */
  get(query: any): Promise<DBObj> {
    return new Promise((resolve: any, reject: any) =>
      this.db?.findOne<DBObj>(query, (err: Error, doc: DBObj) => {
        if (err) reject(err);
        return resolve(doc);
      })
    );
  }

  /**
   * Find an array of documents that match the query
   * @param query The query object.
   */
  find(query: any): Promise<DBObj | DBObj[]> {
    return new Promise((resolve: any, reject: any) =>
      this.db?.find<DBObj>(query, (err: Error, docs: DBObj[]) => {
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
  update(query: any, data: any): Promise<DBObj | DBObj[]> {
    return new Promise((resolve: any, reject: any) =>
      this.db?.update(
        query,
        data,
        { returnUpdatedDocs: true },
        (err: Error, _, docs: DBObj) => {
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
