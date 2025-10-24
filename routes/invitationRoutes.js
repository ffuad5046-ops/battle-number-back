import express from "express";
import * as invitationController from '../controllers/invitationController.js'

const router = express.Router();

router.post("/send", invitationController.sendInvitation);
router.post("/:invitationId/accept", invitationController.acceptInvitation);
router.post("/:invitationId/decline", invitationController.declineInvitation);
router.get("/:userId", invitationController.getUserInvitation);

export default router;