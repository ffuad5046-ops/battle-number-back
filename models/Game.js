// models/Game.js
import { DataTypes } from "sequelize";
import { sequelize } from "../db.js";
import { User } from "./User.js";
import { MainField } from "./MainField.js";
import { ExtraField } from "./ExtraField.js";

export const Game = sequelize.define("Game", {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    player1Id: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    player2Id: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    currentTurnPlayerId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: "ID игрока, который делает ход сейчас",
    },
    searchNumber: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: "Число, которое нужно найти/угадать/достичь",
    },
    winnerId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: "ID победителя (null, если игра не закончена)",
    },
    isDraw: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
    },
    status: {
        type: DataTypes.ENUM("accept", "active", "finished", "cancelled"),
        allowNull: false,
        defaultValue: "accept",
    },

    // ✅ Новое поле — массив ID игроков, которые нажали "Готов"
    readyPlayers: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: [],
        comment: "Список ID игроков, подтвердивших готовность начать игру",
    },
    repeatGamePlayers: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: [],
        comment: "Список ID игроков, подтвердивших повторить игру",
    },

    mainFieldWidth: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 45,
        comment: "Ширина основного поля",
    },
    mainFieldHeight: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 35,
        comment: "Высота основного поля",
    },
    extraFieldWidth: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 20,
        comment: "Ширина дополнительного поля",
    },
    extraFieldHeight: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 20,
        comment: "Высота дополнительного поля",
    },
    numberRange: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 100,
        comment: "Конец диапазона чисел",
    },
    isShowLoseLeft: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
    },
    createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
    },
    turnDeadline: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: "Время, до которого игрок должен сделать ход (20 секунд лимит)",
    },
});

// 🔗 Связи
User.hasMany(Game, { foreignKey: "player1Id", as: "gamesAsPlayer1" });
User.hasMany(Game, { foreignKey: "player2Id", as: "gamesAsPlayer2" });
Game.belongsTo(User, { foreignKey: "player1Id", as: "player1" });
Game.belongsTo(User, { foreignKey: "player2Id", as: "player2" });
Game.belongsTo(User, { foreignKey: "winnerId", as: "winner" });

Game.hasMany(MainField, { foreignKey: "gameId", as: "mainFields" });
Game.hasMany(ExtraField, { foreignKey: "gameId", as: "extraFields" });

User.hasMany(MainField, { foreignKey: "ownerId", as: "mainFields" });
User.hasMany(ExtraField, { foreignKey: "ownerId", as: "extraFields" });

MainField.belongsTo(Game, { foreignKey: "gameId" });
ExtraField.belongsTo(Game, { foreignKey: "gameId" });
MainField.belongsTo(User, { foreignKey: "ownerId" });
ExtraField.belongsTo(User, { foreignKey: "ownerId" });
