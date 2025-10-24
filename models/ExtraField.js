import { DataTypes } from "sequelize";
import { sequelize } from "../db.js";

export const ExtraField = sequelize.define("ExtraField", {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    gameId: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    ownerId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: "ID игрока, которому принадлежит поле",
    },
    x: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    y: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    isMarked: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
});
