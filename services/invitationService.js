import { User } from "../models/User.js";
import { Invitation } from "../models/Invitation.js";
import { getIO, getUserSockets } from "../socket.js";
import { Op } from "sequelize";
import { MainField } from "../models/MainField.js";
import { ExtraField } from "../models/ExtraField.js";
import { Game } from "../models/Game.js";


const tenMinutesFromNow = () => new Date(Date.now() + 10 * 60 * 1000);

export const sendInvitation = async ({fromUserId, toLogin,mainFieldWidth,
                                         mainFieldHeight,
                                         extraFieldWidth,
                                         extraFieldHeight,
                                         isShowLoseLeft,
                                         numberRange}) => {
    const toUser = await User.findOne({ where: { name: toLogin } });
    if (!toUser) throw { message: "Пользователь не найден" };

    if (fromUserId === toUser.id) {
        throw { message: "Вы не можете отправить приглашение сами себе" }
    }

    // Проверяем, есть ли активное приглашение между этими пользователями
    const existing = await Invitation.findOne({
        where: {
            fromUserId,
            toUserId: toUser.id,
            isAccepted: null,
            expiresAt: { [Op.gt]: new Date() }
        }
    });

    // Если есть — удаляем
    if (existing) {
        await existing.destroy();
    }

    // Создаём новое приглашение
    const inv = await Invitation.create({
        fromUserId: Number(fromUserId),
        toUserId: toUser.id,
        expiresAt: tenMinutesFromNow(),
        mainFieldWidth,
        mainFieldHeight,
        extraFieldWidth,
        isShowLoseLeft,
        extraFieldHeight,
        numberRange
    });

    // Загружаем вместе с пользователями
    const fullInvitation = await Invitation.findByPk(inv.id, {
        include: [
            { association: "fromUser", attributes: ["id", "name"] },
            { association: "toUser", attributes: ["id", "name"] }
        ]
    });

    // Отправляем уведомление через сокет, если пользователь в сети
    const userSocketId = getUserSockets().get(toUser.id);
    if (userSocketId) {
        const io = getIO();
        io.to(userSocketId).emit("invitation:new", fullInvitation);
    }

    // Возвращаем полное приглашение
    return fullInvitation;
}

export const acceptInvitation = async ({ invitationId, userId }) => {
    const inv = await Invitation.findByPk(invitationId);
    if (!inv) return { error: "Invitation not found" };

    if (inv.toUserId !== Number(userId)) return { error: "Not allowed" };

    inv.isAccepted = true;
    await inv.save();

    const firstTurn = Math.random() < 0.5 ? inv.fromUserId : inv.toUserId;

    const gameTemp = await Game.create({
        player1Id: inv.fromUserId,
        player2Id: inv.toUserId,
        mainFieldWidth: inv.mainFieldWidth,
        mainFieldHeight: inv.mainFieldHeight,
        extraFieldWidth: inv.extraFieldWidth,
        extraFieldHeight: inv.extraFieldHeight,
        isShowLoseLeft: inv.isShowLoseLeft,
        numberRange: inv.numberRange,
        currentTurnPlayerId: firstTurn,
        searchNumber: null,
        turnDeadline: null
    });

    const game = await Game.findByPk(gameTemp.id, {
        include: [
            { association: "player1", attributes: ["id", "name"] },
            { association: "player2", attributes: ["id", "name"] },
        ]
    });

    [inv.fromUserId, inv.toUserId].forEach((id) => {
        const socketId = getUserSockets().get(id);
        if (socketId) {
            getIO().to(socketId).emit("game:accept", {
                game,
                mainFields: [],
                extraFields: [],
                leftForLose: 0,
                leftForWin: 0,
            });
        }
    });

    return inv;
}

export const declineInvitation = async ({ invitationId, userId }) => {
    const inv = await Invitation.findByPk(invitationId);
    if (!inv) return{ error: "Invitation not found" };
    if (inv.toUserId !== Number(userId)) return{ error: "Not allowed" };


    inv.isAccepted = false;
    await inv.save();

    [inv.fromUserId, inv.toUserId].forEach((id) => {
        const socketId = getUserSockets().get(id);
        if (socketId) {
            getIO().to(socketId).emit("game:decline", false);
        }
    });

    return inv;
}

export const getUserInvitation = async ({  userId }) => {
    const invitation = await Invitation.findOne({
        where: {
            toUserId: userId,
            isAccepted: null,
            expiresAt: { [Op.gt]: new Date() }
        },
        include: [
            { association: "fromUser", attributes: ["id", "name"] },
            { association: "toUser", attributes: ["id", "name"] }
        ],
        order: [["createdAt", "DESC"]]
    });

    if (!invitation) {
        return false;
    }

    return invitation;
}