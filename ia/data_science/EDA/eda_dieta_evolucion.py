
# 🥗 EDA - Dieta y Evolución Física (GYM MASTER)

import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns

# Configuraciones generales
sns.set(style="whitegrid")
plt.rcParams["figure.figsize"] = (10, 6)

# ⚙️ Carga de datasets
df_dietas = pd.read_csv("datasets/dieta_socio.csv")
df_evolucion = pd.read_csv("datasets/evolucion_socio.csv")
df_asistencia = pd.read_csv("datasets/asistencia.csv")

# 📅 Formatear fechas
df_dietas["fecha_inicio"] = pd.to_datetime(df_dietas["creado_en"])
df_dietas["fecha_fin"] = df_dietas["fecha_inicio"] + pd.Timedelta(days=28)
df_asistencia["fecha"] = pd.to_datetime(df_asistencia["fecha"])
df_evolucion["fecha"] = pd.to_datetime(df_evolucion["fecha"])

# 🧮 Cálculo de IMC
if not df_evolucion.empty:
    df_evolucion["altura_m"] = df_evolucion["altura_cm"] / 100
    df_evolucion["imc"] = df_evolucion["peso"] / (df_evolucion["altura_m"] ** 2)

# 📈 Evolución de peso e IMC (solo si hay datos)
if not df_evolucion.empty:
    socio_ejemplo = df_evolucion["socio_id"].iloc[0]
    df_socio = df_evolucion[df_evolucion["socio_id"] == socio_ejemplo]

    plt.plot(df_socio["fecha"], df_socio["peso"], marker='o', label="Peso (kg)")
    plt.plot(df_socio["fecha"], df_socio["imc"], marker='s', label="IMC")
    plt.title(f"Evolución física del socio {socio_ejemplo}")
    plt.xlabel("Fecha")
    plt.ylabel("Valor")
    plt.legend()
    plt.xticks(rotation=45)
    plt.grid()
    plt.show()
else:
    print("⚠️ No hay datos en evolucion_socio para graficar evolución física.")

# 📆 Cálculo de adherencia
df_asistencia["semana"] = df_asistencia["fecha"].dt.to_period("W").apply(lambda r: r.start_time)

adherencia = df_asistencia.groupby(["socio_id", "semana"]).size().reset_index(name="asistencias")
adherencia = adherencia.merge(df_dietas[["socio_id", "fecha_inicio", "fecha_fin"]], on="socio_id")
adherencia = adherencia[(adherencia["semana"] >= adherencia["fecha_inicio"]) & (adherencia["semana"] <= adherencia["fecha_fin"])]
adherencia["cumple"] = adherencia["asistencias"] >= 2

cumplimiento = adherencia.groupby("socio_id")["cumple"].mean().reset_index(name="porcentaje_cumplimiento")

sns.histplot(cumplimiento["porcentaje_cumplimiento"], bins=10, kde=True)
plt.title("Distribución de adherencia a la dieta")
plt.xlabel("% de semanas cumplidas")
plt.ylabel("Cantidad de socios")
plt.show()

# 📊 Comparación entre tipos de dieta (mock)
if "descripcion_json" in df_dietas.columns:
    df_dietas["tipo_dieta"] = df_dietas["descripcion_json"].apply(lambda x: "Volumen" if "avena" in str(x).lower() else "Otro")
else:
    df_dietas["tipo_dieta"] = "Desconocido"

if not df_evolucion.empty:
    df_imc = df_evolucion.groupby("socio_id").agg(imc_inicio=("imc", "first"), imc_fin=("imc", "last"))
    df_imc["delta_imc"] = df_imc["imc_fin"] - df_imc["imc_inicio"]
    df_final = df_imc.merge(df_dietas[["socio_id", "tipo_dieta"]], on="socio_id")

    sns.boxplot(x="tipo_dieta", y="delta_imc", data=df_final)
    plt.title("Cambio de IMC según tipo de dieta")
    plt.ylabel("Variación de IMC")
    plt.show()
else:
    print("ℹ️ No se puede calcular variación de IMC: no hay datos de evolución.")
