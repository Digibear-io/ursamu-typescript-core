import mu, { db, cmds, MuRequest, flags, DBObj, payload } from "../mu";

export default () => {
  cmds.add({
    name: "set",
    flags: "connected admin+",
    pattern: /@set\s+?(.*)\s?=\s?(.*)/i,
    exec: async (req: MuRequest, args: string[]) => {
      const en = mu.connections.get(req.socket.id) as DBObj;
      const res: string[] = [];

      const [lhs1, lhs2] = args[1].split("/");
      const [rhs1, rhs2] = args[2].split(":");
      const tar = await db.target(en, lhs1);
      if (tar) {
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
        return payload(req, {
          command: "command",
          message: "I can't find that.",
        });
      }
    },
  });
};
