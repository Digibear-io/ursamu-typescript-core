import { MiddlewareNext, MuRequest } from "../api/parser";
import cmds from "../api/commands";
import flags from "../api/flags";
import mu from "../api/mu";

export default async (req: MuRequest, next: MiddlewareNext) => {
  const id = req.socket.id;
  const message = req.payload.message || "";
  let matched = cmds.match(message);

  const _hasFlags = () => {
    if (matched && mu.connMap.has(id)) {
      const char = mu.connMap.get(id);
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

    req.payload.data.matched = matched ? true : false;
    req.payload.message = res.payload.message;
    req.payload.data = res.payload.data;
    return next(null, req);
  } else if (!mu.connMap.has(id)) {
    req.payload.data.matched = matched ? true : false;
    req.payload.message = "";
    return next(null, req);
  }

  return next(null, req);
};
