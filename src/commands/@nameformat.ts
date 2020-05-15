import mu, { cmds, flags, db, attrs, payload } from "../mu";
import { MuRequest } from "../types";

export default () => {
  cmds.add({
    name: "@nameformat",
    pattern: /@nameformat\s+?(\w+)\s?=\s?(.*)/,
    flags: "connected",
    exec: async (req: MuRequest, args: string[]) => {
      const en = mu.connections.get(req.socket.id);
      const tar = await db.target(en!, args[1]);

      if (flags.canEdit(en!, tar!)) {
        if (tar) {
          attrs.set(en!, tar, "nameformat", args[2]);
          return payload(req, {
            message: `**Done.** @nameformat set om ${tar.name}`,
          });
        } else {
          return payload(req, {
            command: "error",
            message: "target not found.",
          });
        }
      } else {
        return payload(req, {
          command: "error",
          message: "Permission denied.",
        });
      }
    },
  });
};
