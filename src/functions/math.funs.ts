import parser from "../api/parser";
import { DBObj, Scope, Expression } from "../types";
import { hydrate } from "../utils";

export default () => {
  // MATHS!

  /**
   * Add a list of numbers together!
   */
  parser.add("add", async (en: DBObj, args: Expression[], scope: Scope) => {
    const arg = await hydrate(en, scope, ...args);
    return arg
      .map((ar) => parseInt(ar, 10))
      .reduce((p: number, c: number) => (p += c), 0)
      .toString();
  });
};
