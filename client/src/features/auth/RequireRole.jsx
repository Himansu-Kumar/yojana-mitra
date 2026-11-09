import { useAuth } from "./AuthContext.jsx";
import { Card } from "../../shared/ui/index.jsx";

export default function RequireRole({ roles = [], children }) {
  const { user } = useAuth();

  if (!user || !roles.includes(user.role)) {
    return (
      <div className="mx-auto max-w-lg p-6">
        <Card className="p-6 text-center">
          <h2 className="text-lg font-semibold text-ink">Access restricted</h2>
          <p className="mt-2 text-sm text-muted">You don't have access to this page.</p>
        </Card>
      </div>
    );
  }

  return children;
}

