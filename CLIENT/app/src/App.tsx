import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import CompanyBasedAnalytics from "./pages/stock-market";
import Auth from "./pages/auth";
import Portfolio from "./pages/portfolio";
import PortfolioHub from "./pages/portfolio-new";
import CompanyAnalyticsForm from "./pages/Select-company";
import HomePage from "./pages/home";
export default function App() {
  const token = localStorage.getItem("QUANT-TOKEN");
  return (
    <Router>
      <Routes>
        <Route path="/company-based/:ticker/quantity/:quantity/Sd/:startDate/Ed/:endDate" element={<CompanyBasedAnalytics />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/portfolio" element={token ? <Portfolio /> : <Auth />} />
        <Route path="/portfolio-hub" element={token ? <PortfolioHub /> : <Auth />} />
        <Route path="/select" element={<CompanyAnalyticsForm />} />
        <Route path="/" element={<HomePage />} />

      </Routes>
    </Router>
  );
}
