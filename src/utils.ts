import { readdirSync, readFileSync } from "fs";
import { resolve } from "path";
import mu from "./mu";

/**
 * Load modules from a directory with a given extension.
 * @param path The path of the directory to load
 * @param extension The file extension to match
 * @param callback Code returned with every module that's loaded.
 * if no callback is provided an event is emitted.
 */
export const loadDir = async (
  path: string,
  callback?: (name: string, loaded: Boolean) => any
) => {
  const dir = readdirSync(resolve(__dirname, path), { withFileTypes: true });
  for (const dirent of dir) {
    if (dirent.isFile() && dirent.name.endsWith(".ts")) {
      const module = await import(
        resolve(resolve(__dirname, path, dirent.name))
      ).catch((err: Error) => console.log(err));
      let loaded = false;
      if (typeof module.default === "function") {
        loaded = true;
        module.default();
        const name = resolve(__dirname, path, dirent.name).split(".")[0];
        if (typeof callback === "function") {
          callback(name, loaded);
        } else {
          mu.emit("loaded", name, loaded);
        }
      }
    }
  }
};

export const loadText = async (path: string) => {
  const dir = readdirSync(resolve(__dirname, path), { withFileTypes: true });
  for (const dirent of dir) {
    if (dirent.isFile() && dirent.name.endsWith(".md")) {
      const file = readFileSync(resolve(__dirname, path, dirent.name), {
        encoding: "utf8",
      });
      mu.text.set(dirent.name.split(".")[0], file);
    }
  }
};

/**
 * Framework for singleton classes to reduce complexity.  Woot!
 */
export class Singleton {
  private static _instance: Singleton = new Singleton();

  constructor() {
    if (Singleton._instance) {
      throw new Error(
        "Error: Instantiation failed. Use getInstance() instead."
      );
    }
    Singleton._instance = this;
  }

  public getInstance() {
    return Singleton._instance;
  }
}
