"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setError(data?.error || "Login failed");
        return;
      }

      // backend returns { user, message } — store user in localStorage
      if (data?.user) {
        localStorage.setItem("user", JSON.stringify(data.user));
      }

      router.push("/");
    } catch (err: any) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-[#0A0A0F] relative overflow-hidden">
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-purple-600/10 blur-[100px] rounded-full -z-10" />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-blue-600/10 blur-[100px] rounded-full -z-10" />

      <Card className="w-full max-w-md bg-[#12121A] border-white/10 shadow-2xl relative z-10">
        <CardHeader className="space-y-1">
          <CardTitle className="text-3xl font-bold text-white tracking-tight text-center">
            Welcome Back
          </CardTitle>
          <CardDescription className="text-gray-400 text-center">
            Sign in to continue your streak
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-300 font-medium">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="Ex: coder@algoaryna.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-white/5 border-white/10 text-white placeholder:text-gray-600 focus:border-purple-500 focus:ring-purple-500 rounded-xl h-12"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-300 font-medium">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="********"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-white/5 border-white/10 text-white placeholder:text-gray-600 focus:border-purple-500 focus:ring-purple-500 rounded-xl h-12"
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4 pt-2">
            {error && (
              <p className="text-sm text-red-400 text-center" role="alert">
                {error}
              </p>
            )}
            <Button
              className="w-full h-12 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold shadow-lg shadow-purple-500/20 transition-all hover:-translate-y-0.5"
              type="submit"
              disabled={loading}
            >
              {loading ? "Verifying..." : "Log In"}
            </Button>
            <p className="text-center text-sm text-gray-500">
              Don&apos;t have an account?{" "}
              <Link
                href="/signup"
                className="font-semibold text-purple-400 hover:text-purple-300 transition-colors"
              >
                Sign Up
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
