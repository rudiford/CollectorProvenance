import { Route, Switch } from "wouter";
import { AuthProvider, useAuth } from "@/lib/auth";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import Landing from "@/pages/Landing";
import Auth from "@/pages/Auth";
import Dashboard from "@/pages/Dashboard";
import AddCar from "@/pages/AddCar";
import CarProfile from "@/pages/CarProfile";
import AddConditionLog from "@/pages/AddConditionLog";
import Browse from "@/pages/Browse";
import UserProfile from "@/pages/UserProfile";
import Transfer from "@/pages/Transfer";
import Admin from "@/pages/Admin";

function AppContent() {
  const { user } = useAuth();

  return (
    <>
      <Navbar />
      <div className="flex">
        {user && <Sidebar />}
        <main className={user ? "ml-64 flex-1 min-h-[calc(100vh-4rem)]" : "flex-1 min-h-[calc(100vh-4rem)]"}>
          <Switch>
            <Route path="/" component={Landing} />
            <Route path="/auth" component={Auth} />
            <Route path="/dashboard" component={Dashboard} />
            <Route path="/browse" component={Browse} />
            <Route path="/cars/new" component={AddCar} />
            <Route path="/cars/:id/log/new" component={AddConditionLog} />
            <Route path="/cars/:id/transfer" component={Transfer} />
            <Route path="/cars/:id" component={CarProfile} />
            <Route path="/u/:userId" component={UserProfile} />
          <Route path="/admin" component={Admin} />
            <Route path="/transfer" component={Transfer} />
            <Route>
              <div className="container mx-auto px-4 py-24 text-center">
                <h1 className="text-3xl font-semibold mb-4">404</h1>
                <p className="text-muted-foreground">Page not found.</p>
              </div>
            </Route>
          </Switch>
        </main>
      </div>
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
