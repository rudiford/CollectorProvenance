import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { carsApi, Car } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Car as CarIcon, Eye, EyeOff, ArrowRight } from "lucide-react";
import { carTitle, statusLabel } from "@/lib/utils";

export default function Dashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLocation("/auth");
      return;
    }
    carsApi.mine().then(({ cars }) => {
      setCars(cars);
      setLoading(false);
    });
  }, [user, setLocation]);

  if (loading) return <LoadingState />;

  return (
    <div className="container mx-auto px-4 py-10 max-w-5xl animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-semibold">My Garage</h1>
          <p className="text-muted-foreground mt-1">
            {cars.length === 0
              ? "No cars yet — add your first"
              : `${cars.length} car${cars.length !== 1 ? "s" : ""} in your registry`}
          </p>
        </div>
        <Link href="/cars/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Add car
          </Button>
        </Link>
      </div>

      {cars.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cars.map((car) => (
            <CarCard key={car.id} car={car} />
          ))}
        </div>
      )}
    </div>
  );
}

function CarCard({ car }: { car: Car }) {
  return (
    <Link href={`/cars/${car.id}`} className="group block rounded-lg border border-border bg-card overflow-hidden hover:border-border/80 hover:shadow-lg hover:shadow-black/20 transition-all">
        {/* Photo */}
        <div className="aspect-[16/9] bg-secondary overflow-hidden relative">
          {car.heroPhotoUrl ? (
            <img
              src={car.heroPhotoUrl}
              alt={carTitle(car)}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <CarIcon className="h-12 w-12 text-muted-foreground/30" />
            </div>
          )}
          <div className="absolute top-3 right-3 flex gap-1.5">
            <span title={car.isPublic ? "Public" : "Private"}>
              {car.isPublic ? (
                <Eye className="h-4 w-4 text-white/60" />
              ) : (
                <EyeOff className="h-4 w-4 text-white/40" />
              )}
            </span>
          </div>
        </div>

        {/* Info */}
        <div className="p-4">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="font-medium text-sm leading-tight">
              {car.year} {car.model}
              {car.variant && <span className="text-muted-foreground"> {car.variant}</span>}
            </h3>
            <Badge variant="outline" className="text-xs shrink-0 capitalize">
              {statusLabel(car.currentStatus)}
            </Badge>
          </div>
          {car.factoryColorName && (
            <p className="text-xs text-muted-foreground">{car.factoryColorName}</p>
          )}
          <p className="text-xs text-muted-foreground mt-2 font-mono">
            {car.chassisNumber}
          </p>
        </div>
    </Link>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-24 border border-dashed border-border rounded-lg">
      <CarIcon className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
      <h3 className="font-medium mb-2">No cars yet</h3>
      <p className="text-sm text-muted-foreground mb-6">
        Add your first car to start building its provenance record.
      </p>
      <Link href="/cars/new">
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Add your first car
        </Button>
      </Link>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="container mx-auto px-4 py-10 max-w-5xl">
      <div className="flex items-center justify-between mb-8">
        <div className="space-y-2">
          <div className="h-8 w-40 bg-secondary rounded-md animate-pulse" />
          <div className="h-4 w-56 bg-secondary rounded-md animate-pulse" />
        </div>
        <div className="h-10 w-28 bg-secondary rounded-md animate-pulse" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-lg border border-border bg-card overflow-hidden">
            <div className="aspect-[16/9] bg-secondary animate-pulse" />
            <div className="p-4 space-y-2">
              <div className="h-4 w-3/4 bg-secondary rounded animate-pulse" />
              <div className="h-3 w-1/2 bg-secondary rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
