import config from "./config";
import db from "./database";
import { DBObj } from "../types";

export interface Flag {
  name: string;
  code: string;
  lvl: number;
  lock?: string;
}

class Flags {
  private flags: Flag[];
  private static instance: Flags;
  private constructor() {
    this.flags = config.game.flags;
  }

  /**
   * Add a new flag to the system.
   * @param flg the Flag object to add
   */
  addFlag(flg: Flag) {
    this.flags.push(flg);
  }

  /**
   * Check to see if a flag exists.  Returns the flag object,
   * or undefined.
   * @param flg The name of the flag to check
   */
  isFlag(flg: string) {
    return this.flags.find((flag) =>
      flag.name.match(new RegExp(flg.replace(/[!\+]/, ""), "i"))
    );
  }

  /**
   * Check to see if the given DBObj has the listed flags.
   * @param tar The target DBObj
   * @param flgs The list of flags to check against.
   */
  hasFlags(tar: DBObj, flgs: string) {
    const res: Boolean[] = [];
    for (const flg of flgs.split(" ")) {
      const flag = this.isFlag(flg);
      if (flag) {
        // If target DOESN'T have a flag
        if (flg.startsWith("!")) {
          res.push(tar.flags.indexOf(flag.name) === -1 ? true : false);
        } else if (flg.endsWith("+")) {
          // If the target has bitlevel of this flag or greater.
          res.push(this._bitLvl(tar) >= flag.lvl ? true : false);
        } else {
          // else check for the existance of a flag within the target
          // flag list.
          res.push(tar.flags.indexOf(flag.name) >= 0 ? true : false);
        }
      } else {
        res.push(false);
      }
    }

    // Are there any false results?
    return res.indexOf(false) >= 0 ? false : true;
  }

  /**
   * Add a flag to a DBObj.
   * @param tar The target DBObj
   * @param flg The flag to be added.
   */
  async setFlag(tar: DBObj, flg: string) {
    const flagSet = new Set(tar.flags);

    // See if we're adding or removing a flag.
    if (flg.startsWith("!")) {
      // Get the full flag name.
      const flag = this.isFlag(flg);
      if (flag) {
        await this.remFlag(tar, flag.name);
        return `Flag (**${flag.name}**) removed.`;
      } else {
        return "Permission denied.";
      }
      // Update the targets flags!
    } else {
      const flag = this.isFlag(flg);
      if (flag) {
        flagSet.add(flg);
        tar.flags = Array.from(flagSet);
        await db.update({ _id: tar._id }, tar);

        return `Flag (**${flag.name}**) set.`;
      } else {
        return "Permission deined.";
      }
    }
  }

  /**
   * Check to see if the enactor is able to set a given
   * flag on the target.
   * @param en The enactor
   * @param tar The target
   * @param flg The flag to test if enactor can set.
   */
  canSet(en: DBObj, tar: DBObj, flg: string) {
    // Replace it with the full flag name.
    const flag = this.isFlag(flg);
    if (flag) {
      if (this.canEdit(en, tar)) {
        if ((flag.lock && this.hasFlags(en, flag.lock)) || !flag.lock)
          return true;
        return false;
      } else {
        return false;
      }
    } else {
      return false;
    }
  }

  /**
   * Remove a flag from a DBObj
   * @param tar The DBObj to remove the flag from
   * @param flag The flag to remove.
   */
  async remFlag(tar: DBObj, flag: string) {
    tar.flags = tar.flags.filter((flg) => {
      const flagName = this.isFlag(flg);
      if (flagName && flag !== flagName.name) return true;
      return false;
    });
    return await db.update({ _id: tar._id }, tar);
  }

  /**
   * Find a characters bitlevel (permission level).  The higher the level,
   * the more engine permissions.
   * @param tar The Target DBObj to compare.
   */
  private _bitLvl(tar: DBObj) {
    return (
      tar.flags
        .map((flag) => this.flags.find((flg) => flg.name === flag)?.lvl)
        ?.reduce((pre = 0, curr = 0) => {
          return pre < curr ? curr : pre;
        }, 0) || 0
    );
  }

  /**
   * Check to see if the enactor has the permission level to modify
   * the target
   * @param en The enacting DBObj
   * @param tar The targeted DBObj
   */
  canEdit(en: DBObj, tar: DBObj) {
    return this._bitLvl(en) >= this._bitLvl(tar) ? true : false;
  }

  codes(tar: DBObj) {
    return (
      tar.type.charAt(0) +
      this.flags
        .filter((flag: Flag) => tar.flags.indexOf(flag.name) != -1)
        .map((flag: Flag) => flag.code)
        .join("")
    );
  }

  static getInstance() {
    if (!Flags.instance) Flags.instance = new Flags();
    return Flags.instance;
  }
}

export default Flags.getInstance();
