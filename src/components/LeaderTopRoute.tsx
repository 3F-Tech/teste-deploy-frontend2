import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

interface LeaderTopRouteProps {
  children: React.ReactNode;
}

export function LeaderTopRoute({ children }: LeaderTopRouteProps) {
  const { isAuthenticated, user, isLoading } = useAuth();

  // Aguardar carregamento do auth antes de redirecionar
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  if (!user?.leader_top) {
    return <Navigate to="/home" replace />;
  }

  return <>{children}</>;
}
