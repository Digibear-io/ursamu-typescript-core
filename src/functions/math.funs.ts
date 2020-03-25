import parser, { Expression, Scope } from "../api/parser";
import { DBObj } from "../api/database";

export default () => {
  // MATHS!

  /**
   * Add a list of numbers together!
   */
  parser.add("add", async (en: DBObj, args: any[], scope: Scope) => {
    let total = 0;
    for (const arg of args) {
      // We have to evaluate any argument we want to work with, because it's
      // still in expression AST form.  It could be anything at this point.
      // this will recursively trigger each expression in the tree.
      total += parseInt(await parser.evaluate(en, arg, scope), 10);
    }
    return total.toString();
  });
};
