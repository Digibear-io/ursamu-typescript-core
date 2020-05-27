import mu, { payload } from "../mu";
import { MuRequest, DBObj } from "../types";
import { VM } from "vm2";
import vmGlobals from "../api/vmGlobals";

export default () => {
  mu.cmd({
    name: "@js",
    flags: "connected wizard+",
    pattern: /@js\s+?(.*)/i,
    exec: async (req: MuRequest, args: string[]) => {
      // Create a new instance of the vm sandbox.
      const vm = new VM({ sandbox: vmGlobals });
      const en = mu.connections.get(req.socket.id) as DBObj;
      try {
        const res = vm.run(args[1]);
        return payload(req, { message: `${res}`, data: { en, tar: en } });
      } catch (error) {
        return payload(req, { message: error.message, data: { en, tar: en } });
      }
    },
  });
};
