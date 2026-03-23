import { useState, useEffect } from "react";
import { useParams, Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { transfersApi, carsApi, TransferCode, Car } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Copy, Check, RefreshCw, X, ArrowRightLeft } from "lucide-react";
import { carTitle } from "@/lib/utils";

export default function Transfer() {
  const { id } = useParams<{ id?: string }>();
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  // Determine mode: if we have a car id param, it's the "generate" flow
  // Otherwise it's the "claim" flow
  const [mode, setMode] = useState<"generate" | "claim">(id ? "generate" : "claim");
  const [car, setCar] = useState<Car | null>(null);
  const [transfer, setTransfer] = useState<TransferCode | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [claimCode, setClaimCode] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!user) {
      setLocation("/auth");
      return;
    }
    if (id) {
      // Load car and existing transfer
      carsApi.get(id).then((d) => {
        setCar(d.car);
        if (!d.isOwner) setLocation(`/cars/${id}`);
      });
      transfersApi.getForCar(id).then((d) => setTransfer(d.transfer)).catch(() => {});
    }
  }, [id, user]);

  const generateCode = async () => {
    if (!car) return;
    setLoading(true);
    setError("");
    try {
      const { transfer } = await transfersApi.generate(car.id);
      setTransfer(transfer);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const cancelTransfer = async () => {
    if (!transfer) return;
    setLoading(true);
    try {
      await transfersApi.cancel(transfer.id);
      setTransfer(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const claimTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const { car, message } = await transfersApi.claim(claimCode);
      setSuccess(`Success! You now own the ${carTitle(car)}.`);
      setTimeout(() => setLocation(`/cars/${car.id}`), 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyCode = () => {
    if (!transfer) return;
    navigator.clipboard.writeText(transfer.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const expiresAt = transfer ? new Date(
    typeof transfer.expiresAt === "number" ? transfer.expiresAt * 1000 : transfer.expiresAt
  ) : null;

  return (
    <div className="container mx-auto px-4 py-10 max-w-lg animate-fade-in">
      {id && car ? (
        <Link href={`/cars/${car.id}`} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors">
          <ArrowLeft className="h-4 w-4" />
          {carTitle(car)}
        </Link>
      ) : (
        <Link href="/dashboard" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Back to garage
        </Link>
      )}

      <div className="flex items-center gap-3 mb-2">
        <ArrowRightLeft className="h-6 w-6 text-muted-foreground" />
        <h1 className="text-2xl font-semibold">Transfer Ownership</h1>
      </div>

      {/* Mode toggle (when not tied to a car) */}
      {!id && (
        <>
          <p className="text-muted-foreground text-sm mb-8">
            Enter a transfer code to claim ownership of a car.
          </p>
          <form onSubmit={claimTransfer} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Transfer code</Label>
              <Input
                placeholder="e.g. ABCD1234"
                value={claimCode}
                onChange={(e) => setClaimCode(e.target.value.toUpperCase())}
                className="font-mono text-lg tracking-widest text-center"
                maxLength={8}
                required
              />
              <p className="text-xs text-muted-foreground">
                Ask the current owner to generate a code from their car's profile.
              </p>
            </div>

            {error && (
              <div className="text-sm text-red-400 border border-red-400/20 rounded-md p-3 bg-red-400/5">
                {error}
              </div>
            )}

            {success && (
              <div className="text-sm text-green-400 border border-green-400/20 rounded-md p-3 bg-green-400/5">
                {success}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Claiming..." : "Claim ownership"}
            </Button>
          </form>
        </>
      )}

      {/* Generate mode */}
      {id && car && (
        <div>
          <p className="text-muted-foreground text-sm mb-8">
            Generate a one-time transfer code for the new owner of{" "}
            <span className="text-foreground font-medium">{carTitle(car)}</span>.
          </p>

          {transfer && transfer.status === "pending" ? (
            <div className="space-y-6">
              {/* Code display */}
              <div className="rounded-xl border border-border bg-secondary/30 p-8 text-center">
                <p className="text-xs text-muted-foreground uppercase tracking-widest mb-3">Transfer code</p>
                <div className="text-4xl font-mono font-bold tracking-[0.3em] mb-4">
                  {transfer.code}
                </div>
                <Button variant="outline" size="sm" onClick={copyCode} className="gap-2">
                  {copied ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied ? "Copied!" : "Copy code"}
                </Button>
              </div>

              <div className="text-sm text-muted-foreground space-y-1">
                <p>Share this code with the new owner.</p>
                <p>They'll enter it at <span className="text-foreground font-mono text-xs">/transfer/claim</span> to take ownership.</p>
                {expiresAt && (
                  <p>Expires: <span className="text-foreground">{expiresAt.toLocaleDateString()}</span></p>
                )}
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={generateCode}
                  disabled={loading}
                  className="gap-2"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  New code
                </Button>
                <Button
                  variant="destructive"
                  onClick={cancelTransfer}
                  disabled={loading}
                  className="gap-2"
                >
                  <X className="h-3.5 w-3.5" />
                  Cancel transfer
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-lg border border-border p-6 text-center">
                <p className="text-muted-foreground text-sm mb-4">No active transfer code</p>
                <Button onClick={generateCode} disabled={loading} className="gap-2">
                  <ArrowRightLeft className="h-4 w-4" />
                  {loading ? "Generating..." : "Generate transfer code"}
                </Button>
              </div>

              <p className="text-xs text-muted-foreground">
                Once you generate a code, share it with the buyer. They'll use it to claim the car.
                The code expires after 7 days.
              </p>
            </div>
          )}

          {error && (
            <div className="text-sm text-red-400 border border-red-400/20 rounded-md p-3 bg-red-400/5 mt-4">
              {error}
            </div>
          )}

          <Separator />

          <div className="mt-6">
            <h3 className="text-sm font-medium mb-2">Or claim a code</h3>
            <p className="text-xs text-muted-foreground mb-4">
              If you're receiving a car, enter the transfer code from the seller.
            </p>
            <form onSubmit={claimTransfer} className="flex gap-3">
              <Input
                placeholder="Enter code (e.g. ABCD1234)"
                value={claimCode}
                onChange={(e) => setClaimCode(e.target.value.toUpperCase())}
                className="font-mono tracking-widest flex-1"
                maxLength={8}
              />
              <Button type="submit" variant="outline" disabled={loading || !claimCode}>
                Claim
              </Button>
            </form>
            {success && (
              <p className="text-sm text-green-400 mt-2">{success}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Separator() {
  return <div className="border-t border-border mt-8 mb-0" />;
}
