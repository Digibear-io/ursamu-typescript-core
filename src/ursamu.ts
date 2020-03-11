import express, { Request, Response } from "express";
import { Server } from "http";
import socketio, { Socket } from "socket.io";
import { fork } from "child_process";

const app = express();
const server = new Server(app);
const io = socketio(server);

const engine = fork("./src/engine.ts");
engine.send("Foobar!!");
server.listen(8080, () => console.log("Server started."));

app.get("/", (req: Request, res: Response) =>
  res.send(`<h1>Hello World!</h1>`)
);

io.on("connection", (socket: Socket) => {
  socket.on("message", (data: string) => engine.send(JSON.stringify(data)));
});
