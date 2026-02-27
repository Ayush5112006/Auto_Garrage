import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Mail, Lock, Eye, EyeOff, UserRound } from "lucide-react";
import { useAuth } from "@/context/useAuth";
import { getRoleDefaultCredentials } from "@/lib/defaultCredentials";

const customerDefaults = getRoleDefaultCredentials("customer");

export default function CustomerLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const { toast } = useToast();
  const navigate = useNavigate();
  const { login, user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (authLoading) return;
    if (user?.id) {
      const role = String(user.role || "").toLowerCase();
      if (role === "admin") navigate("/admin", { replace: true });
      else if (role === "manager") navigate("/garagehost", { replace: true });
      else if (role === "staff" || role === "mechanic") navigate("/staff", { replace: true });
      else navigate("/dashboard", { replace: true });
    }
  }, [authLoading, navigate, user]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setAuthError(null);

    try {
      const nextUser = await login(email.trim(), password, undefined, rememberMe);
      if (!nextUser?.id) {
        throw new Error("Unable to sign in. Please try again.");
      }

      toast({
        title: "Login successful",
        description: "Redirecting to your dashboard...",
      });

      const role = String(nextUser.role || "").toLowerCase();
      if (role === "admin") navigate("/admin", { replace: true });
      else if (role === "manager") navigate("/garagehost", { replace: true });
      else if (role === "staff" || role === "mechanic") navigate("/staff", { replace: true });
      else navigate("/dashboard", { replace: true });
    } catch (error: any) {
      const message = error?.message || "Invalid credentials";
      setAuthError(message);
      toast({
        title: "Login failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUseDefaultCredentials = () => {
    setEmail(customerDefaults.email);
    setPassword(customerDefaults.password);
    setAuthError(null);
  };

  return (
    <div className="min-h-screen">
      <main className="pt-32 pb-24 bg-gradient-to-b from-background to-muted/30">
        <div className="page-shell">
          <div className="max-w-md mx-auto">
            <Card className="border-2">
              <CardHeader className="text-center space-y-2">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto">
                  <UserRound className="w-8 h-8 text-primary" />
                </div>
                <CardTitle className="text-3xl">Customer Login</CardTitle>
                <CardDescription>Sign in to book and manage services</CardDescription>
              </CardHeader>

              <CardContent>
                <div className="mb-4 rounded-md border bg-muted/40 p-3 text-sm">
                  <p className="font-medium">Default Customer ID</p>
                  <p className="text-muted-foreground">{customerDefaults.email}</p>
                  <p className="mt-1 text-muted-foreground">Password: {customerDefaults.password}</p>
                  <Button type="button" variant="outline" size="sm" className="mt-2" onClick={handleUseDefaultCredentials}>
                    Use default credentials
                  </Button>
                </div>
                {authError ? (
                  <div className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                    {authError}
                  </div>
                ) : null}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-base">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="you@email.com"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        required
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-base">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="********"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        required
                        className="pl-10 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <label className="flex items-center gap-2 text-muted-foreground cursor-pointer">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(event) => setRememberMe(event.target.checked)}
                        className="h-4 w-4 rounded border-border accent-primary"
                      />
                      Keep me signed in
                    </label>
                    <button
                      type="button"
                      onClick={() => navigate("/forgot-password")}
                      className="text-primary hover:underline font-medium"
                    >
                      Forgot password?
                    </button>
                  </div>

                  <Button type="submit" className="w-full mt-6" size="lg" disabled={loading}>
                    {loading ? "Signing in..." : "Sign In"}
                  </Button>
                </form>

                <div className="mt-6 text-center text-sm text-muted-foreground">
                  New customer?{" "}
                  <button
                    type="button"
                    onClick={() => navigate("/register")}
                    className="text-primary hover:underline font-semibold"
                  >
                    Create account
                  </button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
