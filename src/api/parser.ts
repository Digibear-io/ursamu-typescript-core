import peg from "pegjs";
import { readFileSync } from "fs";
import { resolve } from "path";
import { loadDir } from "../utils";
import services from "./services";
import { payload } from "../mu";
import { MuFunction, MuRequest, DBObj, Scope } from "../types";
import { VM } from "vm2";
import vmGlobals from "./vmGlobals";

export class Parser {
  private static instance: Parser;
  private fns: Map<string, MuFunction>;

  private constructor() {
    this.fns = new Map();
  }

  static getInstance() {
    if (!this.instance) this.instance = new Parser();
    return this.instance;
  }

  /**
   * Process a request object form the client
   * @param req The request object.
   */
  async process(req: MuRequest): Promise<MuRequest> {
    const command = req.payload.command.toLowerCase();
    if (services.has(command)) {
      return services.get(command)!.exec(req);
    } else {
      return payload(req, { command: "error", message: "Service not found" });
    }
  }

  /**
   * Remove '%' substitutions from a string of text.
   * @param text The string to remove substitutions from.
   */
  stripSubs(text: string) {
    return text.replace(/%[^;]+;/g, "");
  }

  htmlEscape(text: string) {
    return text
      .replace(/&/g, "&amp;")
      .replace(/</, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(" ", "&nbsp;");
  }

  colorSub(text: string) {
    return (
      this.htmlEscape(text)
        .replace(/%[cx]([\w\d]+);/g, "<span style='color: $1'>")
        .replace(/%[cx]n;/g, "</span>")

        // Backgrounds
        .replace(/%[CX](.*);/g, "<span style = 'background-color: $1'>")

        .replace(/%b;/g, "<span style = 'font-weight: bold'>")

        // Other substitutions
        .replace(/%t;/gi, "&nbsp;".repeat(4))
        .replace(/%b;/gi, "&nbsp;")
        .replace(/%r;/gi, "</br>")

        // HTML escape codes!
        .replace(/%</g, "&lt;")
        .replace(/%>/g, "&gt;")
    );
  }

  parse(en: DBObj, text: string) {
    const vm = new VM({ sandbox: vmGlobals });
    try {
      return `${vm.run(text)}`;
    } catch (error) {
      throw error;
    }
  }
}

export default Parser.getInstance();
