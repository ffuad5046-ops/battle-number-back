import {User} from "../models/User.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import crypto from "crypto";
import { Op } from "sequelize";

const ACCESS_SECRET =  "access_secret";
const REFRESH_SECRET =  "refresh_secret";
const ACCESS_EXPIRES =  "15m";
const REFRESH_EXPIRES =  "7d";

const generateToken = (user) => {
    const payload = { id: user.id, name: user.name, email: user.email };

    const accessToken = jwt.sign(payload, ACCESS_SECRET, { expiresIn: ACCESS_EXPIRES });
    const refreshToken = jwt.sign(payload, 'refresh_secret', { expiresIn: REFRESH_EXPIRES });

    return { accessToken, refreshToken };
};

const sendTokens = (res, tokens, user) => {
    res.cookie("refreshToken", tokens.refreshToken, {
        httpOnly: true,
        sameSite: "none",
        secure: true,
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 дней
    });

    return {
        user,
        accessToken: tokens.accessToken,
    };
};

export const enterAsGuest = async () => {
    const randomNumber = Math.floor(Math.random() * 10_000_000) + 1;

    return await User.create({name: `user${randomNumber}`, isGuest: true})
}

export const getUserById = async ({ id }) => {
    const user = await User.findByPk(id);

    if (!user) {
        throw { message: "Пользователь не найден" };
    }

    return user;
}

export const updateUser = async ({ id, login }) => {
    const user = await User.findByPk(id);

    if (!user) {
        throw { message: "Пользователь не найден" };
    }

    user.name = login
    user.save();

    return user;
}

export const sendEmail = async (to, subject, text) => {
    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });

    await transporter.sendMail({
        from: `"Game App" <${process.env.SMTP_USER}>`,
        to,
        subject,
        text,
    });
};

export const register = async ({ name, email, password, res }) => {
    const exists = await User.findOne({
        where: { [Op.or]: [{ name }, { email }] },
    });

    if (exists) throw { message: "Пользователь уже существует" };

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expirationTime = new Date(Date.now() + 10 * 60 * 1000); // ✅ код действует 10 минут

    const user = await User.create({
        name,
        email,
        password: passwordHash,
        isVerified: false,
        verificationCode,
        verificationExpires: expirationTime,
    });

    // await sendEmail(
    //     email,
    //     "Подтверждение регистрации",
    //     `Ваш код подтверждения: ${verificationCode}`
    // );

    return {
        message: "Код подтверждения отправлен на почту",
        userId: user.id,
    };
}

export const resendCode = async ({ email }) => {
    if (!email) {
        throw { message: "Email обязателен" };
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
        throw { message: "Пользователь не найден", status: 404 };
    }

    if (user.isVerified) {
        throw { message: "Email уже подтверждён", status: 400 };
    }

    const verificationCode = crypto.randomInt(100000, 999999).toString();

    await user.update({
        verificationCode,
        verificationCodeExpires: Date.now() + 10 * 60 * 1000,
    });

    // await sendEmail({
    //     to: email,
    //     subject: "Подтверждение регистрации",
    //     text: `Ваш код подтверждения: ${verificationCode}`,
    // });

    return {message: "Код повторно отправлен"};

}

export const verifyEmail = async ({ email, code, res }) => {
    const user = await User.findOne({ where: { email } });

    if (!user) throw { message: "Пользователь не найден" };

    if (user.isVerified) {
        throw { message: "Email уже подтверждён" };
    }
    console.log(user.verificationCode)
    console.log(code)
    if (
        user.verificationCode !== code ||
        new Date() > user.verificationExpires
    ) {
        throw { message: "Код неверный или просрочен" };
    }

    await user.update({
        isVerified: true,
        verificationCode: null,
        verificationExpires: null
    });

    const tokens = generateToken(user);
    return sendTokens(res, tokens, user);
};

export const login = async ({ email, password, res }) => {
    const user = await User.findOne({ where: { email } });
    if (!user || !user.password) throw { message: "Неверный email или пароль", status: 400 };

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw { message: "Неверный email или пароль", status: 400 };

    const tokens = generateToken(user);
    return sendTokens(res, tokens, user);
}

export const refresh = async ({token, res}) => {
    if (!token) throw { message: "Нет refresh токена" };

    let payload;
    try {
        payload = jwt.verify(token, 'refresh_secret');
    } catch (err) {
        throw { message: "Refresh токен недействителен" };
    }

    const user = await User.findByPk(payload.id);
    if (!user) throw { message: "Пользователь не найден" };

    const tokens = generateToken(user);
    return sendTokens(res, tokens, user);
};

export const logout = (res) => {
    res.clearCookie("refreshToken");
    return { message: "Вы вышли из системы" };
};
