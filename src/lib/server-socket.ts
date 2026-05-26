import { Server } from "socket.io";

let io: Server | null = null;

export const setServerSocket = (socketServer: Server) => {
  io = socketServer;
};

export const getServerSocket = (): Server | null => {
  return io;
};
