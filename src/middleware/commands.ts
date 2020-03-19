import mu, { MiddlewareNext, MuRequest } from "../classes/ursamajor.class";

export default async (req: MuRequest, next: MiddlewareNext) => {
  const id = req.socket.id;
  const message = req.payload.message;
  let matched = false;

  for (const cmd of mu.cmds) {
    const { pattern, exec, flags } = cmd;
    const match = message?.match(pattern);

    if (match && !flags) {
      // Matching command found!
      // run the command and await results
      const results = await exec(id, match).catch((err: Error) =>
        next(err, req)
      );

      if (results) matched = true;
      req.payload.matched = matched;
      req.payload.message = results;
      return next(null, req);
    }
  }

  req.payload.matched = matched;
  return next(null, req);
};
