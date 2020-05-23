import mu, { db, flags, payload, attrs } from "../mu";
import { MuRequest, DBObj } from "../types";

export default () => {
  mu.cmd({
    name: "set",
    flags: "connected admin+",
    pattern: /@set\s+?(.*)\s?=\s?(.*)/gi,
    exec: async (req: MuRequest, args: string[]) => {
      const en = mu.connections.get(req.socket.id) as DBObj;
      const res: string[] = [];

      const [lhs1, lhs2] = args[1].split("/");
      const [rhs1, rhs2] = args[2].split(":");
      const tar = await db.target(en, lhs1);
      if (tar) {
        // This is setting a flag, not an attribute.
        if (!rhs2) {
          for (const flag of rhs1.split(" ")) {
            const flg = flags.isFlag(flag);
            if (flg && flags.canSet(en, tar, flag)) {
              res.push(await flags.setFlag(tar, flag));
            } else {
              res.push(`Permission denied (**${flag}**).`);
            }
          }
          return payload(req, { command: "command", message: res.join("\n") });
        } else {
          await attrs.set(en, tar, rhs1, rhs2);
          return payload(req, {
            message: `Attribute **${rhs1.toUpperCase()}** set on ${db.name(
              en,
              tar
            )}.`,
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
};
