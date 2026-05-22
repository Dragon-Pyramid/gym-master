"use client";

import { Suspense, useMemo, useRef } from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import {
  Activity,
  Cuboid,
  Dumbbell,
  RotateCw,
  Ruler,
  Scale,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { EvolucionSocio } from "@/interfaces/evolucionSocio.interface";

interface EvolucionFisicaBody3DPrototypeProps {
  initial: EvolucionSocio | null;
  current: EvolucionSocio | null;
}

interface BodyMetrics {
  peso: number | null;
  cintura: number | null;
  pecho: number | null;
  cadera: number | null;
  grasa: number | null;
  masaMuscular: number | null;
  brazoPromedio: number | null;
  musloPromedio: number | null;
  pantorrillaPromedio: number | null;
  abdomen: number | null;
  cuello: number | null;
  hombros: number | null;
}

interface Body3DShape {
  heightScale: number;
  shoulder: number;
  chest: number;
  waist: number;
  abdomen: number;
  hip: number;
  neck: number;
  arm: number;
  forearm: number;
  thigh: number;
  calf: number;
  muscle: number;
  heat: number;
}

const toNumber = (value?: number | null) => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return null;
  }

  return Number(value);
};

const average = (left?: number | null, right?: number | null) => {
  const values = [toNumber(left), toNumber(right)].filter(
    (value): value is number => value !== null
  );

  if (!values.length) return null;

  return Number(
    (values.reduce((acc, value) => acc + value, 0) / values.length).toFixed(2)
  );
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const formatNumber = (value?: number | null, suffix = "") => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return "-";
  }

  return `${Number(value).toLocaleString("es-AR", {
    maximumFractionDigits: 2,
  })}${suffix}`;
};

const delta = (current?: number | null, initial?: number | null) => {
  if (
    current === null ||
    current === undefined ||
    initial === null ||
    initial === undefined ||
    Number.isNaN(Number(current)) ||
    Number.isNaN(Number(initial))
  ) {
    return null;
  }

  return Number((Number(current) - Number(initial)).toFixed(2));
};

const signed = (value: number | null, suffix = "") => {
  if (value === null) return "-";
  return `${value > 0 ? "+" : ""}${formatNumber(value, suffix)}`;
};

const getMetrics = (row: EvolucionSocio | null): BodyMetrics => ({
  peso: toNumber(row?.peso),
  cintura: toNumber(row?.cintura),
  pecho: toNumber(row?.pecho),
  cadera: toNumber(row?.cadera),
  grasa: toNumber(row?.porcentaje_grasa),
  masaMuscular: toNumber(row?.masa_muscular),
  brazoPromedio: average(row?.biceps_izquierdo, row?.biceps_derecho),
  musloPromedio: average(row?.muslo_izquierdo, row?.muslo_derecho),
  pantorrillaPromedio: average(
    row?.pantorrilla_izquierda,
    row?.pantorrilla_derecha
  ),
  abdomen: toNumber(row?.abdomen),
  cuello: toNumber(row?.cuello),
  hombros: toNumber(row?.hombros),
});

const buildShape = (metrics: BodyMetrics): Body3DShape => {
  const peso = metrics.peso ?? 78;
  const pecho = metrics.pecho ?? 104;
  const cintura = metrics.cintura ?? 88;
  const abdomen = metrics.abdomen ?? cintura;
  const cadera = metrics.cadera ?? 98;
  const grasa = metrics.grasa ?? 24;
  const masa = metrics.masaMuscular ?? 52;
  const brazo = metrics.brazoPromedio ?? 34;
  const muslo = metrics.musloPromedio ?? 59;
  const pantorrilla = metrics.pantorrillaPromedio ?? 37;
  const cuello = metrics.cuello ?? 38;
  const hombros = metrics.hombros ?? pecho;

  return {
    heightScale: 1,
    shoulder: clamp(hombros / 118 + masa / 680, 0.86, 1.14),
    chest: clamp(pecho / 114 + masa / 820 - grasa / 1200, 0.82, 1.14),
    waist: clamp(cintura / 106 + grasa / 280 - masa / 860, 0.58, 0.98),
    abdomen: clamp(abdomen / 104 + grasa / 280 - masa / 900, 0.62, 1.02),
    hip: clamp(cadera / 108 + grasa / 560, 0.82, 1.12),
    neck: clamp(cuello / 42, 0.82, 1.08),
    arm: clamp(brazo / 36 + masa / 980, 0.72, 1.04),
    forearm: clamp(brazo / 43, 0.62, 0.86),
    thigh: clamp(muslo / 64 + masa / 980, 0.78, 1.12),
    calf: clamp(pantorrilla / 41, 0.62, 0.9),
    muscle: clamp(masa / 70, 0.58, 1.05),
    heat: clamp(grasa / 34, 0.32, 1),
  };
};

function BodyPart({
  position,
  scale,
  color = "#22d3ee",
  opacity = 0.22,
  wireOpacity = 0.92,
}: {
  position: [number, number, number];
  scale: [number, number, number];
  color?: string;
  opacity?: number;
  wireOpacity?: number;
}) {
  return (
    <group position={position} scale={scale}>
      <mesh>
        <sphereGeometry args={[1, 36, 24]} />
        <meshStandardMaterial
          color={color}
          transparent
          opacity={opacity}
          roughness={0.28}
          metalness={0.18}
        />
      </mesh>
      <mesh>
        <sphereGeometry args={[1.01, 24, 16]} />
        <meshStandardMaterial
          color="#a5f3fc"
          transparent
          opacity={wireOpacity}
          wireframe
          roughness={0.2}
          metalness={0.1}
        />
      </mesh>
    </group>
  );
}

function Limb({
  position,
  radiusTop,
  radiusBottom,
  length,
  rotationZ = 0,
  rotationX = 0,
  color = "#22d3ee",
}: {
  position: [number, number, number];
  radiusTop: number;
  radiusBottom: number;
  length: number;
  rotationZ?: number;
  rotationX?: number;
  color?: string;
}) {
  return (
    <group position={position} rotation={[rotationX, 0, rotationZ]}>
      <mesh>
        <cylinderGeometry args={[radiusTop, radiusBottom, length, 24, 8]} />
        <meshStandardMaterial
          color={color}
          transparent
          opacity={0.2}
          roughness={0.32}
          metalness={0.1}
        />
      </mesh>
      <mesh>
        <cylinderGeometry args={[radiusTop * 1.02, radiusBottom * 1.02, length, 24, 8]} />
        <meshStandardMaterial
          color="#a5f3fc"
          transparent
          opacity={0.88}
          wireframe
        />
      </mesh>
    </group>
  );
}

function HumanModel3D({
  row,
  variant,
}: {
  row: EvolucionSocio | null;
  variant: "initial" | "current";
}) {
  const root = useRef<THREE.Group>(null);
  const metrics = useMemo(() => getMetrics(row), [row]);
  const shape = useMemo(() => buildShape(metrics), [metrics]);
  const accentColor = variant === "current" ? "#22d3ee" : "#67e8f9";
  const heatColor = variant === "current" ? "#fb923c" : "#facc15";

  useFrame((state) => {
    if (!root.current) return;

    root.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.34) * 0.16;
    root.current.position.y = Math.sin(state.clock.elapsedTime * 0.72) * 0.02;
  });

  const shoulderWidth = 0.7 * shape.shoulder;
  const elbowX = 0.95 * shape.shoulder;
  const handX = 1.06 * shape.shoulder;
  const hipWidth = 0.24 * shape.hip;

  return (
    <group ref={root} scale={[0.79, 0.98, 0.79]} position={[0, -1.02, 0]}>
      <BodyPart
        position={[0, 2.6, 0]}
        scale={[0.24, 0.31, 0.22]}
        color={accentColor}
        opacity={0.2}
      />
      <Limb
        position={[0, 2.28, 0]}
        radiusTop={0.095 * shape.neck}
        radiusBottom={0.125 * shape.neck}
        length={0.26}
        color={accentColor}
      />

      <BodyPart
        position={[0, 2.02, 0]}
        scale={[0.42 * shape.shoulder, 0.18, 0.2]}
        color={accentColor}
        opacity={0.14}
        wireOpacity={0.78}
      />
      <BodyPart
        position={[0, 1.72, 0]}
        scale={[0.62 * shape.chest, 0.55, 0.34]}
        color={accentColor}
        opacity={0.18}
      />
      <BodyPart
        position={[0, 1.18, 0.02]}
        scale={[0.38 * shape.waist, 0.3, 0.27]}
        color={heatColor}
        opacity={0.16 + shape.heat * 0.14}
        wireOpacity={0.46}
      />
      <BodyPart
        position={[0, 0.66, 0]}
        scale={[0.5 * shape.hip, 0.32, 0.34]}
        color={accentColor}
        opacity={0.17}
      />

      <BodyPart
        position={[-0.49 * shape.shoulder, 1.94, 0]}
        scale={[0.15, 0.13, 0.14]}
        color={accentColor}
        opacity={0.18}
      />
      <BodyPart
        position={[0.49 * shape.shoulder, 1.94, 0]}
        scale={[0.15, 0.13, 0.14]}
        color={accentColor}
        opacity={0.18}
      />

      <Limb
        position={[-shoulderWidth, 1.48, 0]}
        radiusTop={0.105 * shape.arm}
        radiusBottom={0.09 * shape.arm}
        length={0.74}
        rotationZ={-0.34}
        color={accentColor}
      />
      <BodyPart
        position={[-elbowX, 1.06, 0]}
        scale={[0.072, 0.072, 0.072]}
        color={accentColor}
        opacity={0.18}
      />
      <Limb
        position={[-handX, 0.58, 0.01]}
        radiusTop={0.078 * shape.forearm}
        radiusBottom={0.055 * shape.forearm}
        length={0.66}
        rotationZ={-0.1}
        color={accentColor}
      />
      <BodyPart
        position={[-1.1 * shape.shoulder, 0.18, 0.04]}
        scale={[0.078, 0.05, 0.085]}
        color={accentColor}
        opacity={0.16}
      />

      <Limb
        position={[shoulderWidth, 1.48, 0]}
        radiusTop={0.105 * shape.arm}
        radiusBottom={0.09 * shape.arm}
        length={0.74}
        rotationZ={0.34}
        color={accentColor}
      />
      <BodyPart
        position={[elbowX, 1.06, 0]}
        scale={[0.072, 0.072, 0.072]}
        color={accentColor}
        opacity={0.18}
      />
      <Limb
        position={[handX, 0.58, 0.01]}
        radiusTop={0.078 * shape.forearm}
        radiusBottom={0.055 * shape.forearm}
        length={0.66}
        rotationZ={0.1}
        color={accentColor}
      />
      <BodyPart
        position={[1.1 * shape.shoulder, 0.18, 0.04]}
        scale={[0.078, 0.05, 0.085]}
        color={accentColor}
        opacity={0.16}
      />

      <Limb
        position={[-hipWidth, -0.08, 0]}
        radiusTop={0.165 * shape.thigh}
        radiusBottom={0.126 * shape.thigh}
        length={1.0}
        rotationZ={0.03}
        color={accentColor}
      />
      <BodyPart
        position={[-hipWidth, -0.66, 0]}
        scale={[0.088, 0.088, 0.088]}
        color={accentColor}
        opacity={0.18}
      />
      <Limb
        position={[-0.17 * shape.hip, -1.2, 0]}
        radiusTop={0.098 * shape.calf}
        radiusBottom={0.066 * shape.calf}
        length={0.9}
        rotationZ={-0.01}
        color={accentColor}
      />
      <BodyPart
        position={[-0.17 * shape.hip, -1.73, 0.1]}
        scale={[0.18, 0.05, 0.27]}
        color={accentColor}
        opacity={0.16}
      />

      <Limb
        position={[hipWidth, -0.08, 0]}
        radiusTop={0.165 * shape.thigh}
        radiusBottom={0.126 * shape.thigh}
        length={1.0}
        rotationZ={-0.03}
        color={accentColor}
      />
      <BodyPart
        position={[hipWidth, -0.66, 0]}
        scale={[0.088, 0.088, 0.088]}
        color={accentColor}
        opacity={0.18}
      />
      <Limb
        position={[0.17 * shape.hip, -1.2, 0]}
        radiusTop={0.098 * shape.calf}
        radiusBottom={0.066 * shape.calf}
        length={0.9}
        rotationZ={0.01}
        color={accentColor}
      />
      <BodyPart
        position={[0.17 * shape.hip, -1.73, 0.1]}
        scale={[0.18, 0.05, 0.27]}
        color={accentColor}
        opacity={0.16}
      />

      <mesh position={[0, 0.04, 0.02]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.41 * shape.waist, 0.012, 8, 80]} />
        <meshBasicMaterial
          color="#fbbf24"
          transparent
          opacity={0.34 + shape.heat * 0.18}
        />
      </mesh>

      <mesh position={[0, 1.12, 0.02]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.29 * shape.waist, 0.01, 8, 72]} />
        <meshBasicMaterial
          color="#fb923c"
          transparent
          opacity={0.28 + shape.heat * 0.18}
        />
      </mesh>
    </group>
  );
}

function ThreeScene({
  row,
  variant,
}: {
  row: EvolucionSocio | null;
  variant: "initial" | "current";
}) {
  return (
    <Canvas
      shadows={false}
      dpr={[1, 1.75]}
      camera={{ position: [0, 0.48, 9.8], fov: 35 }}
      gl={{ antialias: true, alpha: true }}
    >
      <color attach="background" args={["#08111f"]} />
      <ambientLight intensity={1.2} />
      <pointLight position={[3, 4, 3]} intensity={1.8} color="#67e8f9" />
      <pointLight position={[-3, 2, 2]} intensity={0.7} color="#38bdf8" />
      <Suspense fallback={null}>
        <HumanModel3D row={row} variant={variant} />
      </Suspense>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.62, 0]}>
        <ringGeometry args={[0.75, 1.05, 96]} />
        <meshBasicMaterial color="#22d3ee" transparent opacity={0.14} />
      </mesh>
      <OrbitControls
        enablePan={false}
        enableZoom={false}
        minPolarAngle={Math.PI / 2.55}
        maxPolarAngle={Math.PI / 1.9}
        target={[0, -0.05, 0]}
        autoRotate
        autoRotateSpeed={0.56}
      />
    </Canvas>
  );
}

function MetricBadge({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: typeof Activity;
}) {
  return (
    <div className="rounded-xl border border-cyan-400/20 bg-slate-900/80 p-3">
      <div className="flex items-center gap-2 text-[11px] uppercase tracking-wide text-cyan-200/80">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <p className="mt-1 text-sm font-bold text-white">{value}</p>
    </div>
  );
}

function ModelCard({
  row,
  title,
  subtitle,
  variant,
}: {
  row: EvolucionSocio | null;
  title: string;
  subtitle: string;
  variant: "initial" | "current";
}) {
  const metrics = getMetrics(row);

  return (
    <div className="overflow-hidden rounded-2xl border bg-slate-950 shadow-sm">
      <div className="flex items-center justify-between border-b border-cyan-400/10 p-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-cyan-300/80">{subtitle}</p>
          <h4 className="text-lg font-bold text-white">{title}</h4>
        </div>
        <div className="rounded-xl bg-cyan-400/10 p-2 text-cyan-300">
          <RotateCw className="h-5 w-5" />
        </div>
      </div>

      <div className="grid gap-4 p-4 xl:grid-cols-[minmax(280px,1fr)_0.82fr]">
        <div className="h-[700px] rounded-2xl border border-cyan-400/10 bg-gradient-to-b from-slate-900 to-slate-950 md:h-[760px]">
          <ThreeScene row={row} variant={variant} />
        </div>

        <div className="grid content-start gap-3 sm:grid-cols-2 xl:grid-cols-1">
          <MetricBadge label="Peso" value={formatNumber(metrics.peso, " kg")} icon={Scale} />
          <MetricBadge label="Cintura" value={formatNumber(metrics.cintura, " cm")} icon={Ruler} />
          <MetricBadge label="% grasa" value={formatNumber(metrics.grasa, "%")} icon={Activity} />
          <MetricBadge label="Masa muscular" value={formatNumber(metrics.masaMuscular, " kg")} icon={Dumbbell} />
          <MetricBadge label="Brazo prom." value={formatNumber(metrics.brazoPromedio, " cm")} icon={Ruler} />
          <MetricBadge label="Muslo prom." value={formatNumber(metrics.musloPromedio, " cm")} icon={Ruler} />
        </div>
      </div>
    </div>
  );
}

function DeltaRow({
  label,
  value,
  suffix,
  direction,
}: {
  label: string;
  value: number | null;
  suffix: string;
  direction: "lower" | "higher" | "neutral";
}) {
  const improved =
    value === null || value === 0
      ? false
      : direction === "lower"
      ? value < 0
      : direction === "higher"
      ? value > 0
      : false;

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl bg-slate-900/80 px-3 py-2 text-sm">
      <span className="text-cyan-100/80">{label}</span>
      <span className={`font-bold ${improved ? "text-emerald-300" : "text-white"}`}>
        {signed(value, suffix)}
      </span>
    </div>
  );
}

export default function EvolucionFisicaBody3DPrototype({
  initial,
  current,
}: EvolucionFisicaBody3DPrototypeProps) {
  if (!initial || !current) {
    return (
      <Card className="rounded-2xl border bg-white shadow-sm">
        <CardContent className="p-6 text-sm text-gray-500">
          El prototipo 3D requiere un registro inicial y una última medición.
        </CardContent>
      </Card>
    );
  }

  const initialMetrics = getMetrics(initial);
  const currentMetrics = getMetrics(current);

  const diffPeso = delta(currentMetrics.peso, initialMetrics.peso);
  const diffCintura = delta(currentMetrics.cintura, initialMetrics.cintura);
  const diffGrasa = delta(currentMetrics.grasa, initialMetrics.grasa);
  const diffMasa = delta(currentMetrics.masaMuscular, initialMetrics.masaMuscular);
  const diffBrazo = delta(currentMetrics.brazoPromedio, initialMetrics.brazoPromedio);
  const diffMuslo = delta(currentMetrics.musloPromedio, initialMetrics.musloPromedio);

  return (
    <Card className="overflow-hidden rounded-2xl border bg-white shadow-sm">
      <CardHeader className="space-y-1 border-b p-4">
        <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-[#02a8e1]">
              Prototipo experimental 3D
            </p>
            <h3 className="text-lg font-semibold text-gray-950">
              Silueta corporal 3D antes vs. ahora
            </h3>
            <p className="mt-1 max-w-4xl text-sm text-gray-500">
              Visualización experimental con Three.js / React Three Fiber. La figura usa geometrías paramétricas, wireframe y una anatomía más orgánica basada en las mediciones actuales.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full bg-cyan-50 px-3 py-1 text-xs font-medium text-cyan-700">
            <Cuboid className="h-3.5 w-3.5" />
            Research 3D
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 p-4">
        <div className="grid gap-4 2xl:grid-cols-[1fr_1fr_0.62fr]">
          <ModelCard
            row={initial}
            title="Registro inicial"
            subtitle="Antes"
            variant="initial"
          />
          <ModelCard
            row={current}
            title="Última medición"
            subtitle="Ahora"
            variant="current"
          />

          <div className="rounded-2xl border bg-slate-950 p-4 shadow-sm">
            <p className="text-xs uppercase tracking-wide text-cyan-300/80">
              Lectura automática 3D
            </p>
            <h4 className="mt-1 text-lg font-bold text-white">
              Cambios representados
            </h4>
            <p className="mt-2 text-sm text-cyan-100/70">
              El modelo ajusta tórax, cintura, cadera, hombros, brazos y piernas con una proporción más orgánica según los datos reales. Esta versión sigue siendo un prototipo técnico, no una reconstrucción anatómica final.
            </p>

            <div className="mt-4 space-y-2">
              <DeltaRow label="Peso" value={diffPeso} suffix=" kg" direction="neutral" />
              <DeltaRow label="Cintura" value={diffCintura} suffix=" cm" direction="lower" />
              <DeltaRow label="% grasa" value={diffGrasa} suffix="%" direction="lower" />
              <DeltaRow label="Masa muscular" value={diffMasa} suffix=" kg" direction="higher" />
              <DeltaRow label="Brazo promedio" value={diffBrazo} suffix=" cm" direction="higher" />
              <DeltaRow label="Muslo promedio" value={diffMuslo} suffix=" cm" direction="higher" />
            </div>

            <div className="mt-4 rounded-xl border border-cyan-400/20 bg-cyan-400/5 p-3 text-xs leading-relaxed text-cyan-100/75">
              Próxima iteración: reemplazar geometrías paramétricas por un modelo GLB humano base y mapear medidas a huesos/morph targets.
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
