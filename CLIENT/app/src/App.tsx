import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import CompanyBasedAnalytics from "./pages/stock-market";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/company-based/:ticker/quantity/:quantity/Sd/:startDate/Ed/:endDate" element={<CompanyBasedAnalytics />} />
      </Routes>
    </Router>
  );
}
