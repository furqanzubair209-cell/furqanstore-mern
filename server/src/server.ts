import "dotenv/config";
import http from "http";
import app from "./app";
import { initSocket } from "./sockets/io";

const PORT = Number(process.env.PORT) || 5000;
const server = http.createServer(app);

initSocket(server);

server.listen(PORT, () => {
  console.log(`FurqanStore API listening on port ${PORT}`);
});
