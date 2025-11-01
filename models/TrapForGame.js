// models/Trap.js
import { DataTypes } from "sequelize";
import { sequelize } from "../db.js";
import { Game } from "./Game.js";
import { User } from "./User.js";

export const TrapForGame = sequelize.define("TrapForGame", {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    gameId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "Games", key: "id" },
        onDelete: "CASCADE",
    },
    ownerId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "Users", key: "id" },
        onDelete: "CASCADE",
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    code: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    description: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    isUsed: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: "Была ли ловушка уже применена",
    },
});

Game.hasMany(TrapForGame, { foreignKey: "gameId", as: "traps" });
TrapForGame.belongsTo(Game, { foreignKey: "gameId" });

User.hasMany(TrapForGame, { foreignKey: "ownerId", as: "userTraps" });
TrapForGame.belongsTo(User, { foreignKey: "ownerId" });