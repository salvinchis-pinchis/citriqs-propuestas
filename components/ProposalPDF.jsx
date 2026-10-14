import { Document, Page, View, Text, Link, StyleSheet, Font } from "@react-pdf/renderer";
import { fmt, fechaLarga, sumarDias } from "@/lib/calc";

// Evita cortes de palabra raros (el separador por defecto es en inglés)
Font.registerHyphenationCallback((w) => [w]);

const ORIGIN = typeof window !== "undefined" ? window.location.origin : "";
Font.register({
  family: "Inter",
  fonts: [
    { src: `${ORIGIN}/fonts/Inter-400.woff`, fontWeight: 400 },
    { src: `${ORIGIN}/fonts/Inter-600.woff`, fontWeight: 600 },
    { src: `${ORIGIN}/fonts/Inter-700.woff`, fontWeight: 700 },
  ],
});

const C = {
  dark: "#0E1215",
  ink: "#15191C",
  muted: "#5E6772",
  soft: "#8A929B",
  line: "#E2E5E7",
  paper: "#FFFFFF",
  tint: "#F4F5F3",
};

const s = StyleSheet.create({
  page: { backgroundColor: C.paper, paddingTop: 64, paddingBottom: 60, paddingHorizontal: 48, fontFamily: "Inter", fontSize: 10, color: C.ink, lineHeight: 1.45 },
  cover: { backgroundColor: C.dark, padding: 48, color: "#FFFFFF", fontFamily: "Inter" },
  header: { position: "absolute", top: 26, left: 48, right: 48, flexDirection: "row", justifyContent: "space-between", fontSize: 8, color: C.soft, borderBottomWidth: 0.5, borderBottomColor: C.line, paddingBottom: 8 },
  footer: { position: "absolute", bottom: 26, left: 48, right: 48, flexDirection: "row", justifyContent: "space-between", fontSize: 8, color: C.soft },
  kicker: { fontSize: 8, letterSpacing: 1.6, color: C.muted, fontFamily: "Inter", fontWeight: 700, marginBottom: 6 },
  h2: { fontSize: 18, fontFamily: "Inter", fontWeight: 700, color: C.ink, marginBottom: 14, letterSpacing: -0.3 },
  section: { marginBottom: 28 },
  p: { fontSize: 10, color: C.ink },
  pMuted: { fontSize: 9.5, color: C.muted },
  card: { borderWidth: 0.75, borderColor: C.line, borderRadius: 6, padding: 14, marginBottom: 10, flexDirection: "row" },
  num: { width: 22, height: 22, borderRadius: 11, alignItems: "center", justifyContent: "center", marginRight: 12 },
  numTxt: { fontSize: 9, fontFamily: "Inter", fontWeight: 700, color: C.dark },
  cardTitle: { fontSize: 12, fontFamily: "Inter", fontWeight: 700, marginBottom: 3 },
  bullet: { flexDirection: "row", marginTop: 3 },
  dot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: C.muted, marginTop: 5, marginRight: 7 },
  th: { flexDirection: "row", backgroundColor: C.dark, color: "#FFFFFF", paddingVertical: 7, paddingHorizontal: 10, fontSize: 8, fontFamily: "Inter", fontWeight: 700, letterSpacing: 0.6, borderTopLeftRadius: 4, borderTopRightRadius: 4 },
  tr: { flexDirection: "row", paddingVertical: 8, paddingHorizontal: 10, borderBottomWidth: 0.5, borderBottomColor: C.line },
  colName: { flex: 1 },
  colNum: { width: 110, textAlign: "right" },
  totBox: { flex: 1, borderRadius: 6, padding: 14 },
  step: { flex: 1, paddingRight: 10 },
});

function waLink(num) {
  const d = String(num || "").replace(/\D/g, "");
  return d ? `https://wa.me/${d}` : null;
}

function Header({ empresa, numero, cliente }) {
  return (
    <View style={s.header} fixed>
      <Text>{empresa.nombre} · Propuesta {numero}</Text>
      <Text>{cliente}</Text>
    </View>
  );
}
function Footer({ empresa }) {
  return (
    <View style={s.footer} fixed>
      <Text>{empresa.web}</Text>
      <Text render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
    </View>
  );
}

function Meta({ label, value, sub }) {
  return (
    <View style={{ width: "50%", marginBottom: 16, paddingRight: 12 }}>
      <Text style={{ fontSize: 7.5, letterSpacing: 1.4, color: "#7F8890", fontFamily: "Inter", fontWeight: 700, marginBottom: 4 }}>{label}</Text>
      <Text style={{ fontSize: 11, color: "#FFFFFF" }}>{value || "—"}</Text>
      {sub ? <Text style={{ fontSize: 9, color: "#9AA3AB", marginTop: 1 }}>{sub}</Text> : null}
    </View>
  );
}

export default function ProposalPDF({ data }) {
  const { config, prospecto, vendedor, t, numero, fecha, descuentoSetupPct, descuentoMensualPct, notaExtra } = data;
  const { empresa, moneda } = config;
  const acc = empresa.colorAcento || "#C8F04A";
  const f = new Date(fecha);
  const vence = sumarDias(f, config.validezDias);
  const cliente = prospecto.empresa || "Cliente";
  const hayContexto = (prospecto.diagnostico || "").trim() || (prospecto.objetivo || "").trim();
  const wa = waLink(vendedor?.whatsapp || empresa.whatsapp);
  const tieneMensual = t.totalMensual > 0;
  const tieneSetup = t.totalSetup > 0;

  return (
    <Document title={`Propuesta ${empresa.nombre} – ${cliente}`} author={empresa.nombre} subject={`Propuesta ${numero}`} language="es">
      {/* PORTADA */}
      <Page size="A4" style={s.cover}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <View style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: acc, marginRight: 8 }} />
          <Text style={{ fontSize: 15, fontFamily: "Inter", fontWeight: 700, letterSpacing: -0.2 }}>{empresa.nombre}</Text>
        </View>

        <View style={{ marginTop: 170 }}>
          <Text style={{ fontSize: 9, letterSpacing: 2.2, color: acc, fontFamily: "Inter", fontWeight: 700, marginBottom: 14 }}>PROPUESTA COMERCIAL</Text>
          <Text style={{ fontSize: 40, fontFamily: "Inter", fontWeight: 700, lineHeight: 1.08, letterSpacing: -1 }}>{cliente}</Text>
          <Text style={{ fontSize: 12, color: "#AEB6BD", marginTop: 14, lineHeight: 1.5, maxWidth: 400 }}>
            {t.lineas.map((l) => l.producto.nombre).join("  ·  ")}
          </Text>
        </View>

        <View style={{ position: "absolute", left: 48, right: 48, bottom: 56 }}>
          <View style={{ height: 0.75, backgroundColor: "#2A3136", marginBottom: 20 }} />
          <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
            <Meta label="PREPARADA PARA" value={prospecto.contacto || cliente} sub={prospecto.cargo} />
            <Meta label="PREPARADA POR" value={vendedor?.nombre} sub={vendedor?.rol} />
            <Meta label="FECHA" value={fechaLarga(f)} sub={`Válida hasta el ${fechaLarga(vence)}`} />
            <Meta label="PROPUESTA N°" value={numero} />
          </View>
          <Text style={{ fontSize: 8.5, color: "#6F7880", marginTop: 4 }}>{empresa.nombre} — {empresa.tagline}</Text>
        </View>
        <View style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 6, backgroundColor: acc }} />
      </Page>

      {/* CUERPO */}
      <Page size="A4" style={s.page}>
        <Header empresa={empresa} numero={numero} cliente={cliente} />
        <Footer empresa={empresa} />

        {hayContexto ? (
          <View style={s.section}>
            <Text style={s.kicker}>CONTEXTO</Text>
            <Text style={s.h2}>Lo que entendimos de {cliente}</Text>
            <View style={{ flexDirection: "row" }}>
              {(prospecto.diagnostico || "").trim() ? (
                <View style={{ flex: 1, paddingRight: 14 }}>
                  <Text style={{ fontFamily: "Inter", fontWeight: 700, fontSize: 10, marginBottom: 4 }}>Situación actual</Text>
                  <Text style={s.p}>{prospecto.diagnostico}</Text>
                </View>
              ) : null}
              {(prospecto.objetivo || "").trim() ? (
                <View style={{ flex: 1, paddingLeft: 14, borderLeftWidth: 2, borderLeftColor: acc }}>
                  <Text style={{ fontFamily: "Inter", fontWeight: 700, fontSize: 10, marginBottom: 4 }}>Objetivo</Text>
                  <Text style={s.p}>{prospecto.objetivo}</Text>
                </View>
              ) : null}
            </View>
          </View>
        ) : null}

        <View style={s.section}>
          <Text style={s.kicker} minPresenceAhead={120}>SOLUCIÓN</Text>
          <Text style={s.h2}>Qué proponemos</Text>
          {t.lineas.map((l, i) => (
            <View key={l.producto.id} style={s.card} wrap={false}>
              <View style={[s.num, { backgroundColor: acc }]}>
                <Text style={s.numTxt}>{i + 1}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.cardTitle}>{l.producto.nombre}</Text>
                <Text style={s.pMuted}>{l.producto.descripcion}</Text>
                <View style={{ marginTop: 6 }}>
                  {(l.producto.incluye || []).filter(Boolean).map((b, j) => (
                    <View key={j} style={s.bullet}>
                      <View style={s.dot} />
                      <Text style={{ flex: 1, fontSize: 9.5 }}>{b}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          ))}
        </View>

        <View style={s.section} wrap={false}>
          <Text style={s.kicker}>INVERSIÓN</Text>
          <Text style={s.h2}>Detalle de precios</Text>
          <View style={s.th}>
            <Text style={s.colName}>SERVICIO</Text>
            <Text style={s.colNum}>IMPLEMENTACIÓN</Text>
            <Text style={s.colNum}>ABONO MENSUAL</Text>
          </View>
          {t.lineas.map((l) => (
            <View key={l.producto.id} style={s.tr}>
              <View style={s.colName}>
                <Text style={{ fontFamily: "Inter", fontWeight: 700 }}>{l.producto.nombre}</Text>
                {l.mensual > 0 && l.producto.etiquetaMensual ? (
                  <Text style={{ fontSize: 8, color: C.soft, marginTop: 1 }}>Mensual: {l.producto.etiquetaMensual}</Text>
                ) : null}
              </View>
              <Text style={s.colNum}>{l.setup > 0 ? fmt(l.setup, moneda) : "Incluido"}</Text>
              <Text style={s.colNum}>{l.mensual > 0 ? fmt(l.mensual, moneda) : "—"}</Text>
            </View>
          ))}
          {t.descSetup > 0 || t.descMensual > 0 ? (
            <>
              <View style={[s.tr, { borderBottomWidth: 0 }]}>
                <Text style={[s.colName, { color: C.muted }]}>Subtotal</Text>
                <Text style={[s.colNum, { color: C.muted }]}>{fmt(t.subSetup, moneda)}</Text>
                <Text style={[s.colNum, { color: C.muted }]}>{fmt(t.subMensual, moneda)}</Text>
              </View>
              <View style={s.tr}>
                <Text style={[s.colName, { color: C.muted }]}>Bonificación</Text>
                <Text style={[s.colNum, { color: C.muted }]}>{t.descSetup > 0 ? `– ${fmt(t.descSetup, moneda)} (${descuentoSetupPct}%)` : "—"}</Text>
                <Text style={[s.colNum, { color: C.muted }]}>{t.descMensual > 0 ? `– ${fmt(t.descMensual, moneda)} (${descuentoMensualPct}%)` : "—"}</Text>
              </View>
            </>
          ) : null}

          <View style={{ flexDirection: "row", marginTop: 14 }}>
            {tieneSetup ? (
              <View style={[s.totBox, { backgroundColor: C.tint, marginRight: tieneMensual ? 10 : 0 }]}>
                <Text style={{ fontSize: 8, letterSpacing: 1.2, color: C.muted, fontFamily: "Inter", fontWeight: 700 }}>IMPLEMENTACIÓN · PAGO ÚNICO</Text>
                <Text style={{ fontSize: 22, fontFamily: "Inter", fontWeight: 700, marginTop: 6 }}>{fmt(t.totalSetup, moneda)}</Text>
              </View>
            ) : null}
            {tieneMensual ? (
              <View style={[s.totBox, { backgroundColor: C.dark }]}>
                <Text style={{ fontSize: 8, letterSpacing: 1.2, color: acc, fontFamily: "Inter", fontWeight: 700 }}>ABONO MENSUAL</Text>
                <Text style={{ fontSize: 22, fontFamily: "Inter", fontWeight: 700, marginTop: 6, color: "#FFFFFF" }}>
                  {fmt(t.totalMensual, moneda)}
                  <Text style={{ fontSize: 10, color: "#9AA3AB", fontFamily: "Inter" }}> / mes</Text>
                </Text>
              </View>
            ) : null}
          </View>
          <Text style={{ fontSize: 8.5, color: C.soft, marginTop: 8 }}>
            {config.notaImpuestos} Valores en {moneda === "ARS" ? "pesos argentinos" : moneda === "USD" ? "dólares estadounidenses" : moneda}.
          </Text>
        </View>

        {(config.proceso || []).length ? (
          <View style={s.section} wrap={false}>
            <Text style={s.kicker}>PROCESO</Text>
            <Text style={s.h2}>Cómo trabajamos</Text>
            <View style={{ flexDirection: "row" }}>
              {config.proceso.map((p, i) => (
                <View key={i} style={s.step}>
                  <View style={{ height: 3, backgroundColor: i === 0 ? acc : C.line, marginBottom: 8, borderRadius: 2 }} />
                  <Text style={{ fontSize: 8, color: C.soft, fontFamily: "Inter", fontWeight: 700 }}>{String(i + 1).padStart(2, "0")}</Text>
                  <Text style={{ fontSize: 10.5, fontFamily: "Inter", fontWeight: 700, marginTop: 2, marginBottom: 3 }}>{p.titulo}</Text>
                  <Text style={{ fontSize: 9, color: C.muted }}>{p.texto}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        <View style={s.section} wrap={false}>
          <Text style={s.kicker}>CONDICIONES</Text>
          {[...(config.condiciones || []), ...(notaExtra ? [notaExtra] : []), `Esta propuesta es válida hasta el ${fechaLarga(vence)}.`]
            .filter(Boolean)
            .map((c, i) => (
              <View key={i} style={s.bullet}>
                <View style={s.dot} />
                <Text style={{ flex: 1, fontSize: 9.5, color: C.ink }}>{c}</Text>
              </View>
            ))}
        </View>

        <View style={{ backgroundColor: C.dark, borderRadius: 8, padding: 20, flexDirection: "row", alignItems: "center" }} wrap={false}>
          <View style={{ flex: 1, paddingRight: 16 }}>
            <Text style={{ fontSize: 8, letterSpacing: 1.6, color: acc, fontFamily: "Inter", fontWeight: 700, marginBottom: 6 }}>PRÓXIMO PASO</Text>
            <Text style={{ fontSize: 14, color: "#FFFFFF", fontFamily: "Inter", fontWeight: 700, marginBottom: 4 }}>¿Arrancamos?</Text>
            <Text style={{ fontSize: 9.5, color: "#AEB6BD" }}>
              Respondé este mensaje o agendá una llamada y en la primera semana te mostramos el prototipo con tus productos.
            </Text>
          </View>
          <View style={{ width: 190 }}>
            <Text style={{ fontSize: 10, color: "#FFFFFF", fontFamily: "Inter", fontWeight: 700 }}>{vendedor?.nombre}</Text>
            {vendedor?.rol ? <Text style={{ fontSize: 8.5, color: "#8A939B", marginBottom: 6 }}>{vendedor.rol} · {empresa.nombre}</Text> : null}
            {wa ? (
              <Link src={wa} style={{ fontSize: 9, color: acc, textDecoration: "none", marginBottom: 2 }}>
                WhatsApp {vendedor?.whatsapp || empresa.whatsapp}
              </Link>
            ) : null}
            {vendedor?.email || empresa.email ? (
              <Link src={`mailto:${vendedor?.email || empresa.email}`} style={{ fontSize: 9, color: "#D5DADF", textDecoration: "none", marginBottom: 2 }}>
                {vendedor?.email || empresa.email}
              </Link>
            ) : null}
            {empresa.calendly ? (
              <Link src={empresa.calendly} style={{ fontSize: 9, color: "#D5DADF", textDecoration: "none", marginBottom: 2 }}>
                Agendar una llamada
              </Link>
            ) : null}
            {empresa.web ? (
              <Link src={empresa.web.startsWith("http") ? empresa.web : `https://${empresa.web}`} style={{ fontSize: 9, color: "#D5DADF", textDecoration: "none" }}>
                {empresa.web}
              </Link>
            ) : null}
          </View>
        </View>
      </Page>
    </Document>
  );
}
