import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export function ProtectedRoute({ 
  children, 
  requiredRole 
}: { 
  children: React.ReactNode, 
  requiredRole?: string 
}) {
  const auth = useAuth();

  if (!auth.isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (requiredRole && auth.userRole !== requiredRole && auth.userRole !== 'admin') {
    return <Navigate to="/unauthorized" />;
  }

  return <>{children}</>;
}