import commands from "../api/commands";
import { MuRequest } from "../api/parser";
import { target, DBObj } from "../api/database";
import mu from "../api/mu";
import flags from "../api/flags";

export default () => {
  commands.add({
    name: "set",
    flags: "connected admin+",
    pattern: /@set\s+?(.*)\s?=\s?(.*)/i,
    exec: async (req: MuRequest, args: string[]) => {
      const en = mu.connMap.get(req.socket.id) as DBObj;
      const res: string[] = [];

      const [lhs1, lhs2] = args[1].split("/");
      const [rhs1, rhs2] = args[2].split(":");
      const tar = await target(en, lhs1);

      for (const flag of rhs1.split(" ")) {
        const flg = flags.isFlag(flag);
        if (flg && flags.canSet(en, tar, flag)) {
          res.push(await flags.setFlag(tar, flag));
        } else {
          res.push(`Permission denied (**${flag}**).`);
        }
      }

      return {
        socket: req.socket,
        payload: {
          command: req.payload.command,
          message: res.join("\n"),
          data: req.payload.data
        }
      };
    }
  });
};
