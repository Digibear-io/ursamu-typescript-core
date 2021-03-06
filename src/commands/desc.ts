import mu, { db, payload, flags, attrs } from "../mu";
import { MuRequest, DBObj } from "../types";

export default () => {
  mu.cmd({
    name: "desc",
    flags: "connected",
    pattern: /@des[cription]+?\s+?(.*)\s?=\s?(.*)/i,
    exec: async (req: MuRequest, args: string[]) => {
      const en = mu.connections.get(req.socket.id) as DBObj;
      const tar = await db.target(en, args[1]);

      if (tar) {
        if (flags.canEdit(en, tar)) {
          await attrs.set(en, tar, "description", args[2]);
          await db.update({ _id: tar._id }, tar);
          return payload(req, {
            command: "command",
            message: "Description set.",
          });
        } else {
          return payload(req, {
            command: "command",
            message: "Permission denied.",
          });
        }
      } else {
        return payload(req, {
          command: "command",
          message: "I can't find that",
        });
      }
    },
  });
};
