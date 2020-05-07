import mu, { parser } from "../mu";
import { MuRequest } from "../types";

export default () => {
  mu.cmd({
    name: "think",
    flags: "connected",
    pattern: /^think\s+?(.*)/,
    exec: async (req: MuRequest, args: string[]) => {
      const en = mu.connections.get(req.socket.id);
      return {
        socket: req.socket,
        payload: {
          command: "think",
          message: await parser.run(en!, args[1], {}),
          data: req.payload.data,
        },
      };
    },
  });
};
