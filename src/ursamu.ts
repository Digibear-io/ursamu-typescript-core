import express, { Request, Response } from "express";
import { Server } from "http";
import socketio, { Socket } from "socket.io";
import { fork } from "child_process";

// Define the various communication channels.
const app = express();
const server = new Server(app);
const io = socketio(server);

// Boot UrsaMU communication layer and mush engine.
const engine = fork("./src/engine.ts");
server.listen(8080, () => console.log("Server started."));

app.get("/", (req: Request, res: Response) =>
  res.send(`<h1>Hello World!</h1>`)
);
engine.send("Foobar!");
io.on("connection", (socket: Socket) => {
  socket.on("message", (data: string) =>
    engine.send(JSON.stringify({ id: socket.id, payload: data }))
  );
});
