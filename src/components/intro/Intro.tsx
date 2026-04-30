"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function Intro() {
  const [videoSrc, setVideoSrc] = useState("/intro-gym-master-h.webm");
  const router = useRouter();

  useEffect(() => {
    // Detectar dispositivo y establecer el video correcto
    const isMobile = window.innerWidth <= 768;
    setVideoSrc(
      isMobile ? "/intro-gym-master-v.webm" : "/intro-gym-master-h.webm"
    );

    // Redirigir a login luego de 6 segundos (6000 ms)
    const timeout = setTimeout(() => {
      router.push("/auth/login");
    }, 6000);

    return () => clearTimeout(timeout);
  }, [router]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black">
      <video
        src={videoSrc}
        autoPlay
        muted
        playsInline
        className="w-full h-full object-cover"
      />
    </div>
  );
}
