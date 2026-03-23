import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { carsApi } from "@/lib/api";
import type { Car } from "@/lib/api";
import { cn } from "@/lib/utils";
import {
  Car as CarIcon, User, ChevronDown, ChevronRight, Plus, Search,
  LogOut, Home, FolderOpen, Folder, FileText, Shield, Mail, MessageSquare
} from "lucide-react";

export default function Sidebar() {
  const { user, logout } = useAuth();
  const [location] = useLocation();
  const [garageOpen, setGarageOpen] = useState(true);
  const [myCars, setMyCars] = useState<Car[]>([]);
  const [loadingCars, setLoadingCars] = useState(false);

  useEffect(() => {
    if (user) {
      setLoadingCars(true);
      carsApi.mine().then(({ cars }) => {
        setMyCars(cars);
        setLoadingCars(false);
      }).catch(() => setLoadingCars(false));
    }
  }, [user, location]); // refetch when navigating (in case a car was added)

  if (!user) return null;

  const isActive = (path: string) => location === path;
  const isCarActive = (carId: string) => location === `/cars/${carId}`;

  return (
    <aside className="fixed left-0 top-16 bottom-0 w-64 border-r border-border/50 bg-card/50 overflow-y-auto z-40">
      <div className="flex flex-col h-full">
        {/* User section */}
        <div className="p-4 border-b border-border/50">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-foreground/10 flex items-center justify-center text-sm font-semibold shrink-0">
              {(user.displayName || user.username).charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{user.displayName || user.username}</p>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1">
          {/* Home */}
          <Link
            href="/"
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
              isActive("/") ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
            )}
          >
            <Home className="h-4 w-4 shrink-0" />
            Home
          </Link>

          {/* Browse */}
          <Link
            href="/browse"
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
              isActive("/browse") ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
            )}
          >
            <Search className="h-4 w-4 shrink-0" />
            Browse Registry
          </Link>

          {/* Personal Profile */}
          <Link
            href={`/u/${user.id}`}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
              isActive(`/u/${user.id}`) ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
            )}
          >
            <User className="h-4 w-4 shrink-0" />
            My Profile
          </Link>

          {/* Inbox */}
          <Link
            href="/inbox"
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
              isActive("/inbox") ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
            )}
          >
            <Mail className="h-4 w-4 shrink-0" />
            Inbox
          </Link>

          {/* Contact Webmaster */}
          <Link
            href="/contact"
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
              isActive("/contact") ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
            )}
          >
            <MessageSquare className="h-4 w-4 shrink-0" />
            Contact Webmaster
          </Link>

          {/* Admin */}
          {user.isAdmin && (
            <Link
              href="/admin"
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                isActive("/admin") ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
              )}
            >
              <Shield className="h-4 w-4 shrink-0" />
              Admin
            </Link>
          )}

          {/* My Garage - expandable folder */}
          <div className="pt-2">
            <button
              onClick={() => setGarageOpen(!garageOpen)}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors w-full",
                isActive("/dashboard") ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
              )}
            >
              {garageOpen ? (
                <FolderOpen className="h-4 w-4 shrink-0" />
              ) : (
                <Folder className="h-4 w-4 shrink-0" />
              )}
              <span className="flex-1 text-left">My Garage</span>
              <span className="text-xs text-muted-foreground mr-1">{myCars.length}</span>
              {garageOpen ? (
                <ChevronDown className="h-3.5 w-3.5 shrink-0" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5 shrink-0" />
              )}
            </button>

            {garageOpen && (
              <div className="ml-3 mt-1 space-y-0.5 border-l border-border/50 pl-3">
                {loadingCars ? (
                  <div className="px-3 py-2 text-xs text-muted-foreground">Loading...</div>
                ) : myCars.length === 0 ? (
                  <div className="px-3 py-2 text-xs text-muted-foreground">No cars yet</div>
                ) : (
                  myCars.map((car) => (
                    <Link
                      key={car.id}
                      href={`/cars/${car.id}`}
                      className={cn(
                        "flex items-center gap-2.5 px-3 py-1.5 rounded-md text-sm transition-colors",
                        isCarActive(car.id) ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                      )}
                    >
                      <CarIcon className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{car.year} {car.model}</span>
                      {car.variant && (
                        <span className="text-xs text-muted-foreground truncate">{car.variant}</span>
                      )}
                    </Link>
                  ))
                )}

                {/* Add car */}
                <Link
                  href="/cars/new"
                  className={cn(
                    "flex items-center gap-2.5 px-3 py-1.5 rounded-md text-sm transition-colors",
                    isActive("/cars/new") ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                  )}
                >
                  <Plus className="h-3.5 w-3.5 shrink-0" />
                  <span>Add a car</span>
                </Link>
              </div>
            )}
          </div>
        </nav>

        {/* Bottom - Sign out */}
        <div className="p-3 border-t border-border/50">
          <button
            onClick={logout}
            className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors w-full"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            Sign Out
          </button>
        </div>
      </div>
    </aside>
  );
}
