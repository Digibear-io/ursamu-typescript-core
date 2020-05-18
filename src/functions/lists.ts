import { parser } from "../mu";
import { DBObj, Scope, Expression } from "../types";
import { hydrate } from "../utils";

parser.add("iter", async (en: DBObj, args: Expression[], scope: Scope) => {
  const arg = await hydrate(en, scope, ...args);

  const iDelim = arg[2] || " ";
  const oDelim = arg[3] || iDelim;

  const output: string[] = [];
  for (const item of arg[0].split(iDelim)) {
    scope = {
      ...scope,
      ...{ "##": item, "#@": arg[0].split(iDelim).indexOf(item) + 1 },
    };
    const list = await parser.evaluate(en, args[1], scope);
    for (const item in list) {
      output.push(
        await parser.evaluate(en, list[item], scope).catch(() => list[item])
      );
    }
  }
  return output.join(oDelim);
});
