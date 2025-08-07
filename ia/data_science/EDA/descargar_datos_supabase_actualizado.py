
from supabase import create_client, Client
import pandas as pd

# 🔐 Conexión a Supabase
SUPABASE_URL = "https://brrxvwgjkuofcgdnmnfb.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJycnh2d2dqa3VvZmNnZG5tbmZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkxNzQxNjIsImV4cCI6MjA2NDc1MDE2Mn0.pJDbApLOkF0LGAAV-d4AJ-HUoQ-13FtLIVMJXwlqT5s"
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# ⚙️ Función para obtener datos
def get_table_data(table_name):
    response = supabase.table(table_name).select("*").execute()
    data = response.data
    return pd.DataFrame(data)

# 📥 Descargar comida_base
df_dietas = get_table_data("dieta")
df_dietas.to_csv("datasets/dieta_socio.csv", index=False)
print(f"✅ dieta_socio.csv guardado con {len(df_dietas)} registros")

# 📥 Descargar asistencia
df_asistencia = get_table_data("asistencia")
df_asistencia.to_csv("datasets/asistencia.csv", index=False)
print(f"✅ asistencia.csv guardado con {len(df_asistencia)} registros")

# 🧾 Generar evolucion_socio.csv vacío (si no hay datos)
df_evolucion = get_table_data("evolucion_socio")
if df_evolucion.empty:
    df_evolucion = pd.DataFrame(columns=["socio_id", "fecha", "peso", "altura_cm"])
df_evolucion.to_csv("datasets/evolucion_socio.csv", index=False)
print(f"✅ evolucion_socio.csv guardado con {len(df_evolucion)} registros")
