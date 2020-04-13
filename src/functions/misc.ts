import parser, { Scope } from "../api/parser";
import { DBObj } from "../api/database";

export default () => {
  parser.add("image", async (en: DBObj, args: any[], scope: Scope) => {
    const name = args[0] ? await parser.evaluate(en, args[0], scope) : "";
    const url = args[1] ? await parser.evaluate(en, args[1], scope) : "";

    return `![${name}](${url})`;
  });

  parser.add("link", async (en: DBObj, args: any[], scope: Scope) => {
    const url = args[0] ? await parser.evaluate(en, args[0], scope) : "";
    const name = args[1] ? await parser.evaluate(en, args[1], scope) : "";

    return `<a href="${url}" target="_blank">${name || url}</a>`;
  });
};
