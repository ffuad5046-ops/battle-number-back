import {Op, QueryTypes} from "sequelize";
import {MainField} from "../models/MainField.js";
import {ExtraField} from "../models/ExtraField.js";
import {Game} from "../models/Game.js";
import {sequelize} from "../db.js";

export const getUserGame = async ({userId}) => {
    const game = await Game.findOne({
        where: {
            [Op.or]: [{ player1Id: userId }, { player2Id: userId }],
            winnerId: null,
            isDraw: null
        },
        include: [
            { association: "player1", attributes: ["id", "name"] },
            { association: "player2", attributes: ["id", "name"] },
        ]
    });

    if (!game) {
        return false;
    }

    const [mainField, extraField] = await Promise.all([
        MainField.findAll({
            where: { gameId: game.id },
            order: [["y", "ASC"], ["x", "ASC"]]
        }),
        ExtraField.findAll({
            where: { gameId: game.id },
            order: [["y", "ASC"], ["x", "ASC"]]
        })
    ]);

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

    return {
        game: plainGame,
        mainField,
        extraField,
        leftForLose: extraField.filter((i) => i.ownerId !== Number(userId) && !i.isMarked).length,
        leftForWin: extraField.filter((i) => i.ownerId === Number(userId) && !i.isMarked).length
    };
}

export const getUserStats = async ({userId}) => {
    const result = await sequelize.query(
        `
        SELECT
            COUNT(*) AS totalGames,
            COUNT(*) FILTER (WHERE "winnerId" = :userId) AS wins,
            COUNT(*) FILTER (
                WHERE ("player1Id" = :userId OR "player2Id" = :userId)
                AND "winnerId" IS NOT NULL  
                AND "winnerId" != :userId
            ) AS losses,
            COUNT(*) FILTER (WHERE "isDraw" = true AND ("player1Id" = :userId OR "player2Id" = :userId)) AS draws
        FROM "Games"
        WHERE "player1Id" = :userId OR "player2Id" = :userId
        `,
        {
            replacements: { userId },
            type: sequelize.QueryTypes.SELECT,
        }
    );

    const stats = {
        totalGames: Number(result[0].totalgames) || 0,
        wins: Number(result[0].wins) || 0,
        losses: Number(result[0].losses) || 0,
        draws: Number(result[0].draws) || 0,
    };

    return stats;
}


export const getUserStatsSummary = async ({ userId, type, page = 1, size = 10}) => {

    const offset = (page - 1) * size;
    const limit = parseInt(size, 10);

    let where = {};

    switch (type) {
        case "wins":
            where = {
                winnerId: userId,
                status: "finished",
            };
            break;

        case "losses":
            where = {
                [Op.and]: [
                    { status: "finished" },
                    { winnerId: { [Op.ne]: userId } },
                    {
                        [Op.or]: [{ player1Id: userId }, { player2Id: userId }],
                    },
                ],
            };
            break;

        case "draws":
            where = {
                isDraw: true,
                status: "finished",
                [Op.or]: [{ player1Id: userId }, { player2Id: userId }],
            };
            break;

        case "all":
        default:
            where = {
                [Op.or]: [{ player1Id: userId }, { player2Id: userId }],
            };
            break;
    }

    const { count, rows: games } = await Game.findAndCountAll({
        where,
        include: [
            { association: "player1", attributes: ["id", "name"] },
            { association: "player2", attributes: ["id", "name"] },
            { association: "winner", attributes: ["id", "name"] },
        ],
        order: [["createdAt", "DESC"]],
        offset,
        limit,
    });

    return ({
        games,
        totalPages: Math.ceil(count / size),
        currentPage: Number(page),
        totalGames: count,
    });
}

