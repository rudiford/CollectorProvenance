import { useState, useEffect } from "react";
import { useParams, useLocation, Link } from "wouter";
import { useAuth } from "@/lib/auth";
import { carsApi, logsApi, Car } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft } from "lucide-react";
import { carTitle } from "@/lib/utils";

export default function AddConditionLog() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [car, setCar] = useState<Car | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const today = new Date().toISOString().split("T")[0];
  const [form, setForm] = useState({
    date: today,
    mileage: "",
    logType: "observation" as const,
    title: "",
    description: "",
    shopName: "",
  });

  useEffect(() => {
    if (!user) {
      setLocation("/auth");
      return;
    }
    carsApi.get(id!).then((d) => setCar(d.car)).catch(() => setLocation("/dashboard"));
  }, [id, user]);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await logsApi.create(id!, {
        ...form,
        mileage: form.mileage ? parseInt(form.mileage) : undefined,
      });
      setLocation(`/cars/${id}`);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const logTypes = [
    { value: "observation", label: "Observation" },
    { value: "maintenance", label: "Maintenance" },
    { value: "restoration", label: "Restoration" },
    { value: "event", label: "Event" },
    { value: "acquisition", label: "Acquisition" },
  ];

  return (
    <div className="container mx-auto px-4 py-10 max-w-xl animate-fade-in">
      <Link href={`/cars/${id}`} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors">
        <ArrowLeft className="h-4 w-4" />
        {car ? carTitle(car) : "Back"}
      </Link>

      <h1 className="text-2xl font-semibold mb-1">Add log entry</h1>
      <p className="text-muted-foreground text-sm mb-8">
        Document a maintenance event, restoration work, or observation.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Date</Label>
            <Input type="date" value={form.date} onChange={set("date")} required max={today} />
          </div>
          <div className="space-y-1.5">
            <Label>Mileage</Label>
            <Input
              type="number"
              placeholder="Optional"
              value={form.mileage}
              onChange={set("mileage")}
              min="0"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>Entry type</Label>
          <Select
            value={form.logType}
            onValueChange={(v: any) => setForm((f) => ({ ...f, logType: v }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {logTypes.map((t) => (
                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label>Title</Label>
          <Input
            placeholder="e.g. 30k service, valve adjustment, Monterey Historics"
            value={form.title}
            onChange={set("title")}
            required
          />
        </div>

        <div className="space-y-1.5">
          <Label>Description</Label>
          <Textarea
            placeholder="Describe what was done, what was observed, how the car felt..."
            value={form.description}
            onChange={set("description")}
            required
            rows={6}
            className="resize-none leading-relaxed"
          />
          <p className="text-xs text-muted-foreground">Write naturally — this is a journal entry for the car.</p>
        </div>

        <div className="space-y-1.5">
          <Label>Shop or mechanic</Label>
          <Input
            placeholder="Who did the work? (optional)"
            value={form.shopName}
            onChange={set("shopName")}
          />
        </div>

        {error && (
          <div className="text-sm text-red-400 border border-red-400/20 rounded-md p-3 bg-red-400/5">
            {error}
          </div>
        )}

        <Button type="submit" className="w-full" size="lg" disabled={loading}>
          {loading ? "Saving..." : "Add to history"}
        </Button>
      </form>
    </div>
  );
}
