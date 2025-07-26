import { Router } from 'express';
import { PortfolioController } from '../controller/portfolio.controller';

const PortfolioRouter = Router();

// Define routes, no middleware needed here
PortfolioRouter.get('/', PortfolioController.getPortfolio);
PortfolioRouter.post('/', PortfolioController.addPortfolio);
PortfolioRouter.put('/:id', PortfolioController.updatePortfolio);
PortfolioRouter.delete('/:id', PortfolioController.deletePortfolio);
PortfolioRouter.get("/holy-api", PortfolioController.holyAPI);

export default PortfolioRouter;