import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { LeaderTopRoute } from "./components/LeaderTopRoute";
import Index from "./pages/Index";
import Home from "./pages/Home";
import EvaluationForm from "./pages/EvaluationForm";
import HomeHomer from "./pages/HomeHomer";
import HomeCarl from "./pages/HomeCarl";
import Report from "./pages/Report";
import ManageUsers from "./pages/ManageUsers";
import ManageBUs from "./pages/ManageBUs";
import PerformanceAnalysis from "./pages/PerformanceAnalysis";
import ProfileEdit from "./pages/ProfileEdit";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false, // Desativa refresh ao focar na janela
      refetchOnMount: false, // Desativa refresh automático ao montar componente
      retry: false,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route
              path="/home"
              element={
                <ProtectedRoute>
                  <Home />
                </ProtectedRoute>
              }
            />
            <Route
              path="/evaluation-form"
              element={
                <ProtectedRoute>
                  <EvaluationForm />
                </ProtectedRoute>
              }
            />
            <Route
              path="/home-homer"
              element={
                <ProtectedRoute>
                  <HomeHomer />
                </ProtectedRoute>
              }
            />
            <Route
              path="/home-carl"
              element={
                <ProtectedRoute>
                  <HomeCarl />
                </ProtectedRoute>
              }
            />
            <Route
              path="/report"
              element={
                <LeaderTopRoute>
                  <Report />
                </LeaderTopRoute>
              }
            />
            <Route
              path="/manage-users"
              element={
                <ProtectedRoute>
                  <ManageUsers />
                </ProtectedRoute>
              }
            />
            <Route
              path="/manage-bus"
              element={
                <ProtectedRoute>
                  <ManageBUs />
                </ProtectedRoute>
              }
            />
            <Route
              path="/performance-analysis"
              element={
                <ProtectedRoute>
                  <PerformanceAnalysis />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ProfileEdit />
                </ProtectedRoute>
              }
            />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
