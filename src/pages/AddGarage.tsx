import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api-client";
import { useAuth } from "@/context/AuthContext";

const countryOptions = ["India", "United States", "United Kingdom", "Canada", "Australia"];

const parseList = (value: string) =>
  value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

export default function AddGarage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading } = useAuth();

  const [submitting, setSubmitting] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>("");
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [form, setForm] = useState({
    name: "",
    logoUrl: "",
    openTime: "",
    contactPhone: "",
    addressCountry: "India",
    addressState: "",
    addressStreet: "",
    services: "",
    mechanicsCount: "",
    serviceImageUrl: "",
    mapUrl: "",
    carRepairTypes: "",
    sinceYear: "",
    sellsSecondHand: false,
    problemsSolvedCount: "",
    paymentMethods: "",
    description: "",
  });

  useEffect(() => {
    if (!loading && !user) {
      navigate("/register", { replace: true });
    }
  }, [loading, user, navigate]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheckbox = (checked: boolean | "indeterminate") => {
    setForm((prev) => ({ ...prev, sellsSecondHand: checked === true }));
  };

  const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const numericValue = useMemo(
    () => (value: string) => {
      const parsed = Number.parseInt(value, 10);
      return Number.isNaN(parsed) ? null : parsed;
    },
    []
  );

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user) return;

    setSubmitting(true);
    try {
      const garageData = {
        ownerId: user.id,
        name: form.name.trim(),
        openTime: form.openTime.trim() || null,
        contactPhone: form.contactPhone.trim() || null,
        addressCountry: form.addressCountry.trim() || null,
        addressState: form.addressState.trim() || null,
        addressStreet: form.addressStreet.trim() || null,
        services: parseList(form.services),
        mechanicsCount: numericValue(form.mechanicsCount),
        serviceImageUrl: form.serviceImageUrl.trim() || null,
        mapUrl: form.mapUrl.trim() || null,
        carRepairTypes: parseList(form.carRepairTypes),
        sinceYear: numericValue(form.sinceYear),
        sellsSecondHand: form.sellsSecondHand,
        problemsSolvedCount: numericValue(form.problemsSolvedCount),
        paymentMethods: parseList(form.paymentMethods),
        description: form.description.trim() || null,
      };

      const { data, error } = await api.createGarageWithFallback(garageData, logoFile || undefined);

      if (error) {
        throw new Error(error);
      }

      toast({
        title: "Garage added",
        description: "Your garage has been published successfully.",
      });

      navigate("/garages");
    } catch (error: any) {
      toast({
        title: "Unable to add garage",
        description: error?.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <main className="pt-32 pb-24 bg-background">
          <div className="container mx-auto px-4 text-center text-muted-foreground">
            Loading...
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <main className="pt-32 pb-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="text-3xl">Add Garage</CardTitle>
                <CardDescription>Provide details to list your garage on the platform.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Garage Name</Label>
                      <Input
                        id="name"
                        name="name"
                        placeholder="AutoCare Premium"
                        value={form.name}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="logo">Garage Logo</Label>
                      <Input
                        id="logo"
                        name="logo"
                        type="file"
                        accept="image/*"
                        onChange={handleLogoChange}
                        className="cursor-pointer"
                      />
                      {logoPreview && (
                        <div className="mt-2">
                          <img src={logoPreview} alt="Logo preview" className="h-20 w-20 object-cover rounded border" />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="openTime">Opening Time</Label>
                      <Input
                        id="openTime"
                        name="openTime"
                        placeholder="08:00 AM - 08:00 PM"
                        value={form.openTime}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contactPhone">Contact Number</Label>
                      <Input
                        id="contactPhone"
                        name="contactPhone"
                        placeholder="+91 98765 43210"
                        value={form.contactPhone}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="addressCountry">Country</Label>
                      <select
                        id="addressCountry"
                        name="addressCountry"
                        value={form.addressCountry}
                        onChange={handleChange}
                        className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                      >
                        {countryOptions.map((country) => (
                          <option key={country} value={country}>
                            {country}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="addressState">State</Label>
                      <Input
                        id="addressState"
                        name="addressState"
                        placeholder="Maharashtra"
                        value={form.addressState}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="addressStreet">Street</Label>
                      <Input
                        id="addressStreet"
                        name="addressStreet"
                        placeholder="123 Garage Street"
                        value={form.addressStreet}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="services">Services (comma separated)</Label>
                      <Textarea
                        id="services"
                        name="services"
                        placeholder="Oil Change, Brake Service, AC Service"
                        value={form.services}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="carRepairTypes">Car Repair Types (comma separated)</Label>
                      <Textarea
                        id="carRepairTypes"
                        name="carRepairTypes"
                        placeholder="Sedan, SUV, Hatchback"
                        value={form.carRepairTypes}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="mechanicsCount">Mechanics Count</Label>
                      <Input
                        id="mechanicsCount"
                        name="mechanicsCount"
                        type="number"
                        placeholder="12"
                        value={form.mechanicsCount}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="sinceYear">Since Year</Label>
                      <Input
                        id="sinceYear"
                        name="sinceYear"
                        type="number"
                        placeholder="2009"
                        value={form.sinceYear}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="problemsSolvedCount">Problems Solved</Label>
                      <Input
                        id="problemsSolvedCount"
                        name="problemsSolvedCount"
                        type="number"
                        placeholder="3500"
                        value={form.problemsSolvedCount}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="serviceImageUrl">Service Image URL</Label>
                      <Input
                        id="serviceImageUrl"
                        name="serviceImageUrl"
                        placeholder="https://..."
                        value={form.serviceImageUrl}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="mapUrl">Google Map Location URL</Label>
                      <Input
                        id="mapUrl"
                        name="mapUrl"
                        placeholder="https://maps.google.com/..."
                        value={form.mapUrl}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="paymentMethods">Payment Methods (comma separated)</Label>
                      <Textarea
                        id="paymentMethods"
                        name="paymentMethods"
                        placeholder="Cash, UPI, Card"
                        value={form.paymentMethods}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description">About the Garage</Label>
                      <Textarea
                        id="description"
                        name="description"
                        placeholder="Share a short overview of your garage."
                        value={form.description}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Checkbox
                      id="sellsSecondHand"
                      checked={form.sellsSecondHand}
                      onCheckedChange={handleCheckbox}
                    />
                    <Label htmlFor="sellsSecondHand">We sell second-hand cars</Label>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button type="submit" size="lg" disabled={submitting || uploadingLogo} className="flex-1">
                      {uploadingLogo ? "Uploading Logo..." : submitting ? "Saving..." : "Publish Garage"}
                    </Button>
                    <Button type="button" variant="outline" size="lg" className="flex-1" onClick={() => navigate("/garages")}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
