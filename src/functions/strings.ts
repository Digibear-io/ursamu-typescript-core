import { parser, db } from "../mu";
import { DBObj, Scope, Expression } from "../types";
import { hydrate } from "../utils";

// In order to keep things DRY, creating a function expression to render filler strings.
const repeatString = (string = " ", length: number) => {
  // Check to see if the filler string contains ansii substitutions.  If so
  // split the characters of the string into an array and apply ansii substitutions.
  // Else just split the filler string into an array.

  // check how many spaces are left after the filler string is rendered. We will need
  // to render these last few spaces manually.
  const remainder = Math.floor(length % parser.stripSubs(string).length);

  // Split the array and filter out empty cells.
  let cleanArray = string.split("%");
  // If the array length is longer than 1 (more then one cell), process for ansii
  if (cleanArray.length > 1) {
    // If it's just a clear formatting call 'cn' then we don't need to worry
    // about it.  We'll handle making sure ansii is cleared after each substitution manually.

    cleanArray = cleanArray.filter((cell) => {
      if (cell.toLowerCase() !== "cn;") {
        return "&" + cell;
      }
    });
  } else {
    cleanArray = cleanArray[0].split("");
  }
  return (
    string.repeat(length / parser.stripSubs(string).length) +
    cleanArray.slice(0, remainder)
  );
};

// Center text.
parser.add("center", async (en: DBObj, args: Expression[], scope: Scope) => {
  if (args.length < 2) {
    throw new SyntaxError("center requires at least 2 arguments");
  } else {
    const arg = await hydrate(en, scope, ...args);
    const message = arg[0];
    const width = parseInt(arg[1], 10);
    const repeat = arg[2] ? arg[2] : " ";

    // Check to see if the second arg is an integer
    if (Number.isInteger(width)) {
      // run the substitutions so I can strip away the ansi non-printables
      // while still retaining any spaces around the message.
      const length = (width - parser.stripSubs(message).length) / 2;
      const remainder = (width - parser.stripSubs(message).length) % 2;

      return (
        repeatString(repeat, length) +
        message +
        repeatString(repeat, length + remainder).replace(/\s/g, "&nbsp;")
      );
    } else {
      throw new SyntaxError("center expects length as a number.");
    }
  }
});

// ljust
parser.add("ljust", async (en: DBObj, args: Expression[], scope: Scope) => {
  if (args.length < 2) {
    throw new SyntaxError("ljust requires at least 2 arguments");
  } else {
    const arg = await hydrate(en, scope, ...args);
    const message = arg[0];
    const width = parseInt(arg[1], 10);
    const repeat = arg[2] ? arg[2] : " ";

    // Check to see if the second arg is an integer
    if (Number.isInteger(width)) {
      // run the substitutions so I can strip away the ansi non-printables
      // while still retaining any spaces around the message.
      const length = width - parser.stripSubs(message).length;

      return (
        message +
        repeatString(repeat, length)
          .replace(/\s/g, "&nbsp;")
          .replace(/\s/g, "&nbsp;")
      );
    } else {
      throw new SyntaxError("ljust expects length as a number.");
    }
  }
});

// rjust
parser.add("rjust", async (en: DBObj, args: Expression[], scope: Scope) => {
  if (args.length < 2) {
    throw new SyntaxError("rjust requires at least 2 arguments");
  } else {
    const arg = await hydrate(en, scope, ...args);
    const message = arg[0];
    const width = parseInt(arg[1], 10);
    const repeat = arg[2] ? arg[2] : " ";

    // Check to see if the second arg is an integer
    if (Number.isInteger(width)) {
      // run the substitutions so I can strip away the ansi non-printables
      // while still retaining any spaces around the message.
      const length = width - parser.stripSubs(message).length;

      return repeatString(repeat, length) + message.replace(/\s/g, "&nbsp;");
    } else {
      throw new SyntaxError("rjust expects length as a number.");
    }
  }
});

// repeat
parser.add("repeat", async (en: DBObj, args: Expression[], scope: Scope) => {
  const repeat = parseInt(await parser.evaluate(en, args[1], scope), 10);
  const arg = await hydrate(en, scope, ...args);
  return arg[0].repeat(repeat).replace(/\s/g, "&nbsp;");
});

// Name
parser.add("name", async (en: DBObj, args: Expression[], scope: Scope) => {
  const tar = await db.get({ _id: await parser.evaluate(en, args[0], scope) });
  if (tar) {
    return db.name(en, tar);
  } else {
    return "#-1";
  }
});
