import { HelpEntry } from "../types";

export class HelpSys {
  private static instance: HelpSys;
  private _help: Map<string, HelpEntry>;
  private constructor() {
    this._help = new Map();
  }

  /**
   * Add a new help entry to the system.
   * @param name The name of the help entry to add
   * @param entry The help entry
   */
  add(name: string, entry: HelpEntry) {
    if (!entry.category) entry.category = "general";
    this._help.set(name, entry);
  }

  catagories() {
    return Array.from(this._help.keys())
      .map((help: string) => this._help.get(help)?.category)
      .reduce((prev: string[], curr) => {
        if (curr && prev.indexOf(curr) < 0) {
          prev.push(curr);
        }
        return prev;
      }, [])
      .filter(Boolean)
      .sort();
  }

  /**
   * List a series of helpfiles based on category and visibility.
   * @param cat The category of help file topics to list
   */
  catagory(cat: string) {
    const output = [];
    for (const [k, v] of this._help.entries()) {
      if (v.category?.toLowerCase() === cat.toLowerCase() && v.visible) {
        output.push(k);
      }
    }
    return output;
  }

  /**
   * Get a single help entry.
   * @param name The name of the help entry
   */
  get(name: string) {
    return this._help.get(name);
  }

  /**
   * Get a (new)instance of the HelpSys Class.
   */
  static getInstance() {
    if (!this.instance) {
      HelpSys.instance = new HelpSys();
    }

    return HelpSys.instance;
  }

  toggle(name: string) {
    if (this._help.has(name)) {
      const entry = this._help.get(name);
      if (entry) {
        entry.visible = true;
        this._help.set(name, entry);
      }
    }
  }
}

export default HelpSys.getInstance();
