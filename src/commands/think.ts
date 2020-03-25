import cmds from "../api/commands";
import mu from "../api/mu";
import parser from "../api/parser";

export default () => {
  cmds.add({
    name: "think",
    flags: "connected",
    pattern: /think\s+?(.*)/i,
    exec: async (id: string, args: string[]) => {
      const en = mu.connMap.get(id);
      return await parser.run(en!, args[1], {});
    }
  });
};
