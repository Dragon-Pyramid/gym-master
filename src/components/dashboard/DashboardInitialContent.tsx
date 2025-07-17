"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuthStore } from "@/stores/authStore";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { Clock, Dumbbell, Star } from "lucide-react";

const DashboardInitialContent = () => {
  const { user } = useAuthStore();
  const userName = user?.nombre || "Invitado";
  const userType = user?.rol || "";

  const motivationalMessages = useMemo(
    () => [
      "La clave no es querer, sino hacer. ¡Empieza hoy!",
      "Tu cuerpo puede lograrlo. Solo tu mente tiene que creerlo.",
      "Cada esfuerzo te acerca a tu mejor versión. ¡No te rindas!",
      "No esperes el momento perfecto, haz perfecto el momento.",
      "La disciplina es el puente entre tus metas y tus logros.",
      "El dolor que sientes hoy será la fuerza que sientes mañana.",
      "No se trata de ser perfecto, se trata de ser mejor que ayer.",
      "Tu única competencia eres tú mismo de ayer.",
    ],
    []
  );

  const [motivationIndex, setMotivationIndex] = useState(() =>
    Math.floor(Math.random() * motivationalMessages.length)
  );
  const [isFading, setIsFading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timeTimer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timeTimer);
  }, []);

  useEffect(() => {
    if (motivationalMessages.length === 0) return;

    const timer = setInterval(() => {
      setIsFading(true);
      setTimeout(() => {
        setMotivationIndex(
          (prevIndex) => (prevIndex + 1) % motivationalMessages.length
        );
        setIsFading(false);
      }, 300);
    }, 5000);

    return () => clearInterval(timer);
  }, [motivationalMessages.length]);

  const randomMotivation = motivationalMessages[motivationIndex];

  const hour = currentTime.getHours();
  let timeOfDay = "";

  if (hour < 12) {
    timeOfDay = "Buenos días";
  } else if (hour < 19) {
    timeOfDay = "Buenas tardes";
  } else {
    timeOfDay = "Buenas noches";
  }

  const typeDisplay =
    userType === "socio"
      ? "Socio"
      : userType === "usuario"
      ? "Usuario"
      : "Administrador";

  const getTypeColor = () => {
    switch (userType) {
      case "socio":
        return "bg-blue-500/10 text-blue-600 border border-blue-200";
      case "usuario":
        return "bg-green-500/10 text-green-600 border border-green-200";
      default:
        return "bg-purple-500/10 text-purple-600 border border-purple-200";
    }
  };

  return (
    <div className="p-4 bg-gradient-to-br from-background via-background to-muted/20 md:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-12">
          <div className="order-2 space-y-8 lg:order-1">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <div
                  className={`inline-flex items-center px-3 py-1 text-sm font-medium rounded-full ${getTypeColor()}`}
                >
                  <Star className="w-3 h-3 mr-1" />
                  {typeDisplay}
                </div>
                <div className="flex items-center gap-2 px-3 py-1 text-sm rounded-full text-muted-foreground bg-muted/50">
                  <Clock className="w-4 h-4" />
                  {currentTime.toLocaleTimeString("es-ES", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <h1 className="text-2xl font-medium text-muted-foreground">
                  {timeOfDay}
                </h1>
                <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black leading-[0.9] tracking-tight">
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-primary to-primary/80">
                    {userName}
                  </span>
                </h2>
                <div className="flex items-center gap-3 pt-2">
                  <Dumbbell className="w-8 h-8 text-primary" />
                  <p className="text-xl font-bold sm:text-2xl md:text-3xl text-foreground">
                    ¡Llegó la hora de entrenar!
                  </p>
                </div>
              </div>
            </div>

            <Card className="p-6 bg-gradient-to-r backdrop-blur-sm from-primary/5 via-primary/10 to-primary/5 border-primary/20">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 mt-3 rounded-full animate-pulse bg-primary" />
                <blockquote
                  className={`text-lg sm:text-xl font-medium text-foreground leading-relaxed transition-all duration-300 ${
                    isFading
                      ? "opacity-0 transform translate-y-2"
                      : "opacity-100 transform translate-y-0"
                  }`}
                >
                  &ldquo;{randomMotivation}&rdquo;
                </blockquote>
              </div>
            </Card>

            <div className="grid grid-cols-3 gap-4 pt-4">
              <Card className="p-4 text-center border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20 dark:border-blue-800">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  💪
                </div>
                <p className="mt-1 text-sm font-medium text-blue-700 dark:text-blue-300">
                  Fuerza
                </p>
              </Card>
              <Card className="p-4 text-center border-green-200 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/20 dark:border-green-800">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  🎯
                </div>
                <p className="mt-1 text-sm font-medium text-green-700 dark:text-green-300">
                  Enfoque
                </p>
              </Card>
              <Card className="p-4 text-center border-orange-200 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/20 dark:to-orange-900/20 dark:border-orange-800">
                <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                  🔥
                </div>
                <p className="mt-1 text-sm font-medium text-orange-700 dark:text-orange-300">
                  Energía
                </p>
              </Card>
            </div>
          </div>

          <div className="relative order-1 lg:order-2">
            <div className="relative max-w-lg mx-auto aspect-square lg:max-w-none">
              <div className="absolute inset-0 bg-gradient-to-br via-transparent rounded-3xl blur-3xl from-primary/20 to-primary/10" />
              <div className="relative p-8 border shadow-2xl bg-gradient-to-br rounded-3xl backdrop-blur-sm from-background to-muted/50">
                <div className="relative aspect-square">
                  <Image
                    src="/gm_logo.svg"
                    alt="Gym Master Logo"
                    fill
                    className="object-contain transition-transform duration-700 drop-shadow-2xl dark:invert hover:scale-105"
                    priority
                  />
                </div>
              </div>
            </div>

            <div className="absolute w-24 h-24 rounded-full -top-4 -right-4 bg-gradient-to-br blur-xl animate-pulse from-primary/20 to-primary/40" />
            <div className="absolute w-32 h-32 delay-1000 rounded-full -bottom-8 -left-8 bg-gradient-to-br blur-xl animate-pulse from-secondary/20 to-secondary/40" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardInitialContent;
