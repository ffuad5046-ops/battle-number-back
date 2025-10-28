import { Server } from "socket.io";
import {ExtraField} from "./models/ExtraField.js";
import {Game} from "./models/Game.js";
import {MainField} from "./models/MainField.js";
import {Op} from "sequelize";
import * as userService from './services/userService.js'
import {User} from "./models/User.js";

let io;
const userSockets = new Map();

export function initWebsocket(server) {
  io = new Server(server, {
    cors: { origin: "*" },
  });

  const field = Array.from({ length: 100 }, () =>
    Array.from({ length: 100 }, () => 0)
  );

  io.on("connection", (socket) => {
    socket.emit("initField", field);

    socket.on("game:setSearchNumber", async ({ gameId, userId, number }) => {
      const game = await Game.findByPk(gameId);
      if (!game) return;

      if (game.currentTurnPlayerId === userId) return;

      if (number < 1 || number > game.numberRange) {
        socket.emit("cell:updated:error", {
          reason: `Число должно быть от 1 до ${game.numberRange}`
        });

        return;
      }

      const existingCell = await MainField.findOne({
        where: {
          gameId,
          number,
          ownerId: userId === game.player1Id ? game.player2Id : game.player1Id ,
          isGuessed: true,
        },
      });

      if (existingCell) {
        socket.emit("cell:updated:error", {
          reason: 'Такое число уже использовалось'
        });

        return;
      }

      game.searchNumber = Number(number);
      game.turnDeadline = null;
      await game.save();

      [game.player1Id, game.player2Id].forEach((id) => {
        const socketId = getUserSockets().get(id);
        if (socketId) {
          getIO().to(socketId).emit("game:searchNumberUpdated", {
            gameId,
            searchNumber: Number(number),
          });
        }
      });
    });

    socket.on("cell:mark", async ({ gameId, cellId, userId }) => {
      const cell = await ExtraField.findByPk(cellId);
      if (!cell) return;

      const game = await Game.findByPk(gameId);
      if (!game) return;

      if (cell.ownerId !== userId) return;

      cell.isMarked = true;
      await cell.save();

      const cell2 = await ExtraField.findAll({where: {gameId}});

      [game.player1Id, game.player2Id].forEach((id) => {
        const socketId = getUserSockets().get(id);
        if (socketId) {
          getIO().to(socketId).emit("cell:updated", {
            cellId: cell.id,
            isMarked: true,
            leftForLose: cell2.filter((i) => i.ownerId !== Number(id) && !i.isMarked).length,
            leftForWin: cell2.filter((i) => i.ownerId === Number(id) && !i.isMarked).length
          });
        }
      });

      const remainingCells = await ExtraField.count({
        where: {
          gameId,
          ownerId: userId,
          isMarked: false,
        },
      });

      if (remainingCells === 0) {
        const game = await Game.findByPk(gameId);
        if (!game) return;
        if (game.status !== 'active') return

        game.winnerId = userId;
        const user = await User.findByPk(game.winnerId);
        game.status = 'finished'
        game.turnDeadline = null;
        if (!user.isGuest) {
          await userService.recountLevel(game.winnerId)
        }
        await game.save();

        const opponentId =
            game.player1Id === userId ? game.player2Id : game.player1Id;

        [userId, opponentId].forEach((id) => {
          const socketId = userSockets.get(id);
          if (socketId) {
            io.to(socketId).emit("game:finished", {
              winnerId: userId,
              reason: "all-marked",
            });
          }
        });
      }
    });

    socket.on("game:surrender", async ({ gameId, userId }) => {
      const game = await Game.findByPk(gameId);
      if (!game) return;

      if (game.status !== 'active' && game.status !== 'accept') return;

      const winnerId =
          userId === game.player1Id ? game.player2Id : game.player1Id;

      game.winnerId = winnerId;
      game.status = 'finished'
      const user = await User.findByPk(game.winnerId);
      game.turnDeadline = null;

      if (!user.isGuest) {
        await userService.recountLevel(game.winnerId)
      }

      await game.save();

      [game.player1Id, game.player2Id].forEach((id) => {
        const socketId = getUserSockets().get(id);
        if (socketId) {
          getIO().to(socketId).emit("game:surrender", {
            winnerId,
          });
        }
      });

      io.to(`game-${gameId}`).emit("game:finished", {
        winnerId,
        reason: "surrender",
      });
    });

    socket.on("cell:found", async ({ gameId, cellId, userId }) => {
      const cell = await MainField.findByPk(cellId);
      if (!cell) return;

      if (cell.ownerId !== userId) return;

      if (cell.isGuessed) return;

      cell.isGuessed = true;
      await cell.save();

      const game = await Game.findByPk(gameId);
      if (!game) return;

      const unguessedCells = await MainField.count({
        where: { gameId, isGuessed: false, number: { [Op.ne]: null }, },
      });

      if (unguessedCells === 0) {
        game.isDraw = true;
        game.status = 'finished'
        game.turnDeadline = null;
        game.searchNumber = null;
        await game.save();

        [game.player1Id, game.player2Id].forEach((id) => {
          const socketId = getUserSockets().get(id);
          if (socketId) {
            getIO().to(socketId).emit("game:draw", {
              gameId: game.id,
              message: "🤝 Игра завершилась вничью!",
            });
          }
        });

        return
      }

      game.searchNumber = null;
      game.currentTurnPlayerId =
          game.currentTurnPlayerId === game.player1Id
              ? game.player2Id
              : game.player1Id;
      game.turnDeadline = new Date(Date.now() + 20 * 1000);

      await game.save();

      const unguessedNumbers = await MainField.findAll({
        where: {
          gameId,
          ownerId: userId === game.player1Id
              ? game.player2Id
              : game.player1Id,
          isGuessed: false,
          number: { [Op.not]: null },
        },
        attributes: ["number"],
      });

      [game.player1Id, game.player2Id].forEach((id) => {
        const socketId = getUserSockets().get(id);
        if (socketId) {
          getIO().to(socketId).emit("cell:found:update", {
            cellId: cell.id,
            isGuessed: true,
            newSearchNumber: game?.searchNumber,
            nextPlayerId: game?.currentTurnPlayerId,
            turnDeadline: game?.turnDeadline,
            unguessedNumbers: unguessedNumbers
          });
        }
      });
    });

    socket.on("turn:timeout", async ({ gameId }) => {
      try {
        const game = await Game.findByPk(gameId);
        if (!game) return;

        if (game.status !== "active") return;

        const currentPlayerId = game.currentTurnPlayerId;

        const availableCells = await MainField.findAll({
          where: {
            gameId,
            ownerId: currentPlayerId,
            isGuessed: false,
            number: { [Op.not]: null },
          },
        });

        if (!availableCells.length) {
          game.isDraw = true;
          game.status = "finished";
          await game.save();

          // уведомляем обоих игроков
          [game.player1Id, game.player2Id].forEach((id) => {
            const socketId = getUserSockets().get(id);
            if (socketId) {
              getIO().to(socketId).emit("game:draw", {
                gameId,
                message: "🤝 Игра завершилась вничью!",
              });
            }
          });

          return;
        }

        const randomCell =
            availableCells[Math.floor(Math.random() * availableCells.length)];

        game.searchNumber = randomCell.number;

        game.turnDeadline = null;
        await game.save();

        [game.player1Id, game.player2Id].forEach((id) => {
          const socketId = getUserSockets().get(id);
          if (socketId) {
            getIO().to(socketId).emit("game:searchNumberUpdated", {
              searchNumber: game.searchNumber,
              currentTurnPlayerId: game.currentTurnPlayerId,
              turnDeadline: game.turnDeadline,
              byTimeout: true, // <- чтобы на фронте можно было показать “авто-выбор”
            });
          }
        });
      } catch (error) {
        console.error("Ошибка при обработке turn:timeout:", error);
      }
    });

    socket.on("game:playerReady", async ({ gameId, userId }) => {
      const game = await Game.findByPk(gameId);
      if (!game) return;

      const readyPlayers = game.readyPlayers || [];
      if (!readyPlayers.includes(userId)) {
        await game.update({ readyPlayers: [...readyPlayers, userId] });
      }

      const bothReady =
          game.readyPlayers.includes(game.player1Id) &&
          game.readyPlayers.includes(game.player2Id);

      if (bothReady) {
        [game.player1Id, game.player2Id].forEach((id) => {
          const socketId = getUserSockets().get(id);
          if (socketId) {
            io.to(socketId).emit("game_started");
          }
        });
      } else {
        [game.player1Id, game.player2Id].forEach((id) => {
          const socketId = getUserSockets().get(id);
          if (socketId) {
            io.to(socketId).emit("player_ready_status", {
              readyPlayers: game.readyPlayers
            });
          }
        });
      }
    });

    socket.on("game:start", async ({gameId, userId}) => {
      const game = await Game.findByPk(gameId, {
        include: [
          { association: "player1", attributes: ["id", "name"] },
          { association: "player2", attributes: ["id", "name"] },
        ]
      });

      if (userId !== game?.player1Id) return;
      if (!game) return;
      if (game.status !== 'accept') return

      await game.update({status: 'active', turnDeadline: new Date(Date.now() + 20 * 1000)})
      await game.save()

      const mainFields = [];
      const extraFields = [];

      for (let y = 0; y < game.mainFieldHeight; y++) {
          for (let x = 0; x < game.mainFieldWidth; x++) {
              mainFields.push(
                  { gameId: game.id, ownerId: game.player1Id, x, y },
                  { gameId: game.id, ownerId: game.player2Id, x, y }
              );
          }
      }

      for (let y = 0; y < game.extraFieldHeight; y++) {
          for (let x = 0; x < game.extraFieldWidth; x++) {
              extraFields.push(
                  { gameId: game.id, ownerId: game.player1Id, x, y },
                  { gameId: game.id, ownerId: game.player2Id, x, y }
              );
          }
      }

      function assignRandomNumbers(cells) {
          const indices = new Set();
          while (indices.size < game.numberRange) {
              indices.add(Math.floor(Math.random() * cells.length));
          }

          const availableNumbers = Array.from({ length: game.numberRange }, (_, i) => i + 1);
          const shuffled = availableNumbers.sort(() => Math.random() - 0.5);

          let i = 0;
          for (const idx of indices) {
              cells[idx].number = shuffled[i++];
          }
      }

      const player1Cells = mainFields.filter(f => f.ownerId === game.player1Id);
      const player2Cells = mainFields.filter(f => f.ownerId === game.player2Id);

      assignRandomNumbers(player1Cells);
      assignRandomNumbers(player2Cells);

      const mainField = await MainField.bulkCreate(mainFields);
      const extraField = await ExtraField.bulkCreate(extraFields);

      const unguessedNumbers = await MainField.findAll({
          where: {
              gameId: game.id,
              ownerId: userId === game.player1Id
                  ? game.player2Id
                  : game.player1Id,
              isGuessed: false,
              number: { [Op.not]: null },
          },
          attributes: ["number"],
      });

      const plainGame = game.toJSON();

      plainGame.unguessedNumbers = unguessedNumbers;

      [game.player1Id, game.player2Id].forEach((id) => {
        const socketId = getUserSockets().get(id);
        if (socketId) {
          getIO().to(socketId).emit("game:accept", {
            game,
            mainField,
            extraField,
            leftForLose: extraField.filter((i) => i.ownerId !== Number(userId) && !i.isMarked).length,
            leftForWin: extraField.filter((i) => i.ownerId === Number(userId) && !i.isMarked).length,
          });
        }
      });
    });

    socket.on("game:repeat", async ({gameId, userId}) => {
      const game = await Game.findByPk(gameId);
      if (!game) return;

      const repeatGamePlayers = game.repeatGamePlayers || [];
      if (!repeatGamePlayers.includes(userId)) {
        await game.update({ repeatGamePlayers: [...repeatGamePlayers, userId] });
      }

      const repeatGamePlayersBoth =
          game.repeatGamePlayers.includes(game.player1Id) &&
          game.repeatGamePlayers.includes(game.player2Id);

      if (repeatGamePlayersBoth) {
        const firstTurn = Math.random() < 0.5 ? game.player1Id : game.player2Id;

        const gameTemp = await Game.create({
          player1Id: game.player1Id,
          player2Id: game.player2Id,
          mainFieldWidth: game.mainFieldWidth,
          mainFieldHeight: game.mainFieldHeight,
          extraFieldWidth: game.extraFieldWidth,
          extraFieldHeight: game.extraFieldHeight,
          isShowLoseLeft: game.isShowLoseLeft,
          numberRange: game.numberRange,
          currentTurnPlayerId: firstTurn,
          searchNumber: null,
          turnDeadline: null
        });

        const gameNew = await Game.findByPk(gameTemp.id, {
          include: [
            { association: "player1", attributes: ["id", "name"] },
            { association: "player2", attributes: ["id", "name"] },
          ]
        });

        [game.player1Id, game.player2Id].forEach((id) => {
          const socketId = getUserSockets().get(id);
          if (socketId) {
            getIO().to(socketId).emit("game:repeat-game", {
              game: gameNew,
              mainFields: [],
              extraFields: [],
              leftForLose: 0,
              leftForWin: 0,
            });
          }
        });

        return
      }

      [game.player1Id, game.player2Id].forEach((id) => {
        const socketId = getUserSockets().get(id);
        if (socketId) {
          getIO().to(socketId).emit("game:repeat-game-agreed", {
            repeatGamePlayers: game.repeatGamePlayers
          });
        }
      });
    })

    socket.on("registerUser", (userId) => {
      if (!userId) return;
      userSockets.set(userId, socket.id);
    });

    socket.on("joinRoom", (roomId) => {
      socket.join(roomId.toString());
    });

    socket.on("disconnect", () => {
      console.log("❌ Player disconnected:", socket.id);
    });
  });

  return io;
}

export function getIO() {
  if (!io) throw new Error("Socket.io not initialized!");
  return io;
}

export function getUserSockets() {
  return userSockets;
}