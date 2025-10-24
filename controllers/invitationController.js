import * as invitationService from '../services/invitationService.js'


export const sendInvitation = async (req, res) => {
    try {
        const { fromUserId, toLogin, mainFieldWidth,
            mainFieldHeight,
            extraFieldWidth,
            extraFieldHeight,
            isShowLoseLeft,
            numberRange } = req.body;
        const response = await invitationService.sendInvitation({fromUserId, toLogin,mainFieldWidth,
            mainFieldHeight,
            extraFieldWidth,
            extraFieldHeight,
            isShowLoseLeft,
            numberRange});
        res.json(response);
    } catch (err) {
        res.status(err.status || 500).json({ error: err.message });
    }
};

export const acceptInvitation = async (req, res) => {
    try {
        const { invitationId } = req.params;
        const userId = req.body.userId;
        const response = await invitationService.acceptInvitation({invitationId, userId});
        res.json(response);
    } catch (err) {
        res.status(err.status || 500).json({ error: err.message });
    }
};

export const declineInvitation = async (req, res) => {
    try {
        const { invitationId } = req.params;
        const userId = req.body.userId;
        const response = await invitationService.declineInvitation({invitationId, userId});
        res.json(response);
    } catch (err) {
        res.status(err.status || 500).json({ error: err.message });
    }
};

export const getUserInvitation = async (req, res) => {
    try {
        const { userId } = req.params;
        const response = await invitationService.getUserInvitation({userId});
        res.json(response);
    } catch (err) {
        res.status(err.status || 500).json({ error: err.message });
    }
};