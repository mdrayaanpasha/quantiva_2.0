import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import CompanyBasedAnalytics from "./pages/stock-market";
import Auth from "./pages/auth";
import Portfolio from "./pages/portfolio";
export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/company-based/:ticker/quantity/:quantity/Sd/:startDate/Ed/:endDate" element={<CompanyBasedAnalytics />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/portfolio" element={<Portfolio />} />
      </Routes>
    </Router>
  );
}
