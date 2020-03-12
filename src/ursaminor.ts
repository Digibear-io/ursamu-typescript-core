import express, { Request, Response } from "express";
import { Server } from "http";
import socketio, { Socket } from "socket.io";
import { fork } from "child_process";
import config from "../config/config.json";

// Define the various communication channels.
const app = express();
const server = new Server(app);
const io = socketio(server);

// Boot UrsaMU communication layer and mush engine.
const ursaMajor = fork("./src/ursamajor.ts");

app.get("/", (req: Request, res: Response) =>
  res.send(`<h1>Hello World!</h1>`)
);

// Handle new connections to the
io.on("connection", (socket: Socket) =>
  socket.on("message", (data: string) =>
    ursaMajor.send(JSON.stringify({ id: socket.id, text: data }))
  )
);

server.listen(config.game.port, () =>
  console.log(`Server started on port: ${config.game.port}`)
);
