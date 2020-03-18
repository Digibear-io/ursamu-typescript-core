import { MiddlewareNext, UrsaMajor } from "../classes/ursamajor.class";

export default async (
  data: string = "{}",
  next: MiddlewareNext,
  app: UrsaMajor
) => {
  const { id = "", message = "" } = JSON.parse(data);
  let matched = false;

  for (const cmd of Array.from(app.cmds.values())) {
    const { pattern, exec, flags } = cmd;
    const match = message.match(pattern);

    if (match && !flags) {
      // Matching command found!
      // run the command and await results
      const results = await exec(id, match).catch((err: Error) =>
        next(err, data)
      );

      if (results) matched = true;
      return next(null, JSON.stringify({ id, message: results, matched }));
    }
  }
  return next(null, JSON.stringify({ id, message, matched }));
};
