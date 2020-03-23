import { MiddlewareNext, MuRequest } from "../api/parser";
import cmds from "../api/cmds";
import flags from "../api/flags";
import mu from "../api/mu";
import { DBObj } from "../api/database";

export default async (req: MuRequest, next: MiddlewareNext) => {
  const id = req.socket.id;
  const message = req.payload.message || "";
  let matched = cmds.match(message);
  let flgs: Boolean;

  if (matched && mu.connMap.has(id)) {
    const char = mu.connMap.get(id);
    flgs = flags.hasFlags(char!, matched.flags);
  } else {
    flgs = false;
  }

  if (matched && (!matched.flags || flgs)) {
    // Matching command found!
    // run the command and await results
    const results = await matched
      .exec(id, matched.args)
      .catch((err: Error) => next(err, req));

    req.payload.matched = matched ? true : false;
    req.payload.message = results;
    return next(null, req);
  } else if (!mu.connMap.has(id)) {
    req.payload.matched = matched ? true : false;
    req.payload.message = "";
    return next(null, req);
  }

  return next(null, req);
};
