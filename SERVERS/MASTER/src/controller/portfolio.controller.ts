import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'default_secret';

// Helper function to get user ID from token
const getUserIdFromToken = (req: Request): number | null => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return null;
    }
    try {
        const decoded = jwt.verify(token, JWT_SECRET) as { id: number };
        return decoded.id;
    } catch (err) {
        return null;
    }
};

// Define the shape of a single portfolio item in the request
interface PortfolioItem {
    company_tikker: string;
    company_name: string;
    company_share_amount: number;
    investment_start_date: string; // ISO 8601 date string
}

export class PortfolioController {

    static async getPortfolio(req: Request, res: Response): Promise<any> {
        const userId = getUserIdFromToken(req);
        if (!userId) {
            return res.status(403).json({ error: "Invalid or missing token." });
        }

        try {
            const portfolios = await prisma.portfolio.findMany({
                where: { userId: userId },
            });
            return res.status(200).json(portfolios);
        } catch (error) {
            return res.status(500).json({ error: "Internal server error." });
        }
    }

    static async addPortfolio(req: Request, res: Response): Promise<any> {
        const userId = getUserIdFromToken(req);
        if (!userId) {
            return res.status(403).json({ error: "Invalid or missing token." });
        }

        const items: PortfolioItem[] = req.body;
        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ error: "Request body must be a non-empty array of portfolio items." });
        }

        try {
            const dataToCreate = items.map(item => ({
                ...item,
                userId: userId,
                investment_start_date: new Date(item.investment_start_date),
            }));

            const result = await prisma.portfolio.createMany({
                data: dataToCreate,
                skipDuplicates: true,
            });

            return res.status(201).json({ message: `${result.count} portfolio items added successfully.` });
        } catch (error) {
            return res.status(500).json({ error: "Could not add items to portfolio." });
        }
    }

    static async updatePortfolio(req: Request, res: Response): Promise<any> {
        const userId = getUserIdFromToken(req);
        if (!userId) {
            return res.status(403).json({ error: "Invalid or missing token." });
        }

        const portfolioId = parseInt(req.params.id, 10);
        const { company_share_amount, investment_start_date }: Partial<PortfolioItem> = req.body;

        if (isNaN(portfolioId)) {
            return res.status(400).json({ error: "Invalid portfolio ID." });
        }

        try {
            const portfolioItem = await prisma.portfolio.findUnique({
                where: { id: portfolioId },
            });

            if (!portfolioItem || portfolioItem.userId !== userId) {
                return res.status(404).json({ error: "Portfolio item not found or you do not have permission to edit it." });
            }

            const updatedItem = await prisma.portfolio.update({
                where: { id: portfolioId },
                data: {
                    company_share_amount,
                    investment_start_date: investment_start_date ? new Date(investment_start_date) : undefined,
                },
            });

            return res.status(200).json(updatedItem);
        } catch (error) {
            return res.status(500).json({ error: "Internal server error." });
        }
    }

    static async deletePortfolio(req: Request, res: Response): Promise<any> {
        const userId = getUserIdFromToken(req);
        if (!userId) {
            return res.status(403).json({ error: "Invalid or missing token." });
        }

        const portfolioId = parseInt(req.params.id, 10);
        if (isNaN(portfolioId)) {
            return res.status(400).json({ error: "Invalid portfolio ID." });
        }

        try {
            const portfolioItem = await prisma.portfolio.findFirst({
                where: { id: portfolioId, userId: userId },
            });

            if (!portfolioItem) {
                return res.status(404).json({ error: "Portfolio item not found or you do not have permission to delete it." });
            }

            await prisma.portfolio.delete({
                where: { id: portfolioId },
            });

            return res.status(204).send();
        } catch (error) {
            return res.status(500).json({ error: "Internal server error." });
        }
    }
}