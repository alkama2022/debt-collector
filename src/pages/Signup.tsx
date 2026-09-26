import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { useToast } from "../components/ui/toast";
import { ThemeToggle } from "../components/ui/theme-toggle";
import { config } from "../config";

export default function Signup() {
  const { signup, loading } = useAuth();
  const nav = useNavigate();
  const { push } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");
  const [err, setErr] = useState("");
  const [fieldErr, setFieldErr] = useState<Record<string, string>>({});
  const [serverStatus, setServerStatus] = useState<
    "checking" | "online" | "offline" | "waking"
  >("checking");

  // Ping the backend on mount
  useEffect(() => {
    let cancelled = false;
    const ping = async () => {
      try {
        const base = config.apiBaseUrl.replace(/\/api\/v1\/?$/, "");
        const res = await fetch(`${base}/health`, {
          signal: AbortSignal.timeout(8000),
        });
        if (!cancelled) setServerStatus(res.ok ? "online" : "offline");
      } catch {
        if (!cancelled) setServerStatus("offline");
      }
    };
    ping();
    return () => {
      cancelled = true;
    };
  }, []);

  const wakeServer = async () => {
    setServerStatus("waking");
    // push("Waking server — ~30 seconds on Render free tier…", "info");
    try {
      const base = config.apiBaseUrl.replace(/\/api\/v1\/?$/, "");
      const res = await fetch(`${base}/health`, {
        signal: AbortSignal.timeout(45000),
      });
      setServerStatus(res.ok ? "online" : "offline");
      if (res.ok) push("Server is awake — you can now register", "success");
    } catch {
      setServerStatus("offline");
      push("Server timed out. Try again shortly.", "error");
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const fe: Record<string, string> = {};
    if (!name.trim()) fe.name = "Your name is required";
    if (!email.trim()) fe.email = "Email is required";
    if (pwd.length < 8) fe.pwd = "Password must be at least 8 characters";
    setFieldErr(fe);
    if (Object.keys(fe).length) return;
    setErr("");

    try {
      await signup({ name, email, password: pwd });
      push("Account created!", "success");
      nav("/onboarding");
    } catch (e: any) {
      const status = e?.status;
      const msg =
        status === 0
          ? "Registration failed. Please try again."
          : status === 400
            ? e?.data?.errors?.email?.[0] ||
              e?.data?.email?.[0] ||
              e?.data?.password?.[0] ||
              e?.data?.message ||
              "Please check your details and try again."
            : status === 409
              ? "An account with this email already exists. Try logging in instead."
              : e?.data?.detail ||
                e?.data?.message ||
                "Registration failed. Please try again.";
      setErr(msg);
      if (status === 0) setServerStatus("offline");
    }
  };

  return (
    <div className="min-h-screen-dvh bg-[#f8fafc] dark:bg-[#020617] flex transition-colors">
      <div className="flex-1 max-w-md mx-auto w-full px-5 sm:px-6 py-8">
        <div className="flex items-center justify-between gap-3">
          <Link
            to="/"
            className="font-semibold flex items-center gap-2 dark:text-white"
          >
            <div className="w-8 h-8 rounded-xl bg-brand-600 text-white flex items-center justify-center text-xs">
              CN
            </div>
            CollectNaija
          </Link>
          <ThemeToggle />
        </div>

        <h1 className="text-2xl font-bold mt-6 dark:text-white">
          Create your workspace
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
          Takes 30 seconds. No credit card required.
        </p>

        {/* Server status banner 
        {serverStatus === "checking" && (
          <div className="mt-4 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-slate-400 animate-pulse" />
            Checking server status…
          </div>
        )}
          
        {serverStatus === "online" && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-700 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Server is online — ready to register
          </div>
        )}
       
        {(serverStatus === "offline" || serverStatus === "waking") && (
          <div className="mt-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <span
                  className={`w-2 h-2 rounded-full ${serverStatus === "waking" ? "bg-amber-400 animate-pulse" : "bg-amber-500"}`}
                />
                {serverStatus === "waking"
                  ? "Waking server (~30s)…"
                  : "Server offline or sleeping"}
              </span>
              {serverStatus !== "waking" && (
                <button
                  onClick={wakeServer}
                  className="ml-3 px-2.5 py-1 rounded-full bg-amber-700 text-white text-xs font-medium"
                >
                  Wake server
                </button>
              )}
            </div>
            <p className="mt-1 font-mono break-all text-amber-700">
              {config.apiBaseUrl}
            </p>
          </div>
        )}
        */}
        <form
          onSubmit={submit}
          className="mt-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm space-y-4"
        >
          <Input
            label="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={fieldErr.name}
            placeholder="Adebayo Okafor"
            autoComplete="name"
          />
          <Input
            label="Work email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={fieldErr.email}
            placeholder="you@business.com"
            autoComplete="email"
          />
          <Input
            label="Password"
            type="password"
            value={pwd}
            onChange={(e) => setPwd(e.target.value)}
            error={fieldErr.pwd}
            placeholder="At least 8 characters"
            autoComplete="new-password"
          />
          {err && (
            <div
              className="p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700"
              role="alert"
            >
              {err}
            </div>
          )}
          <Button
            type="submit"
            disabled={loading || serverStatus === "waking"}
            className="w-full"
          >
            {loading ? "Creating account…" : "Create account"}
          </Button>
          <div className="text-xs text-slate-500 text-center">
            By continuing you agree to Terms and Privacy.
          </div>
          <div className="text-sm text-center">
            <Link to="/login" className="text-brand-600 hover:underline">
              Already have an account? Log in
            </Link>
          </div>
        </form>
      </div>

      <div className="hidden lg:flex flex-1 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 p-10 items-center">
        <div className="max-w-sm">
          <h3 className="font-semibold dark:text-white">
            What happens after registration?
          </h3>
          <ol className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-400">
            <li>1. Onboarding — set your business name, type and currency</li>
            <li>2. Add your first customer</li>
            <li>3. Create your first invoice and see the balance</li>
            <li>4. Automated reminders start working immediately</li>
          </ol>
          {/*
          <div className="mt-6 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 text-xs text-slate-600">
            
            <strong>Customer:</strong>{" "}
            <span className="font-mono break-all">{config.apiBaseUrl}</span>
          </div>
           */}
        </div>
      </div>
    </div>
  );
}
