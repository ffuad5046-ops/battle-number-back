import {Game} from "../models/Game.js";
import {TrapForGame} from "../models/TrapForGame.js";

export const getAllInfoAboutGame = async (id) => {
    return await Game.findByPk(id, {
        include: [
            { association: "player1", attributes: ["id", "name"] },
            { association: "player2", attributes: ["id", "name"] },
            {
                model: TrapForGame,
                as: "traps",
                attributes: ["id", "title", "isUsed", "ownerId", "code"],
            },
        ]
    });
}