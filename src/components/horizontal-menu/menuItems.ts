const menuItems = [
  {
    title: "Tablas",
    items: [
      {
        title: "Tiendas",
        href: "/dashboard/tiendas",
      },
      {
        title: "Productos",
        href: "/dashboard/productos",
        hasChildren: true,
        submenu: [
          { title: "Lista de productos", href: "/tablas/productos/lista" },
          { title: "Unidades", href: "/dashboard/unidades" },
          { title: "Marcas", href: "/dashboard/marcas" },
          { title: "Líneas", href: "/dashboard/lineas" },
          { title: "Comisiones", href: "/dashboard/comisiones" },
          { title: "Precios", href: "/dashboard/precios" },
          { title: "Categorías", href: "/dashboard/categorias" },
        ],
      },
      {
        title: "Clientes",
        href: "/dashboard/clientes",
      },
      {
        title: "Proveedores",
        href: "/dashboard/proveedores",
      },
      {
        title: "Precios",
        href: "/dashboard/precios",
      },
      {
        title: "Vendedores",
        href: "/dashboard/vendedores",
      },
      {
        title: "Zonas",
        href: "/dashboard/zonas",
      },
      {
        title: "Transporte",
        href: "/dashboard/transporte",
        hasChildren: true,
        submenu: [
          {
            title: "Transportistas",
            href: "/dashboard/transportistas",
          },
          { title: "Vehículos", href: "/dashboard/vehiculos" },
          { title: "Choferes", href: "/dashboard/choferes" },
        ],
      },
      {
        title: "Tipos de documento",
        href: "/dashboard/tipos-documento",
      },
      {
        title: "Tipos de movimiento",
        href: "/dashboard/tipos_movimiento",
      },
      {
        title: "Series de documento",
        href: "/dashboard/series-documentos",
      },
      {
        title: "Formas de pago",
        href: "/dashboard/formas-pago",
      },
    ],
  },
  {
    title: "Almacenes",
    items: [
      { title: "Ingresos x Compras", href: "/dashboard/ingresos-compras" },
      {
        title: "Ingresos x Transferencias",
        href: "/dashboard/ingresos-transferencias",
      },
      {
        title: "Ingresos x Otros Conceptos",
        href: "/dashboard/ingresos-otros",
      },
      {
        title: "Egresos x transferencias",
        href: "/dashboard/egresos-transferencias",
      },
      { title: "Egresos x Otros Conceptos", href: "/dashboard/egresos-otros" },
      { title: "Reportes", href: "/dashboard/reportes" },
    ],
  },
  {
    title: "Operaciones",
    items: [
      { title: "Caja", href: "/dashboard/caja" },
      {
        title: "Terminal - Facturación",
        href: "/dashboard/terminal-facturacion",
      },
      {
        title: "Oficina - Facturación",
        href: "/dashboard/oficina-facturacion",
      },
      { title: "Guías de Remisión", href: "/dashboard/guias-remision" },
      { title: "Líneas de crédito", href: "/dashboard/lineas-credito" },
      {
        title: "Documentos de regularización",
        href: "/dashboard/documentos-regularizacion",
      },
      { title: "Proformas", href: "/dashboard/proformas" },
      {
        title: "Facturación electrónica",
        href: "/dashboard/facturacion-electronica",
      },
    ],
  },
  {
    title: "Cuentas",
    items: [
      {
        title: "Clientes",
        href: "/dashboard/clientes",
        hasChildren: true,
        submenu: [
          {
            title: "Consultar documento",
            href: "/dashboard/consultar-documento",
          },
          {
            title: "Nuevo documentos de débito",
            href: "/dashboard/nuevo-documento-debito",
          },
          {
            title: "Operaciones de cobranza",
            href: "/dashboard/operaciones-cobranza",
          },
        ],
      },
      {
        title: "Proveedores",
        href: "/dashboard/proveedores",
        hasChildren: true,
        submenu: [
          {
            title: "Consultar documento",
            href: "/dashboard/consultar-documento",
          },
          {
            title: "Nuevo documentos de débito",
            href: "/dashboard/nuevo-documento-debito",
          },
          {
            title: "Operaciones de pago",
            href: "/dashboard/operaciones-pago",
          },
        ],
      },
    ],
  },
];
export default menuItems;
