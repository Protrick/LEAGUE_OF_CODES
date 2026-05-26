const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");
const { Server } = require("socket.io");

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = parseInt(process.env.PORT || "3000", 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error("Error occurred handling", req.url, err);
      res.statusCode = 500;
      res.end("internal server error");
    }
  });

  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  global.io = io;

  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    socket.on("join_room", (roomCode) => {
      socket.join(roomCode);
      console.log(`Socket ${socket.id} joined room ${roomCode}`);
      // notify others in the room
      socket.to(roomCode).emit("user_joined", {
        socketId: socket.id,
        roomCode,
      });
    });

    socket.on("leave_room", (roomCode) => {
      socket.leave(roomCode);
      console.log(`Socket ${socket.id} left room ${roomCode}`);
    });

    // when API routes emit update_participants, broadcast to room
    socket.on("update_participants", (data) => {
      if (data?.roomCode) {
        io.to(data.roomCode).emit("update_participants", data);
      }
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
    });
  });

  httpServer
    .once("error", (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
    });
});
