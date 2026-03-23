import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { contactApi } from "@/lib/api";
import { useTitle } from "@/lib/useTitle";

export default function Contact() {
  useTitle("Contact Us");

  const [form, setForm] = useState({ senderName: "", senderEmail: "", subject: "", message: "" });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await contactApi.sendWebmaster(form);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-semibold tracking-tight mb-3">Contact Us</h1>
          <p className="text-muted-foreground">
            Have questions, suggestions, or feedback? Send us a note — let's discuss how to improve this platform for all.
          </p>
        </div>

        <Card className="border-border/50">
          <CardContent className="pt-6">
            {success ? (
              <div className="text-center py-8">
                <div className="text-sm text-green-400 border border-green-400/20 rounded-lg p-4 bg-green-400/5">
                  Your message has been sent. Thank you! We'll be in touch.
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="senderName">Name</Label>
                  <Input
                    id="senderName"
                    placeholder="Your name"
                    value={form.senderName}
                    onChange={(e) => setForm({ ...form, senderName: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="senderEmail">Email</Label>
                  <Input
                    id="senderEmail"
                    type="email"
                    placeholder="your@email.com"
                    value={form.senderEmail}
                    onChange={(e) => setForm({ ...form, senderEmail: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    placeholder="What's this about?"
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    placeholder="Your message..."
                    rows={5}
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    required
                  />
                </div>

                {error && (
                  <p className="text-sm text-red-400">{error}</p>
                )}

                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? "Sending..." : "Send Message"}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
