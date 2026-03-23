import { useState, useEffect } from "react";
import { Link } from "wouter";
import { carsApi, CarSummary } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Car, MapPin, Tag, SlidersHorizontal, X } from "lucide-react";
import { carTitle, statusLabel } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { useTitle } from "@/lib/useTitle";

const MARQUES = [
  "All", "Porsche", "Ferrari", "Aston Martin", "Jaguar", "Rolls Royce",
  "Bentley", "McLaren", "Shelby", "Duesenberg", "Packard",
  "Cadillac", "Buick", "Ford", "Other",
];

export default function Browse() {
  useTitle("Browse Registry");
  const [cars, setCars] = useState<CarSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [make, setMake] = useState("All");
  const [status, setStatus] = useState("All");
  const [showFilters, setShowFilters] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (query) params.q = query;
      if (make !== "All") params.make = make;
      if (status !== "All") params.status = status;
      const { cars } = await carsApi.list(params);
      setCars(cars);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    load();
  };

  const clearFilters = () => {
    setQuery("");
    setMake("All");
    setStatus("All");
  };

  const hasFilters = query || make !== "All" || status !== "All";

  return (
    <div className="container mx-auto px-4 py-10 max-w-6xl animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-semibold mb-2">Browse Registry</h1>
        <p className="text-muted-foreground">
          Explore publicly listed collector cars with verified provenance.
        </p>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by model, color, chassis number, year..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button type="submit">Search</Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => setShowFilters(!showFilters)}
          className={showFilters ? "border-foreground" : ""}
        >
          <SlidersHorizontal className="h-4 w-4" />
        </Button>
      </form>

      {/* Filters */}
      {showFilters && (
        <div className="flex gap-3 mb-4 flex-wrap animate-fade-in">
          <Select value={make} onValueChange={(v) => setMake(v)}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Marque" />
            </SelectTrigger>
            <SelectContent>
              {MARQUES.map((m) => (
                <SelectItem key={m} value={m}>{m === "All" ? "All Marques" : m}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={status} onValueChange={(v) => setStatus(v)}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All statuses</SelectItem>
              <SelectItem value="original">Original</SelectItem>
              <SelectItem value="restored">Restored</SelectItem>
              <SelectItem value="modified">Modified</SelectItem>
              <SelectItem value="barn_find">Barn Find</SelectItem>
              <SelectItem value="project">Project</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" onClick={load} className="gap-2">
            Apply
          </Button>

          {hasFilters && (
            <Button variant="ghost" onClick={clearFilters} className="gap-1.5 text-muted-foreground">
              <X className="h-3.5 w-3.5" />
              Clear
            </Button>
          )}
        </div>
      )}

      {/* Results count */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">
          {loading ? "Loading..." : `${cars.length} car${cars.length !== 1 ? "s" : ""} found`}
        </p>
      </div>

      {/* Grid */}
      {loading ? (
        <LoadingGrid />
      ) : cars.length === 0 ? (
        <EmptyResults onClear={clearFilters} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cars.map((car) => (
            <BrowseCard key={car.id} car={car} />
          ))}
        </div>
      )}
    </div>
  );
}

function BrowseCard({ car }: { car: CarSummary }) {
  return (
    <Link href={`/cars/${car.id}`} className="group block rounded-lg border border-border bg-card overflow-hidden hover:border-border/80 hover:shadow-lg hover:shadow-black/20 transition-all">
        {/* Photo */}
        <div className="aspect-[16/9] bg-secondary overflow-hidden">
          {car.heroPhotoUrl ? (
            <img
              src={car.heroPhotoUrl}
              alt={`${car.year} ${car.model}`}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Car className="h-10 w-10 text-muted-foreground/20" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-4">
          <div className="flex items-start justify-between gap-2 mb-1">
            <div>
              <h3 className="font-medium text-sm">
                {car.year} {car.model}
                {car.variant && <span className="text-muted-foreground"> {car.variant}</span>}
              </h3>
              {car.factoryColorName && (
                <p className="text-xs text-muted-foreground">{car.factoryColorName}</p>
              )}
            </div>
            <div className="flex flex-col gap-1 items-end shrink-0">
              <Badge variant="outline" className="text-xs capitalize">{statusLabel(car.currentStatus)}</Badge>
              {car.willingToSell && (
                <span className="text-xs text-amber-400 flex items-center gap-1">
                  <Tag className="h-3 w-3" />
                  For sale
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between mt-3">
            {car.locationState && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3" />
                {car.locationState}
              </span>
            )}
            {car.ownerUsername && (
              <span className="text-xs text-muted-foreground">
                {car.ownerDisplayName || car.ownerUsername}
              </span>
            )}
          </div>
        </div>
    </Link>
  );
}

function LoadingGrid() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="rounded-lg border border-border bg-card overflow-hidden">
          <div className="aspect-[16/9] bg-secondary animate-pulse" />
          <div className="p-4 space-y-2">
            <div className="h-4 w-3/4 bg-secondary rounded animate-pulse" />
            <div className="h-3 w-1/2 bg-secondary rounded animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyResults({ onClear }: { onClear: () => void }) {
  return (
    <div className="text-center py-24 border border-dashed border-border rounded-lg">
      <Search className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
      <h3 className="font-medium mb-2">No cars found</h3>
      <p className="text-sm text-muted-foreground mb-4">Try adjusting your search or filters.</p>
      <Button variant="outline" onClick={onClear}>Clear filters</Button>
    </div>
  );
}
