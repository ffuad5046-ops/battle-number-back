import { DataTypes } from "sequelize";
import { sequelize } from "../db.js";

export const User = sequelize.define("User", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true
  },

  level: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1
  },
  currentXP: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  nextLevelXP: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 10
  },
  progressPercent: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },

  rankPoint: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  password: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  isGuest: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
  },

  isVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  verificationCode: {
    type: DataTypes.STRING,
    allowNull: true
  },
  verificationExpires: {
    type: DataTypes.DATE,
    allowNull: true
  },

  resetPasswordCode: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: null
  },
  resetPasswordExpires: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: null
  }
});