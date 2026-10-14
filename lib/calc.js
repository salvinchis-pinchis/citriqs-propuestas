// Cálculos de precios y totales. Sin dependencias de navegador (sirve en el PDF también).

const round = (n) => Math.round((Number(n) || 0) * 100) / 100;

// Precio al cliente de un producto (resuelve el caso del bot de GSL)
export function precioProducto(p) {
  if (p.tipo === "gsl" && p.gsl) {
    const g = p.gsl;
    if (g.modo === "comision") {
      return { setup: round(g.precioListaSetup), mensual: round(g.precioListaMensual) };
    }
    const k = 1 + (Number(g.markupPct) || 0) / 100;
    return { setup: round(g.costoSetup * k), mensual: round(g.costoMensual * k) };
  }
  return { setup: round(p.setup), mensual: round(p.mensual) };
}

// Lo que nos queda a nosotros (solo interno)
export function gananciaProducto(p, setup, mensual) {
  if (p.tipo !== "gsl" || !p.gsl) return { setup, mensual };
  const g = p.gsl;
  if (g.modo === "comision") {
    const c = (Number(g.comisionPct) || 0) / 100;
    return { setup: round(setup * c), mensual: round(mensual * c) };
  }
  return { setup: round(setup - g.costoSetup), mensual: round(mensual - g.costoMensual) };
}

// items: [{ productoId, setup, mensual }] con precios ya resueltos (pueden venir editados)
export function totales(items, config, descuentoSetupPct = 0, descuentoMensualPct = 0) {
  const lineas = items
    .map((it) => {
      const p = config.productos.find((x) => x.id === it.productoId);
      if (!p) return null;
      const setup = round(it.setup);
      const mensual = round(it.mensual);
      return { producto: p, setup, mensual, ganancia: gananciaProducto(p, setup, mensual) };
    })
    .filter(Boolean);

  const subSetup = round(lineas.reduce((a, l) => a + l.setup, 0));
  const subMensual = round(lineas.reduce((a, l) => a + l.mensual, 0));
  const descSetup = round(subSetup * (Number(descuentoSetupPct) || 0) / 100);
  const descMensual = round(subMensual * (Number(descuentoMensualPct) || 0) / 100);
  const totalSetup = round(subSetup - descSetup);
  const totalMensual = round(subMensual - descMensual);

  const ganSetup = round(lineas.reduce((a, l) => a + l.ganancia.setup, 0) - descSetup);
  const ganMensual = round(lineas.reduce((a, l) => a + l.ganancia.mensual, 0) - descMensual);

  return { lineas, subSetup, subMensual, descSetup, descMensual, totalSetup, totalMensual, ganSetup, ganMensual };
}

export function fmt(n, moneda = "USD") {
  const v = Number(n) || 0;
  const s = new Intl.NumberFormat("es-AR", { maximumFractionDigits: v % 1 ? 2 : 0 }).format(v);
  return moneda === "ARS" ? `$ ${s}` : `${moneda} ${s}`;
}

export function fechaLarga(d = new Date()) {
  return new Intl.DateTimeFormat("es-AR", { day: "numeric", month: "long", year: "numeric" }).format(d);
}

export function sumarDias(d, dias) {
  const x = new Date(d);
  x.setDate(x.getDate() + Number(dias || 0));
  return x;
}
