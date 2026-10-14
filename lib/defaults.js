// Valores iniciales. Todo esto se edita desde /configuracion.
// Los precios son DE EJEMPLO: reemplazalos por los reales.

export const DEFAULT_CONFIG = {
  version: 1,
  preciosDeEjemplo: true,
  empresa: {
    nombre: "Citriq",
    tagline: "Software a medida para la construcción",
    web: "citriqs.com",
    email: "",
    whatsapp: "+54 9 3484 36-6295",
    calendly: "https://calendly.com/salva-pad-arg/30min",
    colorAcento: "#C8F04A",
  },
  vendedores: [
    { id: "salvador", nombre: "Salvador García Tellechea", rol: "Socio fundador", whatsapp: "+54 9 3484 36-6295", email: "" },
    { id: "vito", nombre: "Vito Santangelo", rol: "Socio · Comercial", whatsapp: "", email: "" },
  ],
  moneda: "USD",
  validezDias: 15,
  notaImpuestos: "Precios expresados sin IVA.",
  productos: [
    {
      id: "web",
      nombre: "Sitio web profesional",
      descripcion:
        "Sitio rápido y optimizado para celular, pensado para convertir visitas en consultas por WhatsApp.",
      incluye: [
        "Diseño a medida con la identidad de tu marca",
        "Catálogo de productos y galería de obras",
        "Botón de WhatsApp y formulario de contacto",
        "SEO local para aparecer en Google Maps y búsquedas de tu zona",
      ],
      setup: 600,
      mensual: 25,
      etiquetaMensual: "Hosting, dominio y mantenimiento",
      tipo: "propio",
    },
    {
      id: "visualizador",
      nombre: "Visualizador de materiales con IA",
      descripcion:
        "El cliente sube una foto de su ambiente y ve cómo queda el piso elegido, con comparación antes y después.",
      incluye: [
        "Detección automática del piso en la foto",
        "Carga de tu catálogo de materiales y texturas",
        "Comparador antes / después",
        "Integrable en tu web actual o en una nueva",
      ],
      setup: 900,
      mensual: 60,
      etiquetaMensual: "Uso de IA, hosting y actualizaciones",
      tipo: "propio",
    },
    {
      id: "cotizador",
      nombre: "Cotizador online + bandeja de consultas",
      descripcion:
        "Presupuesto estimado al instante según los m² del ambiente, y cada consulta te llega ordenada con todos los datos.",
      incluye: [
        "Cálculo por m², material y colocación",
        "Consultas con nombre, teléfono, material, superficie y fotos",
        "Aviso inmediato al equipo de ventas",
        "Precios y materiales editables por tu equipo",
      ],
      setup: 500,
      mensual: 30,
      etiquetaMensual: "Hosting y soporte",
      tipo: "propio",
    },
    {
      id: "bot",
      nombre: "Asistente de atención con IA",
      descripcion:
        "Responde consultas las 24 horas, califica a cada interesado y deriva a tu equipo solo los que están listos para comprar.",
      incluye: [
        "Respuestas automáticas con la información de tu negocio",
        "Calificación de clientes potenciales",
        "Derivación a un vendedor humano",
        "Configuración inicial y ajustes del primer mes",
      ],
      etiquetaMensual: "Licencia y soporte",
      tipo: "gsl",
      // Bot provisto por GSL Solutions (dato interno, NO sale en el PDF).
      gsl: {
        modo: "markup", // "markup" | "comision"
        costoSetup: 150, // lo que nos cobra GSL (modo markup)
        costoMensual: 50,
        markupPct: 60,
        precioListaSetup: 300, // precio que fija GSL (modo comision)
        precioListaMensual: 90,
        comisionPct: 30,
      },
      setup: 0, // se calcula desde gsl
      mensual: 0,
    },
  ],
  paquetes: [
    { id: "p1", nombre: "Web + Visualizador", productos: ["web", "visualizador"], descuentoPct: 10 },
    { id: "p2", nombre: "Visualizador + Cotizador", productos: ["visualizador", "cotizador"], descuentoPct: 10 },
    { id: "p3", nombre: "Combo completo", productos: ["web", "visualizador", "cotizador", "bot"], descuentoPct: 15 },
  ],
  proceso: [
    { titulo: "Relevamiento", texto: "Entendemos cómo vendés hoy, tu catálogo y qué consultas recibís." },
    { titulo: "Prototipo", texto: "Te mostramos una primera versión funcionando con tus productos." },
    { titulo: "Puesta en marcha", texto: "Integramos todo con tu web, WhatsApp y equipo de ventas." },
    { titulo: "Acompañamiento", texto: "Medimos resultados, ajustamos y damos soporte mes a mes." },
  ],
  condiciones: [
    "Implementación: 50% para comenzar y 50% contra entrega.",
    "El abono mensual comienza a facturarse cuando el servicio queda en funcionamiento.",
    "Plazo estimado de entrega: 2 a 4 semanas desde el inicio.",
    "Sin permanencia mínima en los abonos: se pueden dar de baja con 30 días de aviso.",
  ],
};
