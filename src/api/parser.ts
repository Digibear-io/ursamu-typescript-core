import peg from "pegjs";
import { readFileSync } from "fs";
import { resolve } from "path";
import { loadDir } from "../utils";
import services from "./services";
import { payload } from "../mu";
import {
  MiddlewareLayer,
  MuFunction,
  MuService,
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
  private services: Map<string, MuService>;

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
   * Process a request object frin tge ckuebt
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
   * Strip ansi substitutions from a string.
   * @param string The string to remove the substitution characters from
   */
  stripSubs(string: string) {
    // Remove color codes
    return string
      .replace(/%c[\w\d]+;/g, "")
      .replace(/&lt;/g, " ")
      .replace(/&gt;/g, " ")
      .replace(/&lpar;/g, " ")
      .replace(/&rpar;/g, " ")
      .replace(/<span.*>/, "")
      .replace(/<\span>/, "");
  }

  colorSub(text: string) {
    return (
      text
        .replace(/%[cx]([\w\d]+);/g, "<span style='color: $1'>")
        .replace(/%[cx]n;/g, "</span>")

        // Backgrounds
        .replace(/%[CX](.*);/g, "<span style = 'background-color: $1'>")

        .replace(/%b;/g, "<span style = 'font-weight: bold'>")

        // Other substitutions
        .replace(/%t;/gi, "&nbsp;".repeat(4))
        .replace(/%b;/gi, "&nbsp;")
        .replace(/%n;/gi, "</br>")
    );
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

  async string(en: DBObj, text: string, scope: Scope) {
    let parens = -1;
    let brackets = -1;
    let match = false;
    let workStr = "";
    let output = "";
    let start = -1;
    let end = -1;

    // replace out any scoped variables:
    for (const sub in scope) {
      text = text.replace(sub, scope[sub]);
    }

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
          let results = await this.evaluate(
            en,
            this.parse(workStr),
            scope
          ).catch(async (err) => (output += workStr));
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
