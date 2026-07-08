"use client";

import React from "react";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "../ui/sidebar";
import Link from "next/link";
import { SidebarItemType } from "./sidebarConfig";
import { useI18n } from "@/i18n/I18nProvider";


const SIDEBAR_GROUP_KEYS: Record<string, string> = {
  General: 'sidebar.groups.general',
  'Mi Gimnasio': 'sidebar.groups.myGym',
  'Mi Coach': 'sidebar.groups.myCoach',
  'Mi Salud': 'sidebar.groups.myHealth',
  Comunicación: 'sidebar.groups.communication',
  'Personal y Operaciones': 'sidebar.groups.personalOperations',
  Infraestructura: 'sidebar.groups.infrastructure',
  'Entrenamiento y Salud': 'sidebar.groups.trainingHealth',
  'Comercial y Stock': 'sidebar.groups.commercialStock',
  'Finanzas y BI': 'sidebar.groups.financeBi',
  'IA y RAG': 'sidebar.groups.aiRag',
  'Comunicación y Soporte': 'sidebar.groups.communicationSupport',
  'Administración del Sistema': 'sidebar.groups.systemAdministration',
  'Configuración Personal': 'sidebar.groups.personalSettings',
};

const SIDEBAR_ITEM_KEYS: Record<string, string> = {
  Inicio: 'sidebar.items.home',
  'Control de Asistencia': 'sidebar.items.attendanceControl',
  'Pagar cuota': 'sidebar.items.payFee',
  'Historial de pagos': 'sidebar.items.paymentHistory',
  'Cuota - Precio': 'sidebar.items.feePrice',
  Rutina: 'sidebar.items.routine',
  Dieta: 'sidebar.items.diet',
  'Coach IA': 'sidebar.items.aiCoach',
  'Asistente de Rutinas': 'sidebar.items.routineAssistant',
  'Asistente de Dietas': 'sidebar.items.dietAssistant',
  'Evolución Física': 'sidebar.items.physicalEvolution',
  'Ficha Médica': 'sidebar.items.medicalRecord',
  Mensajes: 'sidebar.items.messages',
  Socios: 'sidebar.items.members',
  Actividades: 'sidebar.items.activities',
  Empleados: 'sidebar.items.employees',
  Sueldos: 'sidebar.items.salaries',
  Asistencias: 'sidebar.items.attendances',
  'Salida / Aforo': 'sidebar.items.exitCapacity',
  'Mantenimiento Edilicio': 'sidebar.items.buildingMaintenance',
  'Lector QR/barra': 'sidebar.items.qrBarcodeReader',
  'Etiquetas QR': 'sidebar.items.qrLabels',
  Equipamientos: 'sidebar.items.equipment',
  'Preventivos Equipos': 'sidebar.items.equipmentPreventive',
  'Gestión de Rutinas': 'sidebar.items.routineManagement',
  'Gestión de Dietas': 'sidebar.items.dietManagement',
  'Gestión Evolución Física': 'sidebar.items.physicalEvolutionManagement',
  'Media de Ejercicios': 'sidebar.items.exerciseMedia',
  'Comercial / Kiosco': 'sidebar.items.commercialKiosk',
  'POS / Kiosco': 'sidebar.items.posKiosk',
  'Caja / Cashup': 'sidebar.items.cashup',
  'Compras / Reposición': 'sidebar.items.purchasesReplenishment',
  Ventas: 'sidebar.items.sales',
  Compras: 'sidebar.items.purchases',
  Productos: 'sidebar.items.products',
  'Stock Ledger': 'sidebar.items.stockLedger',
  'Códigos / Etiquetas': 'sidebar.items.codesLabels',
  'BI Packs / Promos': 'sidebar.items.packPromosBi',
  Proveedores: 'sidebar.items.suppliers',
  Servicios: 'sidebar.items.services',
  'Servicios / Packs / Promos': 'sidebar.items.servicesPacksPromos',
  Pagos: 'sidebar.items.payments',
  Cuotas: 'sidebar.items.fees',
  'Gastos / Egresos': 'sidebar.items.expenses',
  'Finanzas / BI': 'sidebar.items.financeBi',
  'BI Socios / Promociones': 'sidebar.items.membersPromotionsBi',
  'Ranking / Bonificación': 'sidebar.items.rankingBonus',
  'RAG Corpus': 'sidebar.items.ragCorpus',
  Notificaciones: 'sidebar.items.notifications',
  'Mensajes Socios': 'sidebar.items.memberMessages',
  Avisos: 'sidebar.items.notices',
  'Soporte Dragon Pyramid': 'sidebar.items.dragonSupport',
  'Respaldo / Exportación': 'sidebar.items.backupExport',
  Usuarios: 'sidebar.items.users',
  'Datos del Gimnasio': 'sidebar.items.gymData',
  Parametrización: 'sidebar.items.parametrization',
  Perfil: 'sidebar.items.profile',
  Preferencias: 'sidebar.items.preferences',
};

function translateSidebarLabel(
  value: string,
  keys: Record<string, string>,
  t: (key: string) => string,
) {
  const key = keys[value];
  return key ? t(key) : value;
}

interface Props {
  title: string;
  icon?: React.ElementType;
  items: SidebarItemType[];
  isMobile: boolean;
  closeSidebar: () => void;
}

export const SidebarSection: React.FC<Props> = ({
  title,
  icon,
  items,
  isMobile,
  closeSidebar,
}) => {
  const { t } = useI18n();
  const translatedTitle = translateSidebarLabel(title, SIDEBAR_GROUP_KEYS, t);

  return (
    <SidebarGroup>
      <SidebarGroupLabel className="text-sm text-muted-foreground flex items-center gap-2">
        {icon && React.createElement(icon)} {translatedTitle}
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu className="flex flex-col gap-2 mt-2">
          {items.map((item, idx) => (
            <SidebarMenuItem key={idx}>
              <SidebarMenuButton
                asChild
                className={`min-h-10 touch-manipulation gap-2 text-sm ${
                  item.level === 2 ? "pl-4" : item.level === 3 ? "pl-8" : "pl-2"
                }`}
              >
                <Link href={item.link} onClick={() => isMobile && closeSidebar()}>
                  <span className="shrink-0 text-muted-foreground">
                    {item.level === 2 ? "●" : item.level === 3 ? "○" : ""}
                  </span>
                  <span className="truncate">{translateSidebarLabel(item.title, SIDEBAR_ITEM_KEYS, t)}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
};
