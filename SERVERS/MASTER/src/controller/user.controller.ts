import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken"; // Import jsonwebtoken
import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";
dotenv.config();

const prisma = new PrismaClient();
const SALT_ROUNDS = 10;
const JWT_SECRET = process.env.JWT_SECRET || "default_secret"; // Get secret from .env

export class UserController {
    static async register(req: Request, res: Response): Promise<any> {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ error: "All fields are required." });
        }

        try {
            const existing = await prisma.user.findUnique({ where: { email } });
            if (existing) {
                return res.status(409).json({ error: "User already exists." });
            }

            const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

            const user = await prisma.user.create({
                data: { name, email, password: hashedPassword },
            });

            // --- New: Create JWT Token ---
            const token = jwt.sign(
                { id: user.id, email: user.email },
                JWT_SECRET,
                { expiresIn: "1h" }
            );

            return res.status(201).json({
                message: "User registered successfully!",
                token, // Return the token
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                },
            });
        } catch (err) {
            console.error("Error during registration:", err);
            return res.status(500).json({ error: "Internal server error." });
        }
    }

    static async login(req: Request, res: Response): Promise<any> {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: "Email and password are required." });
        }

        try {
            const user = await prisma.user.findUnique({ where: { email } });
            if (!user) {
                return res.status(401).json({ error: "Invalid credentials." });
            }

            const isPasswordValid = await bcrypt.compare(password, user.password);
            if (!isPasswordValid) {
                return res.status(401).json({ error: "Invalid credentials." });
            }

            // --- New: Create JWT Token ---
            const token = jwt.sign(
                { id: user.id, email: user.email },
                JWT_SECRET,
                { expiresIn: "1h" }
            );
            
            return res.status(200).json({
                message: "Login successful!",
                token, // Return the token
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                }
            });

        } catch (err) {
            console.error("Error during login:", err);
            return res.status(500).json({ error: "Internal server error." });
        }
    }
}