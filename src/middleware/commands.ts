import { MiddlewareNext, MuRequest } from "../classes/ursamajor.class";
import cmds from "../cmds";

export default async (req: MuRequest, next: MiddlewareNext) => {
  const id = req.socket.id;
  const message = req.payload.message || "";
  let matched = cmds.match(message);

  if (matched && !matched.flags) {
    // Matching command found!
    // run the command and await results
    const results = await matched
      .exec(id, matched.args)
      .catch((err: Error) => next(err, req));

    req.payload.matched = matched ? true : false;
    req.payload.message = results;
    return next(null, req);
  }

  return next(null, req);
};
