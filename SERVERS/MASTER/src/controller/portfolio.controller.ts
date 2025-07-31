import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import axios from "axios";
import { createClient } from 'redis';


dotenv.config();

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'default_secret';

const getUserIdFromToken = (req: Request): number | null => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return null;

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as { id: number };
        return decoded.id;
    } catch {
        return null;
    }
};

interface PortfolioItem {
    company_tikker: string;
    company_name: string;
    company_share_amount: number;
    investment_start_date: string;
}

export class PortfolioController {

    static async getPortfolio(req: Request, res: Response): Promise<any> {
        const userId = getUserIdFromToken(req);
        if (!userId) return res.status(403).json({ error: "Invalid or missing token." });

        try {
            const portfolios = await prisma.portfolio.findMany({ where: { userId } });
            return res.status(200).json(portfolios);
        } catch {
            return res.status(500).json({ error: "Internal server error." });
        }
    }

    static async addPortfolio(req: Request, res: Response): Promise<any> {
        const userId = getUserIdFromToken(req);
        if (!userId) return res.status(403).json({ error: "Invalid or missing token." });

        const items: PortfolioItem[] = req.body;
        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ error: "Request body must be a non-empty array of portfolio items." });
        }

        try {
            const dataToCreate = items.map(item => ({
                ...item,
                userId,
                investment_start_date: new Date(item.investment_start_date),
            }));

            const result = await prisma.portfolio.createMany({
                data: dataToCreate,
                skipDuplicates: true,
            });

            return res.status(201).json({ message: `${result.count} portfolio items added successfully.` });
        } catch {
            return res.status(500).json({ error: "Could not add items to portfolio." });
        }
    }

    static async updatePortfolio(req: Request, res: Response): Promise<any> {
        const userId = getUserIdFromToken(req);
        if (!userId) return res.status(403).json({ error: "Invalid or missing token." });

        const portfolioId = parseInt(req.params.id, 10);
        if (isNaN(portfolioId)) return res.status(400).json({ error: "Invalid portfolio ID." });

        const { company_share_amount, investment_start_date }: Partial<PortfolioItem> = req.body;

        try {
            const portfolioItem = await prisma.portfolio.findUnique({ where: { id: portfolioId } });
            if (!portfolioItem || portfolioItem.userId !== userId) {
                return res.status(404).json({ error: "Portfolio item not found or permission denied." });
            }

            const updatedItem = await prisma.portfolio.update({
                where: { id: portfolioId },
                data: {
                    company_share_amount,
                    investment_start_date: investment_start_date ? new Date(investment_start_date) : undefined,
                },
            });

            return res.status(200).json(updatedItem);
        } catch {
            return res.status(500).json({ error: "Internal server error." });
        }
    }

    static async deletePortfolio(req: Request, res: Response): Promise<any> {
        const userId = getUserIdFromToken(req);
        if (!userId) return res.status(403).json({ error: "Invalid or missing token." });

        const portfolioId = parseInt(req.params.id, 10);
        if (isNaN(portfolioId)) return res.status(400).json({ error: "Invalid portfolio ID." });

        try {
            const portfolioItem = await prisma.portfolio.findFirst({
                where: { id: portfolioId, userId }
            });

            if (!portfolioItem) {
                return res.status(404).json({ error: "Portfolio item not found or permission denied." });
            }

            await prisma.portfolio.delete({ where: { id: portfolioId } });
            return res.status(204).send();
        } catch {
            return res.status(500).json({ error: "Internal server error." });
        }
    }

    static async holyAPI(req: Request, res: Response): Promise<any> {
        const userId = getUserIdFromToken(req);
        if (!userId) return res.status(403).json({ error: "Invalid or missing token." });

        try {

            // check in cache. 


            const portfolios = await prisma.portfolio.findMany({ where: { userId } });
            if (portfolios.length === 0) return res.status(404).json({ error: "No portfolios found." });

            const today = new Date().toISOString().split("T")[0];
            const companiesData = portfolios.map(p => ({
                stockSymbol: p.company_tikker,
                startDate: p.investment_start_date.toISOString().split("T")[0],
                endDate: today
            }));

            const companyNames = companiesData.map(c => c.stockSymbol);
            const key = `portfolio:${userId}:${companyNames.join(',')}`;

            const cachedData = await prisma.cache.findUnique({ where: { id: key } });
            if (cachedData) {
                console.log("🔄 Cache hit for portfolio data.");
                return res.status(200).json({ strategies: JSON.parse(cachedData.data) });
            }

            const strategyEndpoints = [
                { name: "Mean Reversion", url: "http://localhost:3000/strategy/mean-reversion", key: "companiesData" },
                { name: "Avg Crossover", url: "http://localhost:3000/st2/portfolio-strategy", key: "companiesData" },
                { name: "Regression", url: "http://localhost:3000/multiple-portfolio-regression", key: "companiesInfoArray" },
                { name: "Gemini Strategy", url: "http://localhost:3000/gemini/portfolio-strategy", key: "companies" }
            ];

            type StrategyResult = { strategy: string; response?: any; error?: string };

            const strategyPromises: Promise<StrategyResult>[] = strategyEndpoints.map(endpoint => {
                const payload: any = {};
                payload[endpoint.key] = companiesData;

                return axios.post(endpoint.url, payload)
                    .then(resp => ({ strategy: endpoint.name, response: resp.data }))
                    .catch(err => ({ strategy: endpoint.name, error: err.message || "Unknown error" }));
            });

            const results = await Promise.all(strategyPromises);

            results.forEach(result => {
                if (result.response) {
                    console.log(`✅ ${result.strategy}:`, result.response);
                } else {
                    console.error(`❌ ${result.strategy}:`, result.error);
                }
            });

            await prisma.cache.create({
                data: {
                    id: key,
                    data: JSON.stringify(results),
                    createdAt: new Date(),
                    updatedAt: new Date()
                }
            });


            return res.status(200).json({ strategies: results });

        } catch (error) {
            console.error("🔥 Aggregation Error:", error);
            return res.status(500).json({ error: "Internal server error" });
        }
    }
}
