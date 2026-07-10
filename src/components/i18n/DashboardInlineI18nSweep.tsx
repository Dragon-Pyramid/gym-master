'use client';

import { useEffect, useRef } from 'react';
import { useI18n } from '@/i18n/I18nProvider';

const TRANSLATIONS: Record<string, string> = {
  'El Coach IA orienta y ayuda a organizar información del gimnasio. No reemplaza evaluación médica, nutricional ni profesional cuando hay lesiones, síntomas o condiciones clínicas.': 'The AI Coach guides and helps organize gym information. It does not replace medical, nutritional or professional evaluation when there are injuries, symptoms or clinical conditions.',
  'La ficha médica es una herramienta administrativa y preventiva. No reemplaza diagnóstico ni indicación profesional. Ante alertas clínicas, derivar a un profesional de salud.': 'The medical record is an administrative and preventive tool. It does not replace diagnosis or professional indication. For clinical alerts, refer to a health professional.',
  'Soy tu Coach IA de Gym Master. Puedo ayudarte con rutinas, dietas y evolución física usando tu contexto del gimnasio cuando esté disponible.': 'I am your Gym Master AI Coach. I can help you with routines, diets and physical evolution using your gym context when available.',
  'Listado operativo con acceso rápido al perfil 360° del socio: cuota, ficha médica, rutinas, dietas, evolución, mensajes y actividades.': 'Operational list with quick access to the member 360° profile: fee, medical record, routines, diets, evolution, messages and activities.',
  'Consultá rutinas, dietas y evolución física con continuidad conversacional, contexto operativo y recomendaciones más personalizadas.': 'Consult routines, diets and physical evolution with conversational continuity, operational context and more personalized recommendations.',
  'Centralizá datos clínicos básicos, apto médico, adjuntos e historial para una revisión rápida antes de entrenamientos o actividades.': 'Centralize basic clinical data, medical clearance, attachments and history for a quick review before workouts or activities.',
  'Esta pantalla está optimizada para la vista del socio. Para gestionar dietas por socio, usá el Gestor de Dietas.': 'This screen is optimized for the member view. To manage diets by member, use the Diet Manager.',
  'Buscá por nombre, DNI, email o teléfono y abrí la ficha actual, historial o nueva carga del socio seleccionado.': 'Search by name, ID, email or phone and open the selected member current record, history or new entry.',
  'Todavía no hay memoria contextual calculada. Enviá una consulta para que el Coach lea el contexto del socio.': 'There is no contextual memory calculated yet. Send a query so the Coach can read the member context.',
  'Usá el botón 360 para revisar el estado completo antes de contactar o gestionar al socio.': 'Use the 360 button to review the full status before contacting or managing the member.',
  'La foto ayuda a validar identidad en recepción, asistencia y atención administrativa.': 'The photo helps validate identity at reception, attendance and administrative care.',
  'Socios que solicitaron inscripción desde mobile y esperan aprobación administrativa.': 'Members who requested enrollment from mobile and are waiting for administrative approval.',
  'Consultá las dietas asignadas y generá nuevos planes alimentarios para los socios.': 'Review assigned diets and create new meal plans for members.',
  'Solicitar o revisar ficha médica antes de sostener actividades de mayor exigencia.': 'Request or review the medical record before supporting more demanding activities.',
  'Resumen transversal para evitar saltar entre pantallas durante soporte o atención': 'Cross-module summary to avoid jumping between screens during support or care',
  'Las ubicaciones se administran desde Parametrización → Ubicaciones del gimnasio.': 'Locations are managed from Parameterization → Gym locations.',
  'Control de clases por día, cupos disponibles, ocupación y lista de espera.': 'Control classes by day, available slots, occupancy and waitlist.',
  'Si el cupo está completo, el socio pasa automáticamente a lista de espera.': 'If capacity is full, the member is automatically moved to the waitlist.',
  'Ocupación por actividad, distribución semanal y estado de inscripciones.': 'Occupancy by activity, weekly distribution and enrollment status.',
  'Contame tu objetivo, disponibilidad semanal, nivel y restricciones.': 'Tell me your goal, weekly availability, level and restrictions.',
  'Filtrá, exportá y abrí el perfil 360° desde la acción de cada fila.': 'Filter, export and open the 360° profile from each row action.',
  'Definí horario, cupo, instructor, ubicación y estado operativo.': 'Define schedule, capacity, instructor, location and operational status.',
  'Escribí tu consulta: quiero rutina, dieta, revisar progreso...': 'Write your query: I want a routine, diet, review progress...',
  'Quiero una rutina para ganar masa muscular 3 días por semana': 'I want a routine to gain muscle mass 3 days per week',
  'Genera planes usando objetivo, nivel, días y restricciones.': 'Generates plans using goal, level, days and restrictions.',
  'Crea orientación nutricional con disclaimers de seguridad.': 'Creates nutritional guidance with safety disclaimers.',
  'No hay socios en lista de espera pendientes de aprobación.': 'There are no waitlisted members pending approval.',
  'Marcá asistencia, ausencia, cancelación o lista de espera.': 'Mark attendance, absence, cancellation or waitlist.',
  'Quiero una dieta para bajar grasa sin perder músculo': 'I want a diet to lose fat without losing muscle',
  'Base de actividades usada para crear turnos y cupos.': 'Activity base used to create shifts and slots.',
  'Acciones claras para ver rutina, dieta o evolución.': 'Clear actions to view routine, diet or evolution.',
  'Analiza progreso físico y sugiere próximos ajustes.': 'Analyzes physical progress and suggests next adjustments.',
  'Socios inactivos o con señales operativas críticas.': 'Inactive members or with critical operational signals.',
  'Requieren contacto o normalización administrativa.': 'Require contact or administrative normalization.',
  'No sé por dónde empezar, quiero mejorar mi físico': 'I do not know where to start, I want to improve my fitness',
  'Socios con alguna señal de seguimiento detectada.': 'Members with a detected follow-up signal.',
  'señal(es) para priorizar atención administrativa.': 'signal(s) to prioritize administrative attention.',
  'Chat unificado · Rutinas · Dietas · Evolución': 'Unified chat · Routines · Diets · Evolution',
  'Estoy estancado, analizá mi evolución física': 'I am stuck, analyze my physical evolution',
  'Buscá y revisá planes alimentarios cargados.': 'Search and review loaded meal plans.',
  'Coach IA con memoria contextual del socio': 'AI Coach with member contextual memory',
  'Alta de socios desde Usuarios → rol Socio': 'Create members from Users → member role',
  'Diseño responsive sin scroll horizontal.': 'Responsive design without horizontal scroll.',
  'Fallback seguro para señales sensibles.': 'Safe fallback for sensitive signals.',
  'Contexto operativo del socio resumido.': 'Summarized operational member context.',
  'Listado de actividades registradas.': 'Registered activities list.',
  'Ficha médica pendiente de revisión': 'Medical record pending review',
  'Requieren revisión administrativa': 'Require administrative review',
  'Perfiles con contacto de respaldo': 'Profiles with backup contact',
  'Buscar turno, actividad, zona...': 'Search shift, activity, area...',
  'Memoria conversacional visible.': 'Visible conversational memory.',
  'Consolidado operativo del socio': 'Operational member summary',
  'Seleccionar socio para revisar': 'Select member to review',
  'Turnos, cupos e inscripciones': 'Shifts, slots and enrollments',
  'Buscar dieta u objetivo...': 'Search diet or goal...',
  'REVISIÓN MÉDICA OPERATIVA': 'OPERATIONAL MEDICAL REVIEW',
  'Pueden operar normalmente': 'Can operate normally',
  'Buscar por nombre, DNI...': 'Search by name, ID...',
  'VISTA 360 ADMINISTRATIVA': 'ADMINISTRATIVE 360 VIEW',
  'Foto de perfil pendiente': 'Profile photo pending',
  'PANEL DE REVISIÓN ADMIN': 'ADMIN REVIEW PANEL',
  'VISTA DE REVISIÓN ADMIN': 'ADMIN REVIEW VIEW',
  'Problemas respiratorios': 'Respiratory problems',
  'VISTA 360 ADMINISTRADOR': 'ADMINISTRATOR 360 VIEW',
  'Estado de inscripciones': 'Enrollment status',
  'Sin instructor asignado': 'No instructor assigned',
  'Inscripciones recientes': 'Recent enrollments',
  'Catálogo de actividades': 'Activity catalog',
  'Ficha médica del socio': 'Member medical record',
  'controles de evolución': 'evolution checks',
  'Contacto de emergencia': 'Emergency contact',
  'Teléfono de emergencia': 'Emergency phone',
  'Solicitudes pendientes': 'Pending requests',
  'Enfermedades crónicas': 'Chronic diseases',
  'ALERTAS DE RIESGO 360': '360 RISK ALERTS',
  'Seleccionar actividad': 'Select activity',
  'Seleccionar ubicación': 'Select location',
  'Confianza: Pendiente': 'Confidence: Pending',
  'Checklist de calidad': 'Quality checklist',
  'Base total de socios': 'Total member base',
  'Contacto y ubicación': 'Contact and location',
  'BI de turnos y cupos': 'Shifts and slots BI',
  'Crear / editar turno': 'Create / edit shift',
  'Total de actividades': 'Total activities',
  'Historial de Dietas': 'Diet history',
  'Descargar ficha PDF': 'Download medical PDF',
  'Frecuencia cardíaca': 'Heart rate',
  'Problemas cardíacos': 'Heart problems',
  'Fecha de nacimiento': 'Birth date',
  'Nombre del contacto': 'Contact name',
  'Buscar actividad...': 'Search activity...',
  'Memoria contextual': 'Contextual memory',
  'Socio seleccionado': 'Selected member',
  'Lectura rápida 360': 'Quick 360 reading',
  'GESTIÓN DE DIETAS': 'DIET MANAGEMENT',
  'Registrar control': 'Register check',
  'Controles previos': 'Previous checks',
  'Atención integral': 'Comprehensive care',
  'Listado de socios': 'Member list',
  'Módulos del socio': 'Member modules',
  'Todos los estados': 'All statuses',
  'Actividad / turno': 'Activity / shift',
  'Dietas de socios': 'Member diets',
  'PRÓXIMA REVISIÓN': 'NEXT REVIEW',
  'Historial médico': 'Medical history',
  'Cirugías previas': 'Previous surgeries',
  'Próxima revisión': 'Next review',
  'Seguimiento leve': 'Light follow-up',
  'Actividad física': 'Physical activity',
  'Datos personales': 'Personal data',
  'Actualizar Socio': 'Update Member',
  'Nombre del turno': 'Shift name',
  'Añadir Actividad': 'Add Activity',
  'Nombre Actividad': 'Activity Name',
  'Qué puede hacer': 'What it can do',
  'Nota importante': 'Important note',
  'Buscar socio...': 'Search member...',
  'Grupo sanguíneo': 'Blood type',
  'ESTADO DE CUOTA': 'FEE STATUS',
  'Nombre completo': 'Full name',
  'Inscribir socio': 'Enroll member',
  'Lista de espera': 'Waitlist',
  'Datos vigentes': 'Current data',
  'Último control': 'Last check',
  'CON EMERGENCIA': 'WITH EMERGENCY',
  'Foto pendiente': 'Photo pending',
  'Turnos por día': 'Shifts by day',
  'Vigencia desde': 'Valid from',
  'Vigencia hasta': 'Valid until',
  'Todos los días': 'All days',
  'Actualizado En': 'Updated On',
  'Próximo paso:': 'Next step:',
  'Observaciones': 'Notes',
  'Descargar PDF': 'Download PDF',
  'Fecha de alta': 'Registration date',
  'Cupos totales': 'Total slots',
  'Día y horario': 'Day and time',
  'Ficha actual': 'Current record',
  'Sin adjuntos': 'No attachments',
  'RIESGO MEDIO': 'MEDIUM RISK',
  'Socio activo': 'Active member',
  'Riesgo medio': 'Medium risk',
  'Ficha médica': 'Medical record',
  'Editar Socio': 'Edit Member',
  'Lista espera': 'Waitlist',
  'Nueva Dieta': 'New Diet',
  'REGISTRADOS': 'REGISTERED',
  'RIESGO ALTO': 'HIGH RISK',
  'CON ALERTAS': 'WITH ALERTS',
  'Actividades': 'Activities',
  'Cupo máximo': 'Maximum capacity',
  'Cupo mínimo': 'Minimum capacity',
  'Crear turno': 'Create shift',
  'Disponibles': 'Available',
  'respuestas': 'responses',
  'Presentado': 'Submitted',
  'DOCUMENTOS': 'DOCUMENTS',
  'Medicación': 'Medication',
  'Socios 360': 'Members 360',
  'Fecha Alta': 'Created date',
  'Desactivar': 'Deactivate',
  'Instructor': 'Instructor',
  'Actualizar': 'Refresh',
  'pendientes': 'pending',
  'Reiniciar': 'Restart',
  'Evolución': 'Evolution',
  'Historial': 'History',
  'INACTIVOS': 'INACTIVE',
  'Ver ficha': 'View record',
  'Dirección': 'Address',
  'Provincia': 'Province',
  'Masculino': 'Male',
  'Inscritos': 'Enrolled',
  'Ocupación': 'Occupancy',
  'Actividad': 'Activity',
  'Ubicación': 'Location',
  'Inscripto': 'Enrolled',
  'Cancelado': 'Cancelled',
  'Creado En': 'Created On',
  'Miércoles': 'Wednesday',
  'acciones': 'actions',
  'Imprimir': 'Print',
  'Exportar': 'Export',
  'Revisión': 'Review',
  'Contacto': 'Contact',
  'Alergias': 'Allergies',
  'Lesiones': 'Injuries',
  'Teléfono': 'Phone',
  'Acciones': 'Actions',
  'Mensajes': 'Messages',
  'Femenino': 'Female',
  'Eliminar': 'Delete',
  'fuentes': 'sources',
  'Rutinas': 'Routines',
  'Activos': 'Active',
  'Presión': 'Blood pressure',
  'ACTIVOS': 'ACTIVE',
  'rutinas': 'routines',
  'Asistió': 'Attended',
  'Ausente': 'Absent',
  'Viernes': 'Friday',
  'Domingo': 'Sunday',
  'Enviar': 'Send',
  'Dietas': 'Diets',
  'Socios': 'Members',
  'Estado': 'Status',
  'Activo': 'Active',
  'Actual': 'Current',
  'Altura': 'Height',
  'Nombre': 'Name',
  'Riesgo': 'Risk',
  'Cuotas': 'Fees',
  'Al día': 'Up to date',
  'Medias': 'Medium',
  'Ciudad': 'City',
  'Turnos': 'Shifts',
  'Inicio': 'Start',
  'Espera': 'Wait',
  'activo': 'active',
  'Editar': 'Edit',
  'Martes': 'Tuesday',
  'Jueves': 'Thursday',
  'Sábado': 'Saturday',
  'Lista': 'Ready',
  'Nueva': 'New',
  'Todos': 'All',
  'Altas': 'High',
  'Leves': 'Low',
  'Cupos': 'Slots',
  'Turno': 'Shift',
  'Socio': 'Member',
  'Fecha': 'Date',
  'Lunes': 'Monday',
  'Hola': 'Hello',
  'Modo': 'Mode',
  'Peso': 'Weight',
  'Sexo': 'Sex',
  'País': 'Country',
  'DNI': 'ID',
  'Día': 'Day',
  'Ver': 'View',
  'Con emergencia': 'WITH EMERGENCY',
  'Riesgo alto': 'HIGH RISK',
  'Con alertas': 'WITH ALERTS',
  'actividades': 'activities',
  'No se encontraron socios para esa búsqueda.': 'No members were found for that search.',
  'Sin DNI cargado': 'No ID loaded',
  'Selector rápido': 'Quick selector',
  'Seleccionar socio': 'Select member',
  'Aclaración opcional': 'Optional note',
  'Inscribiendo...': 'Enrolling...',
  'Routine assistant': 'Routine assistant',
  'Asistente de Rutinas': 'Routine assistant',
  'Asistente inteligente': 'Smart assistant',
  'Contale qué rutina necesitás': 'Tell it what routine you need',
  'Escribí o dictá tu pedido con tus palabras. El asistente va a interpretar tu objetivo, días disponibles, nivel, prioridades y restricciones antes de generar la rutina.': 'Write or dictate your request in your own words. The assistant will interpret your goal, available days, level, priorities and restrictions before generating the routine.',
  'Ejemplo': 'Example',
  'Ayuda': 'Help',
  'Cómo pedir tu rutina': 'How to ask for your routine',
  'Podés escribir como hablás. No hace falta usar palabras técnicas.': 'You can write the way you speak. There is no need to use technical words.',
  'Qué conviene contar': 'What is useful to mention',
  'Qué querés lograr: ganar masa muscular, bajar de peso, definir, fuerza o resistencia.': 'What you want to achieve: gain muscle mass, lose weight, define, strength or endurance.',
  'Cuántos días podés entrenar por semana.': 'How many days per week you can train.',
  'Tu nivel aproximado: principiante, intermedio o avanzado.': 'Your approximate level: beginner, intermediate or advanced.',
  'Si querés priorizar algún grupo muscular.': 'If you want to prioritize any muscle group.',
  'Si tenés lesiones, molestias o algo que el asistente deba cuidar.': 'If you have injuries, discomfort or anything the assistant should take care of.',
  'Objetivos posibles': 'Possible goals',
  'Podés pedir volumen, definición, bajar de peso, fuerza, resistencia o volver a entrenar de a poco.': 'You can ask for bulking, definition, weight loss, strength, endurance or returning to training gradually.',
  'Frecuencia muscular': 'Muscle frequency',
  'Si entrenás pocos días, normalmente se reparte el cuerpo completo o torso/pierna. Si entrenás 5 o 6 días, se puede tocar cada grupo muscular una o dos veces por semana según tu objetivo y recuperación.': 'If you train only a few days, the routine is usually full body or upper/lower. If you train 5 or 6 days, each muscle group can be worked one or two times per week depending on your goal and recovery.',
  'Quiero bajar de peso. Puedo entrenar 4 días por semana y soy principiante.': 'I want to lose weight. I can train 4 days per week and I am a beginner.',
  'Quiero una rutina de fuerza de 5 días. Soy avanzado, pero tengo molestias lumbares.': 'I want a 5-day strength routine. I am advanced, but I have lower back discomfort.',
  'Hace tiempo que no entreno y quiero volver de a poco. Puedo ir 3 veces por semana.': 'I have not trained in a while and I want to come back gradually. I can go 3 times per week.',
  'Tu pedido': 'Your request',
  'Estás ingresando como admin. Esta experiencia está orientada al socio logueado.': 'You are entering as admin. This experience is aimed at the logged-in member.',
  'Escribí o dictá tu pedido': 'Write or dictate your request',
  'Dictar texto con el micrófono': 'Dictate text with the microphone',
  'Dictado no disponible en este navegador': 'Dictation is not available in this browser',
  'Detener dictado': 'Stop dictation',
  'Dictar con voz': 'Voice dictation',
  'Voz no disponible': 'Voice unavailable',
  'Ejemplo: quiero ganar masa muscular, entrenar 6 días, priorizar espalda y hombros. Soy intermedio y tengo lumbalgia.': 'Example: I want to gain muscle mass, train 6 days, prioritize back and shoulders. I am intermediate and I have lower back pain.',
  'Dictado continuo activo. Podés pausar al hablar; detenelo cuando termines.': 'Continuous dictation is active. You can pause while speaking; stop it when you finish.',
  'Incluí objetivo y días para que el asistente pueda interpretar mejor tu rutina.': 'Include your goal and days so the assistant can better interpret your routine.',
  'Escuchando:': 'Listening:',
  'Algo que el asistente deba cuidar': 'Anything the assistant should take care of',
  'Ejemplo: lumbalgia, dolor de rodilla, evitar impacto, prefiero máquinas.': 'Example: lower back pain, knee pain, avoid impact, I prefer machines.',
  'Idioma': 'Language',
  'Español': 'Spanish',
  'Disponible para socio': 'Available for member',
  'Confirmar y generar rutina': 'Confirm and generate routine',
  'Revisar pedido': 'Review request',
  'Ver mis rutinas': 'View my routines',
  'Resumen interpretado': 'Interpreted summary',
  'Objetivo': 'Goal',
  'Nivel': 'Level',
  'Frecuencia': 'Frequency',
  'Prioridades': 'Priorities',
  'Cuidado detectado': 'Detected care',
  'Revisá estos datos. Si están bien, confirmá para generar la rutina.': 'Review this data. If it is correct, confirm to generate the routine.',
  'Rutina generada': 'Routine generated',
  'Conocimiento RAG aplicado': 'Applied RAG knowledge',
  'Se recuperaron': 'Recovered',
  'referencias de ejercicios reales para orientar la rutina.': 'real exercise references to guide the routine.',
  'Advertencias técnicas': 'Technical warnings',
  'Ir al menú Rutinas': 'Go to Routines menu',
  'por defecto': 'by default',
  'días por semana': 'days per week',
  'Loading...': 'Loading...',
  'Cargando...': 'Loading...',
  'No members were found for that search.': 'No members were found for that search.',
  'Registrados': 'Registered',
  'Vista 360 administrador': 'Administrator 360 view',
  'care administrativa.': 'administrative care.',
  'Sin novedades': 'No updates',
  'Última actualización:': 'Last update:',
  'Abrir módulo': 'Open module',
  'Evolution física': 'Physical evolution',
  'Seguimiento corporal': 'Body tracking',
  'Sin inscripciones activas': 'No active enrollments',
  'inscriptas': 'enrolled',
  'Señales útiles para atención, retención y seguimiento administrativo.': 'Useful signals for care, retention and administrative follow-up.',
  'Seguimiento saludable': 'Healthy follow-up',
  'Conviene solicitar o revisar ficha médica vigente.': 'It is advisable to request or review a current medical record.',
  'Edad': 'Age',
  'Alertas de riesgo 360': '360 risk alerts',
  'Sin estado': 'No status',
  'Sin datos': 'No data',
  'Última revisión:': 'Last review:',
  '0 pending · 0 inscriptas': '0 pending · 0 enrolled',
  'Member list registrados con lectura rápida de riesgo.': 'Member list registered with quick risk reading.',
  'Última revisión': 'Last review',
  'física': 'physical',
  'Status de cuota': 'Fee status',
  'STATUS DE CUOTA': 'FEE STATUS',
  'Status general': 'Overall status',
  'Risk administrativo': 'Administrative risk',
  'Puede operar normalmente como socio active.': 'The member can operate normally as an active member.',
  'Light follow-up: revisar las alertas 360 antes de cerrar la atención.': 'Light follow-up: review the 360 alerts before closing the case.',
  'Date alta': 'Registration date',
  'Contact emergencia': 'Emergency contact',
  'Phone emergencia': 'Emergency phone',
  'Descuento active': 'Active discount',
  'status de cuota': 'fee status',
  'status general': 'overall status',
  'risk administrativo': 'administrative risk',
  'contact emergencia': 'emergency contact',
  'phone emergencia': 'emergency phone',
  'descuento active': 'active discount',
  'Confianza:': 'Confidence:',
  'Confianza': 'Confidence',
  'Pendiente': 'Pending',
  '“Quiero ganar masa muscular, entrenar 6 días, priorizar espalda y hombros. Soy intermedio y tengo lumbalgia.”': '“I want to gain muscle mass, train 6 days, prioritize back and shoulders. I am intermediate and I have lower back pain.”',
  '"Quiero ganar masa muscular, entrenar 6 días, priorizar espalda y hombros. Soy intermedio y tengo lumbalgia."': '"I want to gain muscle mass, train 6 days, prioritize back and shoulders. I am intermediate and I have lower back pain."',
  'Quiero ganar masa muscular, entrenar 6 días, priorizar espalda y hombros. Soy intermedio y tengo lumbalgia.': 'I want to gain muscle mass, train 6 days, prioritize back and shoulders. I am intermediate and I have lower back pain.',
  'gestión de dietas': 'diet management',
  'GESTION DE DIETAS': 'DIET MANAGEMENT',
  'Gestión de dietas': 'Diet management',
  'Goal nutricional': 'Nutritional goal',
  'Objetivo nutricional': 'Nutritional goal',
  'Seleccione objetivo': 'Select goal',
  'Date inicio': 'Start date',
  'Fecha inicio': 'Start date',
  'Date fin': 'End date',
  'Fecha fin': 'End date',
  'Pedido u objetivo del socio': 'Member request or goal',
  'Restricciones o cuidados': 'Restrictions or precautions',
  'Preferencias alimentarias': 'Food preferences',
  'Generar dieta': 'Generate diet',
  'Generando...': 'Generating...',
  'Cerrar': 'Close',
  'Ejemplo: quiero bajar grasa sin perder músculo, entreno 3 días y necesito comidas simples.': 'Example: I want to lose fat without losing muscle, I train 3 days and I need simple meals.',
  'Example: quiero bajar grasa sin perder músculo, entreno 3 días y necesito comidas simples.': 'Example: I want to lose fat without losing muscle, I train 3 days and I need simple meals.',
  'Ejemplo: hipertensión, diabetes, alergias, intolerancias, medicación, embarazo.': 'Example: hypertension, diabetes, allergies, intolerances, medication, pregnancy.',
  'Example: hipertensión, diabetes, alergias, intolerancias, medicación, embarazo.': 'Example: hypertension, diabetes, allergies, intolerances, medication, pregnancy.',
  'Ejemplo: prefiero pollo, arroz, verduras, sin lactosa, económico y fácil de preparar.': 'Example: I prefer chicken, rice, vegetables, lactose-free, affordable and easy to prepare.',
  'Example: prefiero pollo, arroz, verduras, sin lactosa, económico y fácil de preparar.': 'Example: I prefer chicken, rice, vegetables, lactose-free, affordable and easy to prepare.',
  'Volumen': 'Volume',
  'Definición': 'Definition',
  'Bajar de peso': 'Lose weight',
  'Aumentar fuerza': 'Increase strength',
  'Mejorar resistencia': 'Improve endurance',
  'Mantenimiento': 'Maintenance',
  'Ganar masa muscular': 'Gain muscle mass',
  'Bajar grasa sin perder masa muscular': 'Lose fat without losing muscle mass',
  'Review médica operativa': 'Operational medical review',
  'REVIEW MÉDICA OPERATIVA': 'OPERATIONAL MEDICAL REVIEW',
  'Vista de revisión admin': 'Admin review view',
  'Panel de revisión admin': 'Admin review panel',
  'APTO MÉDICO': 'MEDICAL CLEARANCE',
  'Apto médico': 'Medical clearance',
  'Documentos': 'Documents',
  'Archivos adjuntos': 'Attachments',
  'Cargando datos socios...': 'Loading member data...',
  'Cargando datos de socios...': 'Loading member data...',
  'Members · vista administrativa': 'Members · administrative view',
  'Members · Vista administrativa': 'Members · Administrative view',
  'vista administrativa': 'administrative view',
  'Vista administrativa': 'Administrative view',
  'VISTA ADMINISTRATIVA': 'ADMINISTRATIVE VIEW',
  'Total de socios': 'Total members',
  'total de socios': 'total members',
  'TOTAL DE SOCIOS': 'TOTAL MEMBERS',
  'Evolution demo mensual para BI y recorrido del socio.': 'Monthly evolution demo for BI and member journey.',
  'Fin': 'End'
};

const TRANSLATION_ENTRIES = Object.entries(TRANSLATIONS).sort(
  ([a], [b]) => b.length - a.length,
);

const EXACT_ONLY_TRANSLATIONS: Record<string, string> = {
  'Dentro ahora': 'Inside now',
  'Capacidad configurada': 'Configured capacity',
  'Ocupación': 'Occupancy',
  'Ocupación normal. Hay disponibilidad operativa.': 'Normal occupancy. Operational capacity is available.',
  'Ocupación moderada. El gimnasio opera con margen disponible.': 'Moderate occupancy. The gym is operating with available margin.',
  'Ocupación alta. Recomendado monitorear accesos y horarios pico.': 'High occupancy. Monitor access points and peak hours.',
  'Listado de Asistencias': 'Attendance roster',
  'Readydo de Asistencias': 'Attendance roster',
  'Añadir Asistencia': 'Add attendance',
  'Todos los períodos': 'All periods',
  'All los períodos': 'All periods',
  'Últimos 7 días': 'Last 7 days',
  'Mes actual': 'Current month',
  'Año actual': 'Current year',
  'Salida / Aforo': 'Exit / Capacity',
  'Modo terminal': 'Terminal mode',
  'Mode terminal': 'Terminal mode',
  'Actualización automática cada': 'Automatic refresh every',
  'Currentización automática cada': 'Automatic refresh every',
  'Sincronizando asistencias...': 'Syncing attendances...',
  'Última actualización': 'Last update',
  'Name de Member': 'Member name',
  'Nombre de Socio': 'Member name',
  'Hora Ingreso': 'Check-in time',
  'Hora Egreso': 'Check-out time',
  'Total de asistencias': 'Total attendances',
  'Listado de asistencias registradas.': 'Registered attendance list.',
  'Readydo de asistencias registradas.': 'Registered attendance list.',
  'asistencias ordenadas por ingreso reciente.': 'attendances ordered by recent check-in.',
  'Empleado *': 'Employee *',
  'Período *': 'Period *',
  'Periodo *': 'Period *',
  'Concepto': 'Concept',
  'URL de comprobante': 'Receipt URL',
  'URL comprobante': 'Receipt URL',
  'Empleado:': 'Employee:',
  'Base:': 'Base:',
  'Bonos:': 'Bonuses:',
  'Neto:': 'Net:',
  'Sueldo mensual demo': 'Monthly salary demo',
  'sueldo demo': 'salary demo',
  'qa_demo_database_seed_large_20260607 - sueldo demo': 'qa_demo_database_seed_large_20260607 - salary demo',
  'dd/mm/aaaa': 'dd/mm/yyyy',
  'Registros': 'Records',
  'Total neto': 'Total net',
  'Pagado': 'Paid',
  'Pagados': 'Paid',
  'Pendiente': 'Pending',
  'Pendientes': 'Pending',
  'pending': 'Pending',
  'pendiente': 'Pending',
  'Anulado': 'Canceled',
  'Anulados': 'Canceled',
  'anulado': 'Canceled',
  'Sueldos de empleados': 'Employee salaries',
  'Registro opcional de liquidaciones, pagos y recibos del personal.': 'Optional record of payroll settlements, payments and staff receipts.',
  'Período': 'Period',
  'Periodo': 'Period',
  'Base': 'Base',
  'Bonos': 'Bonuses',
  'Desc.': 'Disc.',
  'Neto': 'Net',
  'Estado': 'Status',
  'Pago': 'Payment',
  'Acciones': 'Actions',
  'Buscar empleado, DNI, concepto, medio...': 'Search employee, ID, concept, payment method...',
  'Mostrando': 'Showing',
  'registros.': 'records.',
  'Detalle de sueldo': 'Salary detail',
  'Editar sueldo': 'Edit salary',
  'Nuevo sueldo': 'New salary',
  'Bonos / adicionales': 'Bonuses / additions',
  'Descuentos': 'Discounts',
  'Monto neto': 'Net amount',
  'Medio de pago': 'Payment method',
  'Fecha de pago': 'Payment date',
  'Comprobante': 'Receipt',
  'Observaciones': 'Notes',
  'Sin observaciones.': 'No notes.',
  'Abrir comprobante': 'Open receipt',
  'Descargar recibo PDF': 'Download receipt PDF',
  'Sueldo mensual': 'Monthly salary',
  'Seleccionar empleado': 'Select employee',
  'Transferencia': 'Bank transfer',
  'Efectivo': 'Cash',
  'Tarjeta débito': 'Debit card',
  'Tarjeta crédito': 'Credit card',
  'Otro': 'Other',
  'Registrar sueldo': 'Register salary',
  'Guardar cambios': 'Save changes',
  'Resumen de liquidación': 'Payroll summary',
  'Sin seleccionar': 'Not selected',
  'No hay sueldos registrados para los filtros seleccionados.': 'No salaries registered for the selected filters.',
  'Empleado activo': 'Active employee',
  'Empleado active': 'Active employee',
  'Puesto, área y turno se cargan desde combos base para mantener datos homogéneos. Más adelante estos valores podrán moverse a catálogos parametrizables administrados por cada gimnasio.': 'Position, area and shift are loaded from base combos to keep data consistent. Later these values may move to configurable catalogs managed by each gym.',
  'Este empleado es administrativo. En una próxima feature se desplegarán aquí los permisos de menú/RBAC para definir qué módulos puede ver y utilizar.': 'This employee is administrative. In a future feature, menu/RBAC permissions will be displayed here to define which modules they can view and use.',
  'Refresh empleado': 'Refresh employee',
  'Actualizar empleado': 'Update employee',
  'Edit empleado': 'Edit employee',
  'Editar empleado': 'Edit employee',
  'Edit Empleado': 'Edit employee',
  'Tipo de empleado': 'Employee type',
  'Tipo de Empleado': 'Employee type',
  'Puesto / responsabilidad': 'Position / responsibility',
  'Puesto / Responsabilidad': 'Position / responsibility',
  'Sueldo base de referencia': 'Reference base salary',
  'Sueldo base referencia': 'Reference base salary',
  'Notes internas': 'Internal notes',
  'Notas internas': 'Internal notes',
  'Detalle de empleado': 'Employee detail',
  'Detalle de Empleado': 'Employee detail',
  'Puesto': 'Position',
  'Área': 'Area',
  'Area': 'Area',
  'Registration date': 'Registration date',
  'Fecha de alta': 'Registration date',
  'Date de inicio laboral': 'Employment start date',
  'Fecha de inicio laboral': 'Employment start date',
  'Inicio laboral': 'Employment start date',
  'Date de baja laboral': 'Employment end date',
  'Fecha de baja laboral': 'Employment end date',
  'Baja laboral': 'Employment end date',
  'Tipo de contratación': 'Employment type',
  'Sueldo base': 'Base salary',
  'Horarios / disponibilidad': 'Schedule / availability',
  'Horario / disponibilidad': 'Schedule / availability',
  'mensual': 'Monthly',
  'Mensual': 'Monthly',
  'Tarde': 'Afternoon',
  'Administración y caja': 'Administration and cash desk',
  'Monday a viernes de 15:00 a 18:00': 'Monday to Friday from 15:00 to 18:00',
  'lunes a viernes de 15:00 a 18:00': 'Monday to Friday from 15:00 to 18:00',
  'Lunes a viernes de 15:00 a 18:00': 'Monday to Friday from 15:00 to 18:00',
  'Total empleados': 'Total employees',
  'Total de empleados': 'Total employees',
  'Administrativos': 'Administrative',
  'Nómina estimada': 'Estimated payroll',
  'Listado de Empleados': 'Employee roster',
  'Listado de empleados': 'Employee roster',
  'Readydo de Empleados': 'Employee roster',
  'Readydo de empleados': 'Employee roster',
  'Readydos de Empleados': 'Employee roster',
  'Readydos de empleados': 'Employee roster',
  'Gestión integral de empleados, responsabilidades y base para sueldos/RBAC.': 'Comprehensive employee management, responsibilities and payroll/RBAC base.',
  'Todos los tipos': 'All types',
  'All los tipos': 'All types',
  'Añadir Empleado': 'Add employee',
  'Empleado': 'Employee',
  'Tipo': 'Type',
  'Área / puesto': 'Area / position',
  'Alta': 'Hire date',
  'Sueldo ref.': 'Reference salary',
  'Listado de empleados registrados.': 'Registered employee list.',
  'Readydo de empleados registrados.': 'Registered employee list.',
  'Readydos de empleados registrados.': 'Registered employee list.',
  'Administrativo': 'Administrative',
  'Entrenador': 'Trainer',
  'Mantenimiento': 'Maintenance',
  'Limpieza': 'Cleaning',
  'Recepción': 'Reception',
  'Administración': 'Administration',
  'Recepción y administración': 'Reception and administration',
  'Caja y atención al socio': 'Cash desk and member service',
  'Atención bar/snack': 'Bar/snack service',
  'Entrenamiento': 'Training',
  'Buscar empleado, ID, tipo, área...': 'Search employee, ID, type, area...',
  'Enrolleds por actividad': 'Enrolled by activity',
  'Inscritos por actividad': 'Enrolled by activity',
  'Cancelar edición': 'Cancel editing',
  'Refresh turno': 'Refresh shift',
  'Actualizar turno': 'Refresh shift',
  'Nombre de Activity': 'Activity name',
  'Creado en': 'Created on',
  'Currentizado en': 'Updated on',
  'Actualizado en': 'Updated on',
  'Total activities': 'Total activities',
  'Total de actividades': 'Total activities',
  'Nombre de Actividad': 'Activity name',
  'Nombre de actividad': 'Activity name',
  'Name de Activity': 'Activity name',
  'Name de actividad': 'Activity name',
  'Crear Actividad': 'Create activity',
  'Crear Activity': 'Create activity',
  'Actualizar Actividad': 'Update activity',
  'Actualizar Activity': 'Update activity',
  'Ingrese nombre de la actividad': 'Enter activity name',
  'Cancelar': 'Cancel',
  'medio': 'Medium',
  'Medio': 'Medium',
  'MEDIO': 'MEDIUM',
};

const EXACT_ONLY_REVERSE_TRANSLATIONS: Record<string, string> = Object.entries(
  EXACT_ONLY_TRANSLATIONS,
).reduce(
  (acc, [from, to]) => {
    if (!(to in acc)) acc[to] = from;
    return acc;
  },
  {} as Record<string, string>,
);

const REVERSE_TRANSLATIONS: Record<string, string> = Object.entries(TRANSLATIONS).reduce(
  (acc, [from, to]) => {
    if (!(to in acc)) acc[to] = from;
    return acc;
  },
  {} as Record<string, string>,
);

const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'SVG', 'CANVAS']);

function replaceAllLiteral(value: string, from: string, to: string) {
  return value.split(from).join(to);
}

function translateValueForLocale(value: string, locale: string) {
  if (!value) return value;

  const leading = value.match(/^\s*/)?.[0] ?? '';
  const trailing = value.match(/\s*$/)?.[0] ?? '';
  const trimmed = value.trim();

  if (!trimmed) return value;

  const isEnglish = locale === 'en';
  const exactOnlyDictionary = isEnglish
    ? EXACT_ONLY_TRANSLATIONS
    : EXACT_ONLY_REVERSE_TRANSLATIONS;
  const dictionary = isEnglish ? TRANSLATIONS : REVERSE_TRANSLATIONS;

  const exactOnly = exactOnlyDictionary[trimmed];
  if (exactOnly) return `${leading}${exactOnly}${trailing}`;

  const exact = dictionary[trimmed];
  if (exact) return `${leading}${exact}${trailing}`;

  if (!isEnglish) {
    return value;
  }

  let next = value;
  for (const [from, to] of TRANSLATION_ENTRIES) {
    if (next.includes(from)) {
      next = replaceAllLiteral(next, from, to);
    }
  }

  return next;
}

function shouldSkipElement(element: Element | null) {
  if (!element) return false;
  if (SKIP_TAGS.has(element.tagName)) return true;
  if (element.closest('[data-i18n-sweep="off"]')) return true;
  return false;
}

function translateTextNode(
  node: Text,
  originals: WeakMap<Text, string>,
  locale: string,
) {
  if (shouldSkipElement(node.parentElement)) return;

  const currentValue = node.nodeValue ?? '';

  if (!originals.has(node)) {
    originals.set(node, currentValue);
  }

  const translated = translateValueForLocale(currentValue, locale);

  if (node.nodeValue !== translated) {
    node.nodeValue = translated;
  }
}

function translateAttributes(
  element: Element,
  originals: WeakMap<Element, Record<string, string>>,
  locale: string,
) {
  if (shouldSkipElement(element)) return;

  const attrs = ['placeholder', 'title', 'aria-label'];
  const originalAttrs = originals.get(element) ?? {};
  let changed = false;

  for (const attr of attrs) {
    if (!element.hasAttribute(attr)) continue;

    if (!(attr in originalAttrs)) {
      originalAttrs[attr] = element.getAttribute(attr) ?? '';
      changed = true;
    }

    const current = element.getAttribute(attr) ?? '';
    const translated = translateValueForLocale(current, locale);

    if (element.getAttribute(attr) !== translated) {
      element.setAttribute(attr, translated);
    }
  }

  if (changed || Object.keys(originalAttrs).length) {
    originals.set(element, originalAttrs);
  }
}

function sweepDashboardTexts(
  root: ParentNode,
  locale: string,
  textOriginals: WeakMap<Text, string>,
  attrOriginals: WeakMap<Element, Record<string, string>>,
) {
  const textWalker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let textNode = textWalker.nextNode();

  while (textNode) {
    translateTextNode(textNode as Text, textOriginals, locale);
    textNode = textWalker.nextNode();
  }

  const elements =
    root instanceof Element
      ? [root, ...Array.from(root.querySelectorAll('*'))]
      : Array.from(root.querySelectorAll('*'));

  for (const element of elements) {
    translateAttributes(element, attrOriginals, locale);
  }
}

export default function DashboardInlineI18nSweep() {
  const { locale } = useI18n();
  const textOriginals = useRef(new WeakMap<Text, string>());
  const attrOriginals = useRef(new WeakMap<Element, Record<string, string>>());

  useEffect(() => {
    if (typeof document === 'undefined') return;

    const root = document.body;
    const runSweep = () =>
      sweepDashboardTexts(root, locale, textOriginals.current, attrOriginals.current);

    runSweep();

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.TEXT_NODE) {
            translateTextNode(node as Text, textOriginals.current, locale);
            return;
          }

          if (node.nodeType === Node.ELEMENT_NODE) {
            sweepDashboardTexts(
              node as Element,
              locale,
              textOriginals.current,
              attrOriginals.current,
            );
          }
        });

        if (mutation.type === 'characterData' && mutation.target.nodeType === Node.TEXT_NODE) {
          translateTextNode(mutation.target as Text, textOriginals.current, locale);
        }

        if (mutation.type === 'attributes' && mutation.target.nodeType === Node.ELEMENT_NODE) {
          translateAttributes(
            mutation.target as Element,
            attrOriginals.current,
            locale,
          );
        }
      }
    });

    observer.observe(root, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: ['placeholder', 'title', 'aria-label'],
    });

    return () => observer.disconnect();
  }, [locale]);

  return null;
}
