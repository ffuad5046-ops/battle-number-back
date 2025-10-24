import { DataTypes } from "sequelize";
import { sequelize } from "../db.js";
import { User } from "./User.js";

export const Invitation = sequelize.define("Invitation", {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    fromUserId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    toUserId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    isAccepted: {
        type: DataTypes.BOOLEAN,
        allowNull: true
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
    expiresAt: {
        type: DataTypes.DATE,
        allowNull: true
    },
});

User.hasMany(Invitation, { foreignKey: "fromUserId", as: "sentInvitations" });
User.hasMany(Invitation, { foreignKey: "toUserId", as: "receivedInvitations" });

Invitation.belongsTo(User, { foreignKey: "fromUserId", as: "fromUser" });
Invitation.belongsTo(User, { foreignKey: "toUserId", as: "toUser" });