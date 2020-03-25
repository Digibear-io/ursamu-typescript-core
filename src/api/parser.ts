import { Socket } from "socket.io";
import { Marked } from "@ts-stack/markdown";
import text from "../api/text";
import peg from "pegjs";
import { readFileSync } from "fs";
import { resolve } from "path";
import { DBObj } from "./database";
import { loadDir } from "./utils";

export type MiddlewareNext = (
  err: Error | null,
  req: MuRequest
) => Promise<any>;

export type MiddlewareLayer = (
  data: MuRequest,
  next: MiddlewareNext
) => Promise<MuResponse>;

export interface MuRequest {
  socket: Socket;
  payload: {
    command: string;
    message?: string;
    [key: string]: any;
  };
}
export interface MuResponse {
  id: string;
  payload: {
    command: string;
    message?: string;
    [key: string]: any;
  };
}

export type MuFunction = (
  enactor: DBObj,
  args: Array<Expression | string | number>,
  scope: Scope
) => Promise<any>;

export interface Expression {
  type: string;
  value: string;
  list?: Expression[];
  operator: {
    type: string;
    value: string;
  };
  location?: {
    start: {
      offset: number;
      line: number;
      column: number;
    };
    end: {
      offset: number;
      line: number;
      column: number;
    };
  };
  args: Array<string | Expression>;
}

export interface Scope {
  [key: string]: any;
}

export class Parser {
  private stack: MiddlewareLayer[];
  private static instance: Parser;
  private peg: any;
  private parser: peg.Parser;
  private fns: Map<string, MuFunction>;
  private constructor() {
    this.stack = [];
    this.peg = readFileSync(resolve(__dirname, "../../mushcode.pegjs"), {
      encoding: "utf8"
    });
    this.parser = peg.generate(this.peg);
    this.fns = new Map();
    loadDir("../functions/", (name: string) =>
      console.log(`Module loaded: ${name}`)
    );
  }

  static getInstance() {
    if (!this.instance) this.instance = new Parser();
    return this.instance;
  }

  /**
   * Process a request object frin tge ckuebt
   * @param req The request object.
   */
  async process(req: MuRequest): Promise<MuResponse> {
    const command = req.payload.command;
    const socket = req.socket;
    const message = req.payload.message;
    const data = req.payload.data;

    switch (command) {
      case "message":
        return this._handle(req);
      case "connect":
        return {
          id: socket.id,
          payload: {
            command: "message",
            message: text.get("connect")
              ? Marked.parse(text.get("connect"))
              : "File Not Found!"
          }
        };
      default:
        return {
          id: socket.id,
          payload: {
            command: "message",
            message
          }
        };
    }
  }

  /**
   * Add a new middleware to text input stack.
   * @param layer The layer to add to the middleware stack.
   */
  use(layer: MiddlewareLayer) {
    this.stack.push(layer);
  }

  /**
   * Run a string through a series of middleware.
   * @param data The string to be pushed through the pipeline.
   */
  private async _handle(req: MuRequest): Promise<MuResponse> {
    let idx = 0;

    /**
     * Recursive function to walk through each piece of
     * middleware in the stack.
     * @param err Any possible errors hit by the middleware.
     * @param data The string the middleware pipeline is going
     * to be working with
     */
    const next = async (
      err: Error | null,
      req: MuRequest
    ): Promise<MuResponse> => {
      // Return early if there's an error, or if we've processed through
      // the entire stack.
      if (err != null) return Promise.reject(err);
      if (idx === this.stack.length) {
        return {
          id: req.socket.id,
          payload: req.payload
        };
      }

      // Grab a new layer from the stack
      const layer = this.stack[idx++];
      // Run the layer
      return await layer(req, next);
    };

    // Return the modified data.
    return await next(null, req).catch((err: Error) => next(err, req));
  }

  /**
   * Parse a string for syntax
   * @param code
   */
  parse(code: string) {
    try {
      return this.parser.parse(code);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Add a new softcode function to the system
   * @param name The name of the function
   * @param func The code to be called when the function
   * name is matched.
   */
  add(name: string, func: MuFunction) {
    this.fns.set(name.toLowerCase(), func);
  }

  /**
   * Evaluate a mushcode expression AST.
   * @param en The enacting DBObj
   * @param expr The expression to be evaluated
   * @param scope Any variables, substitutions or special forms
   * that affect the lifetime of the expression.
   */
  async evaluate(en: DBObj, expr: Expression, scope: Scope) {
    // First we need to see what kind of expression we're working with.
    // If it's a word, then check to see if it has special value in
    // scope, or if it's just a word.
    if (expr.type === "word") {
      expr.value = expr.value || "";
      if (scope[expr.value]) {
        return scope[expr.value];
      } else {
        let output = expr.value;
        for (const key in scope) {
          output = output.replace(new RegExp(key, "gi"), scope[key]);
        }
        return output;
      }
      // If the expression is a function...
    } else if (expr.type === "function") {
      const operator = expr.operator;

      // Make sure it's operator exists in the Map...
      if (operator.type === "word" && this.fns.has(operator.value)) {
        const func = this.fns.get(operator.value);
        if (func) {
          // Execute it and return the results.
          return await func(en, expr.args, scope);
        }
      }

      // If it's a list (operations seperated by square brackets)
      // Process each item in the list.
    } else if (expr.type === "list") {
      let output;
      for (let i = 0; i < expr.value!.length; i++) {
        output += await this.evaluate(en, expr.list![i], scope);
      }
      return output;
      // Else throw an error, unknown operation!
    } else {
      throw new Error("Unknown Expression.");
    }
  }

  /**
   * Run the parser on the input string.
   * @param en the enacting DBObj
   * @param string The string to be run through the parser.
   * @param scope Any variables, substitutions or special forms
   * that affect the lifetime of the expression.
   */
  async run(en: DBObj, string: string, scope: Scope) {
    try {
      return await this.evaluate(en, this.parse(string), scope);
    } catch (error) {
      return await this.string(en, string, scope);
    }
  }

  async string(en: DBObj, text: string, scope: Scope) {
    let parens = -1;
    let brackets = -1;
    let match = false;
    let workStr = "";
    let output = "";
    let start = -1;
    let end = -1;

    // Loop through the text looking for brackets.
    for (let i = 0; i < text.length; i++) {
      if (text[i] === "[") {
        brackets = brackets > 0 ? brackets + 1 : 1;
        start = start > 0 ? start : i;
        match = true;
      } else if (text[i] === "]") {
        brackets = brackets - 1;
      } else if (text[i] === "(") {
        parens = parens > 0 ? parens + 1 : 1;
      } else if (text[i] === ")") {
        parens = parens - 1;
      }

      // Check to see if brackets are evenly matched.
      // If so process that portion of the string and
      // replace it.
      if (match && brackets !== 0 && parens !== 0) {
        workStr += text[i];
      } else if (match && brackets === 0 && parens === 0) {
        // If the brackets are zeroed out, replace the portion of
        // the string with evaluated code.
        workStr += text[i];
        end = i;

        // If end is actually set (We made it past the first characracter),
        // then try to parse `workStr`.  If it won't parse (not an expression)
        // then run it through string again just to make sure.  If /that/ fails
        // error.
        if (end) {
          let results = await this.run(en, workStr, scope).catch(async () => {
            output += await this.string(en, workStr, scope).catch(console.log);
          });
          // Add the results to the rest of the processed string.
          output += results;
        }

        // Reset the count variables.
        parens = -1;
        brackets = -1;
        match = false;
        start = -1;
        end = -1;
      } else {
        // If stray paren or bracket slips through, add it to `workStr`
        // else add it right to the output.  There's no code there.
        if (text[i].match(/[\[\]\(\)]/)) {
          workStr += text[i];
        } else {
          output += text[i];
        }
      }
    }
    // Return the evaluated text
    return output ? output : workStr;
  }
}

export default Parser.getInstance();
