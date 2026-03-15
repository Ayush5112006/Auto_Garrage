import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api-client";
import { useAuth } from "@/context/useAuth";
import { uploadStaffImage, addGarageStaffDoc } from "@/lib/firebase-db";

const LOCAL_STAFF_KEY = "garage_staff_local";
const STAFF_SIGNUP_COOLDOWN_KEY = "staff_signup_cooldown_until";

const parseNumber = (value: string) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const buildDefaultPassword = (name: string) => {
  const safeName = name.replace(/[^a-zA-Z]/g, "").toLowerCase();
  const firstFour = (safeName.slice(0, 4) || "user").padEnd(4, "x");
  const now = new Date();
  const day = String(now.getDate()).padStart(2, "0");
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${firstFour}@${day}${month}`;
};

type StaffForm = {
  name: string;
  emailId: string;
  services: string;
  experience: string;
  yearOfJoin: string;
  salary: string;
};

export default function AddStaff() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading } = useAuth();

  const [submitting, setSubmitting] = useState(false);
  const [profilePic, setProfilePic] = useState<File | null>(null);
  const [profilePreview, setProfilePreview] = useState("");
  const [form, setForm] = useState<StaffForm>({
    name: "",
    emailId: "",
    services: "",
    experience: "",
    yearOfJoin: "",
    salary: "",
  });

  useEffect(() => {
    if (!loading && !user) {
      navigate("/register", { replace: true });
    }
  }, [loading, user, navigate]);

  const defaultPassword = useMemo(() => buildDefaultPassword(form.name), [form.name]);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleProfilePic = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    setProfilePic(file);
    if (!file) {
      setProfilePreview("");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => setProfilePreview((reader.result as string) || "");
    reader.readAsDataURL(file);
  };

  const uploadProfilePicture = async () => {
    if (!profilePic || !user?.id) return "";
    try {
      const url = await uploadStaffImage(profilePic, `staff/${user.id}`);
      return url || "";
    } catch {
      return "";
    }
  };

  const saveLocalFallback = (payload: Record<string, unknown>) => {
    const existingRaw = localStorage.getItem(LOCAL_STAFF_KEY);
    const existing = existingRaw ? (JSON.parse(existingRaw) as Record<string, unknown>[]) : [];
    const next = [{ id: crypto.randomUUID(), ...payload }, ...existing];
    localStorage.setItem(LOCAL_STAFF_KEY, JSON.stringify(next));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user) return;

    setSubmitting(true);

    try {
      const name = form.name.trim();
      const email = form.emailId.trim().toLowerCase();
      const services = form.services.trim();

      if (!name || !email || !services) {
        throw new Error("Name, Email ID, and Services are required.");
      }

      const generatedPassword = buildDefaultPassword(name);
      let authNotice = "";
      const cooldownUntil = Number(localStorage.getItem(STAFF_SIGNUP_COOLDOWN_KEY) || "0");
      const now = Date.now();

      if (cooldownUntil > now) {
        authNotice = "Staff login account creation is temporarily paused due to signup rate limit.";
      } else {
        const registerResult = await api.register(name, email, generatedPassword, { autoLogin: false });
        if (registerResult.error) {
          const message = registerResult.error.toLowerCase();
          const alreadyRegistered = message.includes("already");
          const rateLimited =
            message.includes("too many requests") ||
            message.includes("rate limit") ||
            message.includes("429");

          if (rateLimited) {
            const cooldownMs = 10 * 60 * 1000;
            localStorage.setItem(STAFF_SIGNUP_COOLDOWN_KEY, String(Date.now() + cooldownMs));
            authNotice = "Signup rate limit reached. Staff details were saved; login account can be created later.";
          } else if (!alreadyRegistered) {
            throw new Error(registerResult.error);
          }
        }
      }

      const profilePicUrl = await uploadProfilePicture();

      try {
        await addGarageStaffDoc({
          ownerId: user.id,
          name,
          emailId: email,
          services,
          experienceYears: parseNumber(form.experience),
          yearOfJoin: parseNumber(form.yearOfJoin),
          salary: parseNumber(form.salary),
          profilePicUrl: profilePicUrl || null,
          defaultPassword: generatedPassword,
        });
        toast({
          title: "Staff added successfully",
          description: authNotice || `Default password: ${generatedPassword}`,
        });
      } catch {
        saveLocalFallback({
          owner_id: user.id,
          name,
          email_id: email,
          services,
          experience_years: parseNumber(form.experience),
          year_of_join: parseNumber(form.yearOfJoin),
          salary: parseNumber(form.salary),
          profile_pic_url: profilePicUrl || null,
          default_password: generatedPassword,
          created_at: new Date().toISOString(),
        });
        toast({
          title: "Staff added with local fallback",
          description: "Staff details were saved locally.",
        });
      }

      setForm({
        name: "",
        emailId: "",
        services: "",
        experience: "",
        yearOfJoin: "",
        salary: "",
      });
      setProfilePic(null);
      setProfilePreview("");
    } catch (error: any) {
      toast({
        title: "Unable to add staff",
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
          <div className="container mx-auto px-4 text-center text-muted-foreground">Loading...</div>
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
                <CardTitle className="text-3xl">Add New Staff</CardTitle>
                <CardDescription>Create a staff profile with login credentials.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Name</Label>
                      <Input
                        id="name"
                        name="name"
                        placeholder="Rahul Sharma"
                        value={form.name}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="emailId">Email ID</Label>
                      <Input
                        id="emailId"
                        type="email"
                        name="emailId"
                        placeholder="rahul@garage.com"
                        value={form.emailId}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="services">Services</Label>
                    <Textarea
                      id="services"
                      name="services"
                      placeholder="Engine Repair, Brake Service"
                      value={form.services}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="experience">Experience (Years)</Label>
                      <Input
                        id="experience"
                        name="experience"
                        type="number"
                        min="0"
                        placeholder="4"
                        value={form.experience}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="yearOfJoin">Year of Join</Label>
                      <Input
                        id="yearOfJoin"
                        name="yearOfJoin"
                        type="number"
                        min="1990"
                        max="2100"
                        placeholder="2024"
                        value={form.yearOfJoin}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="salary">Salary</Label>
                      <Input
                        id="salary"
                        name="salary"
                        type="number"
                        min="0"
                        placeholder="25000"
                        value={form.salary}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="profilePic">Profile Pic</Label>
                    <Input
                      id="profilePic"
                      name="profilePic"
                      type="file"
                      accept="image/*"
                      onChange={handleProfilePic}
                    />
                    {profilePreview ? (
                      <img src={profilePreview} alt="Profile preview" className="h-24 w-24 rounded border object-cover" />
                    ) : null}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="defaultPassword">Default Password</Label>
                    <Input id="defaultPassword" value={defaultPassword} readOnly />
                    <p className="text-xs text-muted-foreground">Format: first 4 letters of name + @ + current date + month</p>
                  </div>

                  <Button type="submit" className="w-full" disabled={submitting}>
                    {submitting ? "Creating Staff..." : "Create Staff"}
                  </Button>
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
