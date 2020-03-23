import { game } from "../config/config.json";
import db, { DBObj } from "./database";

export interface Flag {
  name: string;
  code: string;
  lvl: number;
}

class Flags {
  private flags: Flag[];
  constructor() {
    this.flags = game.flags;
  }

  /**
   * Add a new flag to the system.
   * @param flg the Flag object to add
   */
  addFlag(flg: Flag) {
    this.flags.push(flg);
  }

  /**
   * Check to see if a flag exists.
   * @param flg The name of the flag to check
   */
  isFlag(flg: string) {
    return this.flags.map(flag => flag.name).indexOf(flg) ? true : false;
  }

  /**
   * Check to see if the given DBObj has the listed flags.
   * @param tar The target DBObj
   * @param flgs The list of flags to check against.
   */
  hasFlags(tar: DBObj, flgs: string) {
    return flgs
      .split(" ")
      .map(flag => (tar.flags.indexOf(flag) ? true : false))
      .indexOf(false)
      ? false
      : true;
  }

  /**
   * Add a flag to a DBObj.
   * @param tar The target DBObj
   * @param flg The flag to be added.
   */
  async setFlag(tar: DBObj, flg: string) {
    const flagSet = new Set(tar.flags);
    if (this.isFlag(flg)) {
      flagSet.add(flg);
      tar.flags = Array.from(flagSet);
      return await db.update({ _id: tar._id }, tar);
    }
    return false;
  }

  /**
   * Get the full name of a flag from a fragment.
   * Returns the first result.
   * @param flg The flag to get the name of
   */
  flagName(flg: string) {
    return this.flags
      .filter(flag => flag.name.match(new RegExp(flg, "i")))
      .map(flag => flag.name)[0];
  }

  /**
   * Remove a flag from a DBObj
   * @param tar The DBObj to remove the flag from
   * @param flag The flag to remove.
   */
  async remFlag(tar: DBObj, flag: string) {
    tar.flags = tar.flags.filter(flag => flag !== this.flagName(flag));
    return await db.update({ _id: tar._id }, tar);
  }

  /**
   * Find a characters bitlevel (permission level).  The higher the level,
   * the more engine permissions.
   * @param tar The Target DBObj to compare.
   */
  private _bitLvl(tar: DBObj) {
    return this.flags
      .filter(flag => tar.flags.indexOf(flag.name))
      .map(flag => flag.lvl)
      .reduce((prev: number, curr: number) => (prev > curr ? prev : curr), 0);
  }

  canEdit(en: DBObj, tar: DBObj) {
    return this._bitLvl(en) >= this._bitLvl(tar) ? true : false;
  }
}

const flags = new Flags();
export default flags;
