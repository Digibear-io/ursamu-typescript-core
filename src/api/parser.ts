import peg from "pegjs";
import { readFileSync } from "fs";
import { resolve } from "path";
import { loadDir } from "../utils";
import { payload } from "../mu";
import {
  MiddlewareLayer,
  MuFunction,
  Service,
  MuRequest,
  DBObj,
  Expression,
  Scope,
} from "../types";

export class Parser {
  private stack: MiddlewareLayer[];
  private static instance: Parser;
  private peg: any;
  private parser: peg.Parser;
  private fns: Map<string, MuFunction>;
  private services: Map<string, Service>;

  private constructor() {
    this.stack = [];
    this.peg = readFileSync(resolve(__dirname, "../../mushcode.pegjs"), {
      encoding: "utf8",
    });
    this.parser = peg.generate(this.peg);
    this.fns = new Map();
    this.services = new Map();
    console.log("Loading functions...");
    loadDir("./functions/", (name: string, loaded: Boolean) => {
      if (!loaded) console.log(`Function failed to load: ${name}`);
    });
  }

  static getInstance() {
    if (!this.instance) this.instance = new Parser();
    return this.instance;
  }

  /**
   * Add a service to execute different serverside
   * commands from the client, and not player input.
   * Things like: message processing, connecting,
   * disconnecting, character creation, etc.
   * @param name The name of the service to add.
   * @param service The actual service to perform and
   * return.
   */
  service(name: string, service: Service) {
    this.services.set(name, service);
  }

  /**
   * Process a request object frin tge ckuebt
   * @param req The request object.
   */
  async process(req: MuRequest): Promise<MuRequest> {
    const command = req.payload.command.toLowerCase();

    if (this.services.has(command)) {
      return this.services.get(command)!(req);
    } else if (command === "message") {
      return this._handle(req);
    } else {
      return payload(req, { command: "message" });
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
  private async _handle(req: MuRequest): Promise<MuRequest> {
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
    ): Promise<MuRequest> => {
      // Return early if there's an error, or if we've processed through
      // the entire stack.
      if (err != null) return Promise.reject(err);
      if (idx === this.stack.length) {
        return Promise.resolve(req);
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
   * Strip ansi substitutions from a string.
   * @param string The string to remove the substitution characters from
   */
  stripSubs(string: string) {
    // Remove color codes
    return string.replace(/%[cCxX]./g, "").replace(/%./g, "");
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

          // Evaluate the args for recursive functions before
          // envoking the function.
          const args: string[] = [];
          for (const arg of expr.args) {
            args.push(await this.evaluate(en, arg, scope));
          }

          return await func(en, args, scope);
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
      string = string.replace(/%[(]/g, "\u250D").replace(/%[)]/g, "\u2511");
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
          let results = await this.run(en, workStr, scope).catch(
            async (err) => console.error
          );
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
