import express from "express";
import * as gameController from '../controllers/gameController.js'
import {getUserStatsSummary} from "../controllers/gameController.js";

const router = express.Router();

router.get("/traps", gameController.getAllTraps);
router.get("/:userId", gameController.getUserGame);
router.get("/:userId/stats", gameController.getUserStats);
router.get("/:userId/stats/summary", gameController.getUserStatsSummary);

export default router;