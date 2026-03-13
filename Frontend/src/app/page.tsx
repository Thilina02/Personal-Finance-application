"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";

export default function Home() {
  const { user, initialized } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!initialized) return;

    if (!user) {
      router.replace("/auth/login");
    } else {
      router.replace("/dashboard");
    }
  }, [initialized, user, router]);

  if (!initialized) return null;

  return null;
}
