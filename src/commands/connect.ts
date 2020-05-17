import mu, { payload } from "../mu";
import { MuRequest } from "../types";
import services from "../api/services";

export default () => {
  mu.cmd({
    name: "connect",
    pattern: /connect\s+?(.*)\s+?(.*)/i,
    exec: async (req: MuRequest, args: string[]) => {
      let user = args[1];
      let password = args[2];

      return (await services
        .get("connect")
        ?.exec(payload(req, { data: { user, password } }))) as MuRequest;
    },
  });
};
