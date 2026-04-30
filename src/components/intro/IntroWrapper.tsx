"use client";

import { useEffect, useState } from "react";
import Intro from "./Intro";
import { useRouter } from "next/navigation";

export default function IntroWrapper() {
  const [introVisible, setIntroVisible] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Solo en cliente
    if (typeof window !== "undefined") {
      const seen = localStorage.getItem("introSeen");
      if (seen) {
        setIntroVisible(false);
        router.push("/auth/login");
      }
    }
  }, []);

  useEffect(() => {
    if (!introVisible) return;

    // Simula duración de intro (3.5s por ejemplo)
    const timer = setTimeout(() => {
     // localStorage.setItem("introSeen", "true");
      setIntroVisible(false);
      router.push("/auth/login");
    }, 3500); // Tiempo en ms

    return () => clearTimeout(timer);
  }, [introVisible, router]);

  if (!introVisible) return null;

  return <Intro />;
}
