import { Socket } from "socket.io";
import { MU } from "./mu";

export type MiddlewareNext = (
  err: Error | null,
  req: MuRequest
) => Promise<any>;

export type MiddlewareLayer = (
  data: MuRequest,
  next: MiddlewareNext
) => Promise<MuRequest> | MuRequest;

export interface MuRequest {
  socket: Socket;
  payload: {
    command: string;
    message: string;
    data: {
      en?: DBObj;
      tar?: DBObj;
      [key: string]: any;
    };
  };
}

export type MuFunction = (
  enactor: DBObj,
  args: Expression[],
  scope: Scope
) => Promise<any>;

export interface Expression {
  type: string;
  value: string;
  list?: Expression[];
  operator: {
    type: string;
    value: string;
  };
  location?: {
    start: {
      offset: number;
      line: number;
      column: number;
    };
    end: {
      offset: number;
      line: number;
      column: number;
    };
  };
  args: Array<Expression>;
}

export type MuService = (req: MuRequest) => Promise<MuRequest>;

export type MuHook = (req: MuRequest) => Promise<MuRequest>;

export interface Scope {
  [key: string]: any;
}

export interface DBObj {
  _id?: string;
  name: string;
  dbref: number;
  type: "thing" | "player" | "room" | "exit";
  alias?: string;
  password?: string;
  attributes: Attribute[];
  flags: string[];
  location: string;
  contents: string[];
  exits?: string[];
  owner?: string;
}

export abstract class DbAdapter {
  abstract model(...args: any[]): any | Promise<any>;
  abstract get(...args: any[]): any | Promise<any>;
  abstract find(...args: any[]): any | Promise<any>;
  abstract create(...args: any[]): any | Promise<any>;
  abstract update(...args: any[]): any | Promise<any>;
  abstract delete(...args: any[]): any | Promise<any>;
}

export interface Attribute {
  name: string;
  value: string;
  lastEdit: string;
}

export type Message = {
  command: string;
  message: string;
  data: { [key: string]: any };
};

export type Plugin = (mu: MU) => {};

export type HelpEntry = {
  name: string;
  category?: string;
  entry: string;
  related?: string[];
  visible: Boolean;
};

declare namespace Express {
  export interface Request {
    char: any;
  }
  export interface Response {
    char: any;
  }
}
