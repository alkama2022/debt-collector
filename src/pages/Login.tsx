import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { useToast } from "../components/ui/toast";
import { ThemeToggle } from "../components/ui/theme-toggle";
import { config } from "../config";

export default function Login() {
  const { login, loading } = useAuth();
  const nav = useNavigate();
  const { push } = useToast();
  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");
  const [err, setErr] = useState("");
  {/*
  const [serverStatus, setServerStatus] = useState<
    "checking" | "online" | "offline" | "waking"
  >("checking");

  // // Ping the backend health endpoint on mount
  // useEffect(() => {
  //   let cancelled = false;
  //   const ping = async () => {
  //     try {
  //       const base = config.apiBaseUrl.replace(/\/api\/v1\/?$/, "");
  //       const res = await fetch(`${base}/health`, {
  //         signal: AbortSignal.timeout(8000),
  //       });
  //       if (!cancelled) setServerStatus(res.ok ? "online" : "offline");
  //     } catch {
  //       if (!cancelled) setServerStatus("offline");
  //     }
  //   };
  //   ping();
  //   return () => {
  //     cancelled = true;
  //   };
  // }, []);

  // const wakeServer = async () => {
  //   setServerStatus("waking");
  //   push("Waking the server — this takes ~30 seconds on first load…", "info");
  //   try {
  //     const base = config.apiBaseUrl.replace(/\/api\/v1\/?$/, "");
  //     const res = await fetch(`${base}/health`, {
  //       signal: AbortSignal.timeout(45000),
  //     });
  //     setServerStatus(res.ok ? "online" : "offline");
  //     if (res.ok) push("Server is awake — you can now log in", "success");
  //     else
  //       push("Server did not respond. Check your Render dashboard.", "error");
  //   } catch {
  //     setServerStatus("offline");
  //     push("Server did not respond within 45s. Try again shortly.", "error");
  //   }
  // };
  */}

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    if (!email || !pwd) {
      setErr("Email and password are required");
      return;
    }
    try {
      await login(email, pwd);
      nav("/dashboard");
      push("Welcome back", "success");
      
    } catch (e: any) {
      const status = e?.status;
      const msg =
        status === 0
          ? "Cannot reach the server."
          : status === 400 || status === 401
            ? "Incorrect email or password."
            : status === 404
              ? "Something Went Wrong."
              : e?.data?.detail ||
                e?.data?.message ||
                e?.data?.non_field_errors?.[0] ||
                "Login failed. Please try again.";
      setErr(msg);
      // if (status === 0){
      //    setServerStatus("offline")
      //   };
      
    }
  };

  return (
    <div className="min-h-screen-dvh bg-[#f8fafc] dark:bg-[#020617] flex transition-colors">
      <div className="flex-1 max-w-md mx-auto w-full px-5 sm:px-6 py-8 sm:py-12">
        <div className="flex items-center justify-between gap-3">
          <Link
            to="/"
            className="inline-flex items-center gap-2 font-semibold dark:text-white"
          >
            <div className="w-8 h-8 rounded-xl bg-brand-600 text-white flex items-center justify-center text-xs">
              CN
            </div>
            CollectNaija
          </Link>
          <ThemeToggle />
        </div>
        <h1 className="text-2xl font-bold mt-8 dark:text-white">
          Welcome back
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
          Sign in to your workspace.
        </p>
   
        <form
          onSubmit={submit}
          className="mt-4 space-y-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm"
        >
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@business.com"
            autoComplete="email"
          />
          <Input
            label="Password"
            type="password"
            value={pwd}
            onChange={(e) => setPwd(e.target.value)}
            autoComplete="current-password"
          />
          {err && (
            <div
              className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 text-sm text-red-700"
              role="alert"
            >
              {err}
            </div>
          )}
          <Button
            type="submit"
            // disabled={loading || serverStatus === "waking"}
            className="w-full"
          >
            {loading ? "Signing in…" : "Sign in"}
          </Button>
          <div className="flex justify-between text-sm">
            <Link to="/signup" className="text-brand-600 hover:underline">
              Create account
            </Link>
            <button
              type="button"
              onClick={() =>
                push(
                  "Password reset — contact support@collectnaija.com",
                  "info",
                )
              }
              className="text-slate-500 hover:text-slate-700"
            >
              Forgot password?
            </button>
          </div>
          <div className="text-xs text-slate-500 border-t pt-3 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" /> Encrypted
            &amp; org-isolated
          </div>
        </form>
        <div className="mt-4 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
          Don't have an account?{" "}
          <Link to="/signup" className="text-brand-600 underline font-medium">
            Register here
          </Link>{" "}
          — takes 30 seconds.
        </div>
      </div>

      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 text-white p-10 flex-col justify-center border-l">
        <div className="max-w-md">
          <div className="text-xs font-medium tracking-widest uppercase text-white/50">
            Why teams stay
          </div>
          <h2 className="text-3xl font-bold mt-2 leading-tight">
            Know who owes you. Know when they promised to pay.
          </h2>
          <p className="text-sm text-white/70 mt-3">
            No spreadsheets. No chasing. Just a quiet workspace that keeps your
            cash flow clear.
          </p>
          <ul className="mt-6 space-y-3 text-sm text-white/85">
            <li className="flex gap-2">
              <span className="w-6 h-6 rounded-full bg-white/10 grid place-items-center text-xs">
                ✓
              </span>{" "}
              Balances calculated on the server — always accurate
            </li>
            <li className="flex gap-2">
              <span className="w-6 h-6 rounded-full bg-white/10 grid place-items-center text-xs">
                ✓
              </span>{" "}
              Works offline, syncs when you're back
            </li>
            <li className="flex gap-2">
              <span className="w-6 h-6 rounded-full bg-white/10 grid place-items-center text-xs">
                ✓
              </span>{" "}
              Built for Nigeria, ready for the world
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
