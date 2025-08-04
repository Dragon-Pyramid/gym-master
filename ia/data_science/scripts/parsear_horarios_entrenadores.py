from supabase import Client, create_client
import re

# 🔐 Conexión
SUPABASE_URL = "https://brrxvwgjkuofcgdnmnfb.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJycnh2d2dqa3VvZmNnZG5tbmZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkxNzQxNjIsImV4cCI6MjA2NDc1MDE2Mn0.pJDbApLOkF0LGAAV-d4AJ-HUoQ-13FtLIVMJXwlqT5s"
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# 📥 Traer entrenadores con horarios
response = supabase.table("entrenadores").select("id, horarios_texto").execute()
entrenadores = response.data

dias_semana = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"]

def parsear_horarios(id_entrenador, texto):
    registros = []
    if not texto:
        return registros

    # Buscar todos los bloques tipo "Lunes: 08:00-10:00, 17:00-19:00"
    patron_general = r"(?P<dia>Lunes|Martes|Miércoles|Jueves|Viernes|Sábado|Domingo):\s*([0-9:\-,\s]+)"
    coincidencias = re.findall(patron_general, texto)

    for coincidencia in coincidencias:
        dia = coincidencia[0]
        tramos = coincidencia[1].split(",")
        for tramo in tramos:
            horas = tramo.strip().split("-")
            if len(horas) == 2:
                registros.append({
                    "id_entrenador": id_entrenador,
                    "dia_semana": dia,
                    "hora_inicio": horas[0].strip(),
                    "hora_fin": horas[1].strip()
                })
    return registros

# 🔁 Procesar e insertar
inserts = []
for e in entrenadores:
    id_entrenador = e["id"]
    texto = e["horarios_texto"]
    registros = parsear_horarios(id_entrenador, texto)
    inserts.extend(registros)

for r in inserts:
    supabase.table("horario_entrenador").insert(r).execute()

print(f"✅ Insertados {len(inserts)} registros en 'horario_entrenador'")

# Ver los datos antes de insertar
for r in inserts:
    print(r)
