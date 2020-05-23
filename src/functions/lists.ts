import { parser } from "../mu";
import { DBObj, Scope, Expression } from "../types";
import { hydrate } from "../utils";

// List Iterator
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

// Columns
// Usage: columns(<list>, <columns>[,<idelim>][,<fill>])
parser.add("columns", async (en: DBObj, args: Expression[], scope: Scope) => {
  let output = "";
  const arg = await hydrate(en, scope, ...args);
  const cols = parseInt(arg[1], 10) || 4;
  const sep = arg[2] || " ";

  // Start building the flexbox based rows.
  output += "<div style='display: flex; flex-flow: row wrap'>";
  output += arg[0]
    .split(sep)
    .map(
      (entry: string) =>
        `<div style='flex-basis: ${780 / cols}px'>${entry}</div>`
    )
    .join(" ");
  output += "</div>";

  return output;
});
