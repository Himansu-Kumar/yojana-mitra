import { BrowserRouter, Route, Routes } from "react-router-dom";
import Layout from "./Layout.jsx";
import { AuthProvider } from "../features/auth/AuthContext.jsx";
import RequireAuth from "../features/auth/RequireAuth.jsx";
import AuthPage from "../features/auth/AuthPage.jsx";
import HomePage from "../features/home/HomePage.jsx";
import ProfilePage from "../features/profile/ProfilePage.jsx";
import SchemesPage from "../features/schemes/SchemesPage.jsx";
import SchemeDetailPage from "../features/schemes/SchemeDetailPage.jsx";
import BenefitsPage from "../features/eligibility/BenefitsPage.jsx";
import AssistantPage from "../features/assistant/AssistantPage.jsx";

const NotFound = () => <p className="text-muted">Page not found.</p>;

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="login" element={<AuthPage mode="login" />} />
            <Route path="register" element={<AuthPage mode="register" />} />
            <Route path="schemes" element={<SchemesPage />} />
            <Route path="schemes/:slug" element={<SchemeDetailPage />} />
            <Route path="benefits" element={<RequireAuth><BenefitsPage /></RequireAuth>} />
            <Route path="profile" element={<RequireAuth><ProfilePage /></RequireAuth>} />
            <Route path="assistant" element={<RequireAuth><AssistantPage /></RequireAuth>} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
