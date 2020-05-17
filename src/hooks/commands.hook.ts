import mu, { cmds, flags, payload } from "../mu";
import { MuRequest } from "../types";

export default async (req: MuRequest) => {
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
      .catch((err: Error) =>
        payload(req, {
          command: "error",
          message: err.message,
          data: { error: err },
        })
      );

    return payload(res, { data: { matched: matched ? true : false } });
  } else if (!mu.connections.has(id)) {
    req.payload.data.matched = matched ? true : false;
    req.payload.message = "";
    return payload(req, { data: { matched: matched ? true : false } });
  }

  return req;
};
