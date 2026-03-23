import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { carsApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";

const MAKES_AND_MODELS: Record<string, string[]> = {
  "Porsche": [
    "356", "911", "912", "914", "924", "928", "930", "944", "959",
    "964", "968", "993", "996", "997", "991", "992", "Boxster", "Cayman",
    "Cayenne", "Macan", "Panamera", "Taycan", "718",
  ],
  "Ferrari": [
    "125", "166", "195", "212", "225", "250", "275", "288 GTO", "308", "328",
    "330", "340", "348", "355", "360", "365", "375", "410", "430", "456",
    "458", "488", "500", "512", "550", "575", "599", "612", "812",
    "California", "Daytona", "Dino", "Enzo", "F40", "F50", "F8", "FF",
    "GTC4Lusso", "LaFerrari", "Mondial", "Portofino", "Roma", "SF90", "Testarossa",
  ],
  "Aston Martin": [
    "DB2", "DB4", "DB5", "DB6", "DB7", "DB9", "DB11", "DB12", "DBS",
    "Rapide", "V8 Vantage", "V12 Vantage", "Vanquish", "Virage", "Zagato",
    "Valkyrie", "Vulcan", "One-77",
  ],
  "Jaguar": [
    "C-Type", "D-Type", "E-Type", "F-Type", "Mark II", "Mark V", "Mark VII",
    "Mark IX", "Mark X", "SS100", "XJ", "XJ6", "XJ12", "XJ13", "XJ40",
    "XJ220", "XJS", "XK", "XK100", "XK120", "XK140", "XK150", "XKR",
  ],
  "Rolls Royce": [
    "Corniche", "Dawn", "Ghost", "Phantom", "Silver Cloud", "Silver Dawn",
    "Silver Ghost", "Silver Shadow", "Silver Spirit", "Silver Spur",
    "Silver Wraith", "Spectre", "Wraith",
  ],
  "Bentley": [
    "3 Litre", "4½ Litre", "Arnage", "Azure", "Bentayga", "Brooklands",
    "Continental", "Continental GT", "Continental R", "Corniche",
    "Flying Spur", "Mulsanne", "R Type", "S Type", "Speed Six", "Turbo R",
  ],
  "McLaren": [
    "570S", "600LT", "620R", "650S", "675LT", "720S", "750S", "765LT",
    "Artura", "Elva", "F1", "GT", "MP4-12C", "P1", "Senna", "Speedtail",
  ],
  "Shelby": [
    "Cobra 260", "Cobra 289", "Cobra 427", "Cobra Daytona", "GT350",
    "GT350R", "GT500", "GT500KR", "Series 1",
  ],
  "Duesenberg": [
    "Model A", "Model J", "Model SJ", "Model SSJ", "Model X",
  ],
  "Packard": [
    "Caribbean", "Clipper", "Custom Eight", "Darrin", "Hawk",
    "One-Twenty", "Patrician", "Super Eight", "Twelve",
  ],
  "Cadillac": [
    "Allante", "Brougham", "CTS-V", "De Ville", "Eldorado", "Escalade",
    "Fleetwood", "Series 61", "Series 62", "Series 75", "Seville", "V-16",
  ],
  "Buick": [
    "Century", "Electra", "GNX", "Grand National", "GSX", "Invicta",
    "LeSabre", "Limited", "Reatta", "Riviera", "Roadmaster", "Skylark", "Wildcat",
  ],
  "Ford": [
    "Bronco", "Fairlane", "Falcon", "Galaxie", "GT", "GT40", "Model A",
    "Model T", "Mustang", "Shelby GT350", "Shelby GT500", "Thunderbird",
    "Victoria", "Woody",
  ],
  "Other": [],
};

const MAKES = Object.keys(MAKES_AND_MODELS);

export default function AddCar() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    year: new Date().getFullYear().toString(),
    make: "Porsche",
    model: "",
    variant: "",
    chassisNumber: "",
    engineNumber: "",
    transmissionNumber: "",
    factoryColorCode: "",
    factoryColorName: "",
    factoryInterior: "",
    currentStatus: "original" as const,
    locationState: "",
    locationCountry: "US",
    isPublic: false,
    willingToSell: false,
  });

  if (!user) {
    setLocation("/auth");
    return null;
  }

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { car } = await carsApi.create({
        ...form,
        year: parseInt(form.year),
      });
      setLocation(`/cars/${car.id}`);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-10 max-w-2xl animate-fade-in">
      <Link href="/dashboard" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors">
        <ArrowLeft className="h-4 w-4" />
        Back to garage
      </Link>

      <h1 className="text-2xl font-semibold mb-1">Add a car</h1>
      <p className="text-muted-foreground text-sm mb-8">Start building the provenance record for your car.</p>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Core specs */}
        <section className="space-y-4">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Core specs</h2>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Year</Label>
              <Input
                type="number"
                min="1886"
                max={new Date().getFullYear() + 1}
                value={form.year}
                onChange={set("year")}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>Make</Label>
              <Select value={form.make} onValueChange={(v) => setForm((f) => ({ ...f, make: v, model: "" }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select make" />
                </SelectTrigger>
                <SelectContent>
                  {MAKES.map((m) => (
                    <SelectItem key={m} value={m}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Model</Label>
              {MAKES_AND_MODELS[form.make]?.length > 0 ? (
                <Select value={form.model} onValueChange={(v) => setForm((f) => ({ ...f, model: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select model" />
                  </SelectTrigger>
                  <SelectContent>
                    {MAKES_AND_MODELS[form.make].map((m) => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  placeholder="Enter model"
                  value={form.model}
                  onChange={set("model")}
                  required
                />
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Variant / Trim</Label>
              <Input
                placeholder="Carrera RS, Turbo, S..."
                value={form.variant}
                onChange={set("variant")}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Chassis Number <span className="text-muted-foreground font-normal text-xs ml-1">Not required, but highly encouraged!</span></Label>
            <Input
              placeholder="e.g. 9117101234 or WP0AB29842S623456"
              value={form.chassisNumber}
              onChange={set("chassisNumber")}
              className="font-mono"
            />
            <p className="text-xs text-muted-foreground">Supports vintage chassis numbers and modern 17-digit VINs</p>
          </div>
        </section>

        {/* Numbers */}
        <section className="space-y-4">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Numbers</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Engine Number</Label>
              <Input placeholder="Optional" value={form.engineNumber} onChange={set("engineNumber")} className="font-mono" />
            </div>
            <div className="space-y-1.5">
              <Label>Transmission Number</Label>
              <Input placeholder="Optional" value={form.transmissionNumber} onChange={set("transmissionNumber")} className="font-mono" />
            </div>
          </div>
        </section>

        {/* Color & Interior */}
        <section className="space-y-4">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Factory spec</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Paint Code</Label>
              <Input placeholder="e.g. 027, L31K" value={form.factoryColorCode} onChange={set("factoryColorCode")} />
            </div>
            <div className="space-y-1.5">
              <Label>Color Name</Label>
              <Input placeholder="e.g. Guards Red, Slate Grey" value={form.factoryColorName} onChange={set("factoryColorName")} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Factory Interior</Label>
            <Input placeholder="e.g. Black leatherette, Cognac leather" value={form.factoryInterior} onChange={set("factoryInterior")} />
          </div>
        </section>

        {/* Status & Location */}
        <section className="space-y-4">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Status</h2>

          <div className="space-y-1.5">
            <Label>Current Status</Label>
            <Select
              value={form.currentStatus}
              onValueChange={(v: any) => setForm((f) => ({ ...f, currentStatus: v }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="original">Original</SelectItem>
                <SelectItem value="restored">Restored</SelectItem>
                <SelectItem value="modified">Modified</SelectItem>
                <SelectItem value="barn_find">Barn Find</SelectItem>
                <SelectItem value="project">Project</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>State / Region</Label>
              <Input placeholder="e.g. California" value={form.locationState} onChange={set("locationState")} />
            </div>
            <div className="space-y-1.5">
              <Label>Country</Label>
              <Input value={form.locationCountry} onChange={set("locationCountry")} />
            </div>
          </div>
        </section>

        {/* Privacy */}
        <section className="space-y-4">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Privacy</h2>

          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-lg border border-border p-4">
              <div>
                <p className="text-sm font-medium">Make this car public</p>
                <p className="text-xs text-muted-foreground mt-0.5">Others can view the full profile and history</p>
              </div>
              <Switch
                checked={form.isPublic}
                onCheckedChange={(v) => setForm((f) => ({ ...f, isPublic: v }))}
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border p-4">
              <div>
                <p className="text-sm font-medium">Open to offers</p>
                <p className="text-xs text-muted-foreground mt-0.5">Show a "For sale" indicator on the public profile</p>
              </div>
              <Switch
                checked={form.willingToSell}
                onCheckedChange={(v) => setForm((f) => ({ ...f, willingToSell: v }))}
              />
            </div>
          </div>
        </section>

        {error && (
          <div className="text-sm text-red-400 border border-red-400/20 rounded-md p-3 bg-red-400/5">
            {error}
          </div>
        )}

        <Button type="submit" className="w-full" size="lg" disabled={loading}>
          {loading ? "Creating..." : "Add to registry"}
        </Button>
      </form>
    </div>
  );
}
