import net from "net";
import config from "../config/config.js";

const respond = (cmd, socket) => {
  socket.write(`Received command: ${cmd}\n`);
};

const runSyncTCPServer = () => {
  let activeSocket = null;
  const waitingSockets = [];

  const removeWaitingSocket = (socket) => {
    const index = waitingSockets.indexOf(socket);

    if (index !== -1) {
      waitingSockets.splice(index, 1);
    }
  };

  const promoteNextSocket = () => {
    while (waitingSockets.length > 0) {
      const nextSocket = waitingSockets.shift();

      if (nextSocket.destroyed) {
        continue;
      }

      activeSocket = nextSocket;
      activeSocket.resume();
      activeSocket.write("OK you are now the active client\n");
      console.log(
        "Promoted waiting client. Remaining queued clients: %d",
        waitingSockets.length,
      );
      return;
    }

    activeSocket = null;
    console.log("No queued clients. Server is idle.");
  };

  const activateSocket = (socket) => {
    activeSocket = socket;
    socket.resume();
    console.log("Client connected. Server is now blocked by this connection.");
  };

  console.log(`Starting TCP server on ${config.host}:${config.port}...`);

  const server = net.createServer((socket) => {
    socket.setEncoding("utf-8");

    socket.on("data", (data) => {
      if (activeSocket !== socket) {
        return;
      }

      const cmd = data.toString().slice(0, 512);
      console.log("Received command: %s", cmd);
      respond(cmd, socket);
    });

    const releaseSocket = () => {
      if (activeSocket === socket) {
        console.log("Active client disconnected. Promoting next queued client.");
        promoteNextSocket();
        return;
      }

      removeWaitingSocket(socket);
    };

    socket.on("end", releaseSocket);
    socket.on("close", releaseSocket);

    socket.on("error", (err) => {
      console.error("Socket error: %s", err);
      releaseSocket();
    });

    if (activeSocket !== null) {
      waitingSockets.push(socket);
      socket.pause();
      socket.write("WAIT another client is active, you are queued\n");
      console.log(
        "Queued client. Waiting clients: %d",
        waitingSockets.length,
      );
      return;
    }

    activateSocket(socket);
  });

  server.listen(config.port, config.host, () => {
    console.log(`TCP server listening on ${config.host}:${config.port}`);
  });
};

export default runSyncTCPServer;
