import express, { Request, Response } from "express";
import { Server } from "http";
import socketio, { Socket } from "socket.io";
import { fork } from "child_process";
import config from "../config/config.json";
import { resolve } from "path";
import { Marked } from "@ts-stack/markdown";

// Define the various communication channels.
const app = express();
const server = new Server(app);
const io = socketio(server);

// Boot UrsaMU communication layer and mush engine.
const ursaMajor = fork("./src/ursamajor.ts");

app.get("/", (req: Request, res: Response) =>
  res.sendFile(resolve(__dirname, "../public/index.html"))
);

// Handle new connections client connections.
io.on("connection", (socket: Socket) => {
  socket.on("message", (message: string) => {
    ursaMajor.send(JSON.stringify({ id: socket.id, message }));
  });

  ursaMajor.on("message", (message: string) => {
    const data = JSON.parse(message);
    socket.send(Marked.parse(data.message));
  });
});

server.listen(config.game.port, () =>
  console.log(`Server started on port: ${config.game.port}`)
);
