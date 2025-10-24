import express from "express";
import dotenv from "dotenv";
import http from "http";
import cors from "cors";
import cookieParser from "cookie-parser";

import { connectDB, sequelize } from "./db.js";

import userRoutes from "./routes/userRoutes.js";
import invitationRoutes from "./routes/invitationRoutes.js";
import gameRoutes from "./routes/gameRoutes.js";
import { initWebsocket } from "./socket.js";

dotenv.config();

const app = express();
const server = http.createServer(app);
const port = process.env.PORT || 8000;

app.use(cors({
  origin: "http://localhost:3000",
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization"],
  methods: ["GET", "POST", "PUT", "DELETE"]
}));

app.use(express.json());
app.use(cookieParser());

app.use("/users", userRoutes);
app.use("/invitation", invitationRoutes);
app.use("/game", gameRoutes);

initWebsocket(server);

app.get('/', (req, res) => {
  res.status(200).type('text/plain');
  res.send('About page');
});


server.listen(port, async () => {
  await connectDB();

  await sequelize.sync({ alter: true });

  console.log("🗄️ Database models synchronized");

  console.log(`🚀 Server running at http://localhost:${port}`);
});
