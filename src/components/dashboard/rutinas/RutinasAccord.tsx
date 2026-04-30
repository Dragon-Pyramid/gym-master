"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const days = [
  {
    day: "Monday",
    muscle: "Chest",
    exercises: [
      { name: "Bench Press", sets: 4, reps: 10 },
      { name: "Incline Dumbbell Press", sets: 3, reps: 12 },
    ],
  },
  {
    day: "Tuesday",
    muscle: "Back",
    exercises: [
      { name: "Deadlift", sets: 4, reps: 8 },
      { name: "Lat Pulldown", sets: 3, reps: 10 },
    ],
  },
  {
    day: "Wednesday",
    muscle: "Legs",
    exercises: [
      { name: "Squats", sets: 4, reps: 10 },
      { name: "Leg Press", sets: 3, reps: 12 },
    ],
  },
  {
    day: "Thursday",
    muscle: "Shoulders",
    exercises: [
      { name: "Overhead Press", sets: 4, reps: 10 },
      { name: "Lateral Raises", sets: 3, reps: 15 },
    ],
  },
  {
    day: "Friday",
    muscle: "Arms",
    exercises: [
      { name: "Bicep Curls", sets: 3, reps: 12 },
      { name: "Tricep Extensions", sets: 3, reps: 12 },
    ],
  },
  {
    day: "Saturday",
    muscle: "Core",
    exercises: [
      { name: "Plank", sets: 3, reps: "60s" },
      { name: "Russian Twists", sets: 3, reps: 20 },
    ],
  },
  { day: "Sunday", muscle: "Rest", exercises: [] },
];

export default function RutinasAccord() {
  return (
    <Accordion type="single" collapsible className="w-full">
      {days.map((d) => (
        <AccordionItem key={d.day} value={d.day}>
          <AccordionTrigger className="text-foreground">
            {d.day} - {d.muscle}
          </AccordionTrigger>
          <AccordionContent className="bg-background text-foreground">
            {d.exercises.length === 0 ? (
              <div className="text-muted-foreground">Descanso</div>
            ) : (
              <ul className="space-y-2">
                {d.exercises.map((ex, i) => (
                  <li key={i} className="flex items-center gap-4">
                    <span className="font-medium text-foreground">
                      {ex.name}
                    </span>
                    <span className="text-foreground">Series: {ex.sets}</span>
                    <span className="text-foreground">Reps: {ex.reps}</span>
                  </li>
                ))}
              </ul>
            )}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
