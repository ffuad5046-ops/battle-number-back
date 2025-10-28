import express from "express";
import * as userController from '../controllers/userController.js'
import { body } from "express-validator";
import {authenticateToken} from "../middleware/authenticateToken.js";

const router = express.Router();

router.post("/register",
    [
        body("name").isLength({ min: 3 }).withMessage("Имя должно быть не короче 3 символов"),
        body("email").isEmail().withMessage("Неверный email"),
        body("password").isLength({ min: 6 }).withMessage("Пароль минимум 6 символов"),
    ],
    userController.register
);
router.post("/login",
    [
        body("email").isEmail().withMessage("Неверный email"),
        body("password").exists().withMessage("Пароль обязателен"),
    ],
    userController.login
);
router.post("/refresh", userController.refresh);
router.get("/", userController.enterAsGuest);
router.get("/logout", userController.logout);
router.patch("/:id", userController.updateUser);
router.post("/verify-email", userController.verifyEmail);
router.get("/get-user-auth", authenticateToken, userController.getUserAuth);
router.post("/resend-code", userController.resendCode);
router.patch("/reset/password", userController.resetPassword);
router.post("/reset-password-email-code", userController.resetPasswordEmailCode);
router.post("/reset-password-email-resend-code", userController.resetPasswordEmailResendCode);
router.post("/reset-password-email-code-approve", userController.resetPasswordEmailCodeApprove);

export default router;