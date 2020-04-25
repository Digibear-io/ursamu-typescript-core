import mu, { cmds, flags, MuRequest, MiddlewareNext, payload } from "../mu";

export default async (req: MuRequest, next: MiddlewareNext) => {
  const id = req.socket.id;
  const message = req.payload.message || "";
  let matched = cmds.match(message);

  const _hasFlags = () => {
    if (matched && mu.connections.has(id)) {
      const char = mu.connections.get(id);
      return flags.hasFlags(char!, matched.flags);
    } else {
      return false;
    }
  };

  if (matched && (!matched.flags || _hasFlags())) {
    // Matching command found!
    // run the command and await results
    const res: MuRequest = await matched
      .exec(req, matched.args)
      .catch((err: Error) => next(err, req));

    return next(
      null,
      payload(req, { data: { matched: matched ? true : false } })
    );
  } else if (!mu.connections.has(id)) {
    req.payload.data.matched = matched ? true : false;
    req.payload.message = "";
    return next(
      null,
      payload(req, { message: "", data: { matched: matched ? true : false } })
    );
  }

  return next(null, req);
};
