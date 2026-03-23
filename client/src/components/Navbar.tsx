import { Link } from "wouter";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
export default function Navbar() {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-sm">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link href={user ? "/dashboard" : "/"} className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="text-base">Collector Provenance</span>
        </Link>

        {/* Right side - only show auth buttons when logged out */}
        {!user && (
          <div className="flex items-center gap-3">
            <Link href="/auth">
              <Button variant="ghost" size="sm">Sign in</Button>
            </Link>
            <Link href="/auth?tab=register">
              <Button size="sm">Join</Button>
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
