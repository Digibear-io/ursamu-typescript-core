import { EventEmitter } from "events";

export type Plugin = () => void;

export class MU extends EventEmitter {
  constructor() {
    super();
  }

  start() {}
}

const mu = new MU();

export default mu;
