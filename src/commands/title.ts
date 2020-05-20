import mu, { payload, db, flags, attrs } from "../mu";
import { DBObj, MuRequest } from "../types";

export default () =>
  mu.cmd({
    name: "title",
    flags: "connected admin+",
    pattern: /[\+@]?title\s+?(.*)\s?=\s?(.*)/i,
    exec: async (req: MuRequest, args: string[]) => {
      const en = mu.connections.get(req.socket.id) as DBObj;
      const tar = await db.target(en, args[1]);
      if (tar) {
        if (flags.canEdit(en, tar)) {
          await attrs.set(en, tar, "title", args[2]);
          await db.update({ _id: tar._id }, tar);
          return payload(req, {
            command: "command",
            message: `Done. title for ${tar.name} set.`,
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
          message: "I can't find that.",
        });
      }
    },
  });
