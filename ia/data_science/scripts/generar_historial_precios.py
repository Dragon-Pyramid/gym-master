from supabase import create_client, Client
from datetime import date, timedelta
import random

# 🔐 Configuración Supabase
SUPABASE_URL = "https://brrxvwgjkuofcgdnmnfb.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJycnh2d2dqa3VvZmNnZG5tbmZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkxNzQxNjIsImV4cCI6MjA2NDc1MDE2Mn0.pJDbApLOkF0LGAAV-d4AJ-HUoQ-13FtLIVMJXwlqT5s"
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# 🧾 Obtener 5 socios aleatorios
socios_response = supabase.table('socio').select('id_socio').limit(5).execute()
socios = [s['id_socio'] for s in socios_response.data]

# 📈 Generar precios simulados
data_insert = []
for id_socio in socios:
    precio_inicial = random.randint(4500, 5500)
    fecha_inicio = date(2024, 1, 1)
    incremento = random.randint(200, 500)
    fecha_cambio = fecha_inicio + timedelta(days=180)  # medio año después

    # Registro 1: precio inicial
    data_insert.append({
        "id_socio": id_socio,
        "precio": float(precio_inicial),
        "fecha_inicio": str(fecha_inicio),
        "fecha_fin": str(fecha_cambio - timedelta(days=1))
    })

    # Registro 2: precio actualizado
    data_insert.append({
        "id_socio": id_socio,
        "precio": float(precio_inicial + incremento),
        "fecha_inicio": str(fecha_cambio),
        "fecha_fin": None
    })

# 📤 Insertar en Supabase
for registro in data_insert:
    supabase.table("historial_precios_cuota").insert(registro).execute()

print("✅ Datos simulados insertados correctamente.")
