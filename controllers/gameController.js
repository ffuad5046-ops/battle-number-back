import * as gameService from '../services/gameService.js'

export const getUserGame = async (req, res) => {
    try {
        const { userId } = req.params;
        const response = await gameService.getUserGame({userId});
        res.json(response);
    } catch (err) {
        res.status(err.status || 500).json({ error: err.message });
    }
};

export const getUserStats = async (req, res) => {
    try {
        const { userId } = req.params;
        const response = await gameService.getUserStats({userId});
        res.json(response);
    } catch (err) {
        res.status(err.status || 500).json({ error: err.message });
    }
};

export const getUserStatsSummary = async (req, res) => {
    try {
        const { userId } = req.params;
        const { type, page, size } = req.query; // all | wins | losses
        const response = await gameService.getUserStatsSummary({ userId: Number(userId), type, page, size });
        res.json(response);
    } catch (err) {
        res.status(err.status || 500).json({ error: err.message });
    }
};

export const getAllTraps = async (req, res) => {
    try {
        const response = await gameService.getAllTraps();
        res.json(response);
    } catch (err) {
        res.status(err.status || 500).json({ error: err.message });
    }
};
