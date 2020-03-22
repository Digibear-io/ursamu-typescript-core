import { types } from "util";

export class MuCommand {
  private _pattern: RegExp | string;
  flags: string;
  name: string;

  constructor(name: string, pattern?: string | RegExp) {
    this.name = name;
    this._pattern = "";
    this.flags = "";
  }

  /**
   * Getter for the pattern.  Always return a regex string.
   */
  get pattern() {
    return types.isRegExp(this._pattern)
      ? this._pattern
      : this._globStringToRegex(this._pattern);
  }

  /**
   *  Set the pattern.
   */
  set pattern(str: string | RegExp) {
    this._pattern = str;
  }

  /**
   * Execute the command.
   * @param id The ID of the socket that invoked the command.
   * @param args The arguments captured from the wildcard strings
   * /RegExp of the command.
   */
  async exec(id: string, args: string[]): Promise<string> {
    return "#-1 Command Undefined.";
  }

  /**
   * Convert a wildcard(glob) string to a regular expression.
   * @param str The string to convert to regex.
   */
  private _globStringToRegex(str: string) {
    return new RegExp(
      this._preg_quote(str)
        .replace(/\\\*/g, ".*")
        .replace(/\\\?/g, "."),
      "gi"
    );
  }

  /**
   * Escape a string of characracters to be Regex escaped.
   * @param str The string to convert to a regex statement.
   * @param delimiter The character to seperate out words in
   * the string.
   */
  private _preg_quote(str: string, delimiter?: string) {
    // http://kevin.vanzonneveld.net
    // +   original by: booeyOH
    // +   improved by: Ates Goral (http://magnetiq.com)
    // +   improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
    // +   bugfixed by: Onno Marsman
    // +   improved by: Brett Zamir (http://brett-zamir.me)
    // *     example 1: preg_quote("$40");
    // *     returns 1: '\$40'
    // *     example 2: preg_quote("*RRRING* Hello?");
    // *     returns 2: '\*RRRING\* Hello\?'
    // *     example 3: preg_quote("\\.+*?[^]$(){}=!<>|:");
    // *     returns 3: '\\\.\+\*\?\[\^\]\$\(\)\{\}\=\!\<\>\|\:'
    return (str + "").replace(
      new RegExp(
        "[.\\\\+*?\\[\\^\\]$(){}=!<>|:\\" + (delimiter || "") + "-]",
        "g"
      ),
      "\\$&"
    );
  }
}

class commands {
  cmds: MuCommand[];

  constructor() {
    this.cmds = [];
  }

  /**
   * Add a new command to the system.
   * @param command The command object to be added to the system
   */
  add(command: MuCommand) {
    this.cmds.push(command);
  }

  /**
   * Match a string to a command pattern.
   * @param str The string to match the command against.
   */
  match(str: string) {
    return this.cmds
      .map(cmd => {
        const matched = str.match(cmd.pattern);
        if (matched) {
          return {
            args: matched,
            exec: cmd.exec,
            flags: cmd.flags
          };
        } else {
          return false;
        }
      })
      .filter(Boolean)[0];
  }
}

const cmds = new commands();
export default cmds;
