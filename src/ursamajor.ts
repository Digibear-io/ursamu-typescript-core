//  Middleware system here
process.on("message", (message: string) => process.send!(message));
