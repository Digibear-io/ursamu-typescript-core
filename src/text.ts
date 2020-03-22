import { readFile, readdirSync, readFileSync } from "fs";
import { resolve } from "path";

export interface FileInfo {
  name: string;
  text: string;
  category: string;
}

class TextFiles {
  private _index: FileInfo[];
  constructor() {
    this._index = [];
  }

  load(path: string, category: string = "general") {
    const dir = readdirSync(resolve(__dirname, path), {
      encoding: "utf8",
      withFileTypes: true
    });

    // load files.
    dir.forEach(dirent => {
      if (dirent.isFile() && dirent.name.toLowerCase().endsWith(".md")) {
        const name = dirent.name?.split(".")[0].toLowerCase();
        const text = readFileSync(resolve(__dirname, path, dirent.name), {
          encoding: "utf8"
        });
        return this._index.push({ name, text, category });
      } else if (dirent.isDirectory()) {
        this.load(resolve(__dirname, path, dirent.name), dirent.name);
      }
    });
  }

  get(name: string, category = "general") {
    const results = this._index.find(
      file =>
        file.name.toLowerCase() === name.toLowerCase() &&
        file.category.toLowerCase() === category.toLowerCase()
    );

    if (results) {
      return results.text;
    } else {
      return "";
    }
  }
}

const text = new TextFiles();
export default text;
