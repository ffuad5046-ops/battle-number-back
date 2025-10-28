import * as userService from '../services/userService.js'
import {validationResult} from "express-validator";
import {User} from "../models/User.js";


export const enterAsGuest = async (req, res) => {
    try {
        const user = await userService.enterAsGuest({res});
        res.json(user);
    } catch (err) {
        res.status(err.status || 500).json({ error: err.message });
    }
};

export const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { login } = req.body;
        const user = await userService.updateUser({id, login});
        res.json(user);
    } catch (err) {
        res.status(err.status || 500).json({ error: err.message });
    }
};

export const getUserAuth = async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id);

        if (!user) {
            return res.status(404).json({ message: "Пользователь не найден" });
        }

        res.json(user);
    } catch (err) {
        res.status(500).json({ message: "Ошибка сервера" });
    }
}

export const register = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
        const { name, email, password } = req.body;

        const user = await userService.register({name, email, password, res});
        res.json(user);
    } catch (err) {
        res.status(err.status || 500).json({ error: err.message });
    }
};
export const login = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
        const { email, password } = req.body;

        const user = await userService.login({email, password, res});
        res.json(user);
    } catch (err) {
        res.status(err.status || 500).json({ error: err.message });
    }
};
export const refresh = async (req, res) => {
    try {
        const token = req.cookies.refreshToken;

        const user = await userService.refresh({token, res});
        res.json(user);
    } catch (err) {
        res.status(err.status || 500).json({ error: err.message });
    }
};

export const logout = async (req, res) => {
    try {
        const result = userService.logout(res);
        res.json(result);
    } catch (err) {
        res.status(err.status || 500).json({ error: err.message });
    }
};

export const verifyEmail = async (req, res) => {
    try {
        const { code, email } = req.body;

        const result = await userService.verifyEmail({code, email, res});
        res.json(result);
    } catch (err) {
        res.status(err.status || 500).json({ error: err.message });
    }
};

export const resendCode = async (req, res) => {
    try {
        const { email } = req.body;

        const result = await userService.resendCode({email});
        res.json(result);
    } catch (err) {
        res.status(err.status || 500).json({ error: err.message });
    }
};

export const resetPasswordEmailCode = async (req, res) => {
    try {
        const { email } = req.body;

        const result = await userService.resetPasswordEmailCode({email});
        res.json(result);
    } catch (err) {
        res.status(err.status || 500).json({ error: err.message });
    }
};
export const resetPasswordEmailResendCode = async (req, res) => {
    try {
        const { email } = req.body;

        const result = await userService.resetPasswordEmailResendCode({email});
        res.json(result);
    } catch (err) {
        res.status(err.status || 500).json({ error: err.message });
    }
};

export const resetPasswordEmailCodeApprove = async (req, res) => {
    try {
        const { code, email } = req.body;

        const result = await userService.resetPasswordEmailCodeApprove({code, email});
        res.json(result);
    } catch (err) {
        res.status(err.status || 500).json({ error: err.message });
    }
};

export const resetPassword = async (req, res) => {
    try {
        const { password, email } = req.body;

        const result = await userService.resetPassword({password, email});
        res.json(result);
    } catch (err) {
        res.status(err.status || 500).json({ error: err.message });
    }
};