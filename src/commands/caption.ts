import mu, { cmds, MuRequest, payload, db, flags, DBObj } from "../mu";

export default () =>
  cmds.add({
    name: "caption",
    flags: "connected admin+",
    pattern: /@caption\s+?(.*)\s?=\s?(.*)/i,
    exec: async (req: MuRequest, args: string[]) => {
      const en = mu.connections.get(req.socket.id) as DBObj;
      const tar = await db.target(en, args[1]);
      if (tar) {
        if (flags.canEdit(en, tar)) {
          tar.caption = args[2];
          await db.update({ _id: tar._id }, tar);
          return payload(req, {
            command: "command",
            message: `Done. Caption for ${tar.name} set.`,
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
