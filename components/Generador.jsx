"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { loadConfig, loadHistorial, nextNumero, upsertPropuesta } from "@/lib/store";
import { precioProducto, totales, fmt } from "@/lib/calc";
import { buildPdfBlob, nombreArchivo, descargar, abrir } from "@/lib/pdf";

const PROSPECTO_VACIO = { empresa: "", contacto: "", cargo: "", ciudad: "", diagnostico: "", objetivo: "" };

export default function Generador() {
  const [config, setConfig] = useState(null);
  const [prospecto, setProspecto] = useState(PROSPECTO_VACIO);
  const [vendedorId, setVendedorId] = useState("");
  const [sel, setSel] = useState({}); // { productoId: { setup, mensual } }
  const [descSetup, setDescSetup] = useState(0);
  const [descMensual, setDescMensual] = useState(0);
  const [notaExtra, setNotaExtra] = useState("");
  const [numero, setNumero] = useState(null);
  const [fecha, setFecha] = useState(() => new Date().toISOString());
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    const c = loadConfig();
    setConfig(c);
    setVendedorId(c.vendedores[0]?.id || "");
    // abrir una propuesta del historial: /?n=CQ-2026-001
    const n = new URLSearchParams(window.location.search).get("n");
    if (n) {
      const p = loadHistorial().find((x) => x.numero === n);
      if (p) {
        setProspecto({ ...PROSPECTO_VACIO, ...p.prospecto });
        setVendedorId(p.vendedorId || c.vendedores[0]?.id || "");
        setSel(p.sel || {});
        setDescSetup(p.descuentoSetupPct || 0);
        setDescMensual(p.descuentoMensualPct || 0);
        setNotaExtra(p.notaExtra || "");
        setNumero(p.numero);
        setFecha(p.fecha);
      }
    }
  }, []);

  const flash = (m) => {
    setToast(m);
    setTimeout(() => setToast(""), 2600);
  };

  const items = useMemo(() => {
    if (!config) return [];
    return config.productos.filter((p) => sel[p.id]).map((p) => ({ productoId: p.id, ...sel[p.id] }));
  }, [config, sel]);

  const t = useMemo(
    () => (config ? totales(items, config, descSetup, descMensual) : null),
    [items, config, descSetup, descMensual]
  );

  if (!config || !t) return <p className="muted">Cargando…</p>;

  const moneda = config.moneda;
  const vendedor = config.vendedores.find((v) => v.id === vendedorId) || config.vendedores[0];
  const setP = (k) => (e) => setProspecto((p) => ({ ...p, [k]: e.target.value }));

  function toggle(p) {
    setSel((s) => {
      const n = { ...s };
      if (n[p.id]) delete n[p.id];
      else n[p.id] = precioProducto(p);
      return n;
    });
  }
  function setPrecio(id, campo, v) {
    setSel((s) => ({ ...s, [id]: { ...s[id], [campo]: v === "" ? "" : Number(v) } }));
  }
  function aplicarPaquete(pk) {
    const n = {};
    pk.productos.forEach((id) => {
      const p = config.productos.find((x) => x.id === id);
      if (p) n[id] = precioProducto(p);
    });
    setSel(n);
    setDescSetup(Number(pk.descuentoPct) || 0);
    flash(`Paquete "${pk.nombre}" aplicado`);
  }
  function nueva() {
    setProspecto(PROSPECTO_VACIO);
    setSel({});
    setDescSetup(0);
    setDescMensual(0);
    setNotaExtra("");
    setNumero(null);
    setFecha(new Date().toISOString());
    window.history.replaceState(null, "", "/");
  }

  const faltan = [];
  if (!prospecto.empresa.trim()) faltan.push("el nombre de la empresa");
  if (!items.length) faltan.push("al menos un servicio");

  async function generar(modo) {
    if (faltan.length) return;
    setBusy(true);
    try {
      let num = numero;
      let commit = null;
      if (!num) {
        const r = nextNumero();
        num = r.numero;
        commit = r.commit;
      }
      const data = {
        config,
        prospecto,
        vendedor,
        t,
        numero: num,
        fecha,
        descuentoSetupPct: descSetup,
        descuentoMensualPct: descMensual,
        notaExtra: notaExtra.trim(),
      };
      const blob = await buildPdfBlob(data);
      if (modo === "ver") abrir(blob);
      else descargar(blob, nombreArchivo(data));

      commit && commit();
      const prev = loadHistorial().find((x) => x.numero === num);
      upsertPropuesta({
        numero: num,
        fecha,
        actualizada: new Date().toISOString(),
        prospecto,
        vendedorId: vendedor?.id,
        vendedorNombre: vendedor?.nombre,
        sel,
        descuentoSetupPct: descSetup,
        descuentoMensualPct: descMensual,
        notaExtra,
        totalSetup: t.totalSetup,
        totalMensual: t.totalMensual,
        moneda,
        servicios: t.lineas.map((l) => l.producto.nombre),
        estado: prev?.estado || "enviada",
        configSnapshot: config,
      });
      if (!numero) {
        setNumero(num);
        window.history.replaceState(null, "", `/?n=${num}`);
      }
      flash(modo === "ver" ? "PDF abierto en otra pestaña" : "PDF descargado y guardado en el historial");
    } catch (e) {
      console.error(e);
      flash("No se pudo generar el PDF. Revisá la consola.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="row" style={{ marginBottom: 18 }}>
        <div>
          <h1 className="page-title">{numero ? `Propuesta ${numero}` : "Nueva propuesta"}</h1>
          <p className="page-sub" style={{ margin: 0 }}>
            Cargá el prospecto, elegí servicios y descargá el PDF.
          </p>
        </div>
        <div className="spacer" />
        {numero ? (
          <button className="btn ghost" onClick={nueva}>+ Empezar otra</button>
        ) : null}
      </div>

      {config.preciosDeEjemplo ? (
        <div className="banner">
          <span>Estás usando precios de ejemplo. Cargá los reales antes de mandar una propuesta.</span>
          <Link href="/configuracion">Ir a Configuración →</Link>
        </div>
      ) : null}

      <div className="grid">
        <div>
          <section className="panel">
            <h3>Prospecto</h3>
            <div className="fields">
              <label className="f">
                Empresa *
                <input className="in" value={prospecto.empresa} onChange={setP("empresa")} placeholder="Ej: Pisos del Norte" />
              </label>
              <label className="f">
                Ciudad / zona
                <input className="in" value={prospecto.ciudad} onChange={setP("ciudad")} placeholder="Ej: San Isidro" />
              </label>
              <label className="f">
                Contacto
                <input className="in" value={prospecto.contacto} onChange={setP("contacto")} placeholder="Nombre y apellido" />
              </label>
              <label className="f">
                Cargo
                <input className="in" value={prospecto.cargo} onChange={setP("cargo")} placeholder="Ej: Dueño" />
              </label>
              <label className="f full">
                Situación actual <span className="muted">(lo que vieron en la reunión; sale en el PDF)</span>
                <textarea
                  className="in"
                  value={prospecto.diagnostico}
                  onChange={setP("diagnostico")}
                  placeholder="Ej: Reciben consultas por Instagram pero sin precios ni forma de mostrar cómo queda el piso; pierden tiempo con consultas que no compran."
                />
              </label>
              <label className="f full">
                Objetivo <span className="muted">(qué quiere lograr el cliente)</span>
                <textarea
                  className="in"
                  value={prospecto.objetivo}
                  onChange={setP("objetivo")}
                  placeholder="Ej: Que la web genere consultas calificadas y el cliente llegue al showroom ya decidido."
                />
              </label>
              <label className="f">
                Preparada por
                <select className="in" value={vendedorId} onChange={(e) => setVendedorId(e.target.value)}>
                  {config.vendedores.map((v) => (
                    <option key={v.id} value={v.id}>{v.nombre}</option>
                  ))}
                </select>
              </label>
              <label className="f">
                Fecha
                <input
                  className="in"
                  type="date"
                  value={fecha.slice(0, 10)}
                  onChange={(e) => e.target.value && setFecha(new Date(e.target.value + "T12:00:00").toISOString())}
                />
              </label>
            </div>
          </section>

          <section className="panel">
            <h3>Servicios</h3>
            {config.paquetes?.length ? (
              <div style={{ marginBottom: 14 }}>
                <div className="small muted" style={{ marginBottom: 8 }}>Paquetes rápidos</div>
                <div className="chips">
                  {config.paquetes.map((pk) => (
                    <button key={pk.id} className="chip" onClick={() => aplicarPaquete(pk)}>
                      {pk.nombre}
                      {Number(pk.descuentoPct) > 0 ? <small>−{pk.descuentoPct}%</small> : null}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {config.productos.map((p) => {
              const on = !!sel[p.id];
              const base = precioProducto(p);
              return (
                <div key={p.id} className={`prod ${on ? "on" : ""}`}>
                  <label className="prod-head">
                    <input type="checkbox" checked={on} onChange={() => toggle(p)} />
                    <div style={{ flex: 1 }}>
                      <div className="prod-name">
                        {p.nombre}
                        {p.tipo === "gsl" ? <span className="prod-tag">GSL</span> : null}
                      </div>
                      <div className="prod-desc">{p.descripcion}</div>
                    </div>
                    <div className="small muted" style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                      {fmt(base.setup, moneda)}
                      <br />+ {fmt(base.mensual, moneda)}/mes
                    </div>
                  </label>
                  {on ? (
                    <div className="prod-prices">
                      <label className="f">
                        Implementación ({moneda})
                        <input
                          className="in num"
                          type="number"
                          min="0"
                          value={sel[p.id].setup}
                          onChange={(e) => setPrecio(p.id, "setup", e.target.value)}
                        />
                      </label>
                      <label className="f">
                        Mensual ({moneda})
                        <input
                          className="in num"
                          type="number"
                          min="0"
                          value={sel[p.id].mensual}
                          onChange={(e) => setPrecio(p.id, "mensual", e.target.value)}
                        />
                      </label>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </section>

          <section className="panel">
            <h3>Bonificación y notas</h3>
            <div className="fields">
              <label className="f">
                Descuento en implementación (%)
                <input className="in num" type="number" min="0" max="100" value={descSetup} onChange={(e) => setDescSetup(e.target.value === "" ? 0 : Number(e.target.value))} />
              </label>
              <label className="f">
                Descuento en abono mensual (%)
                <input className="in num" type="number" min="0" max="100" value={descMensual} onChange={(e) => setDescMensual(e.target.value === "" ? 0 : Number(e.target.value))} />
              </label>
              <label className="f full">
                Condición especial <span className="muted">(opcional, se suma a las condiciones)</span>
                <input className="in" value={notaExtra} onChange={(e) => setNotaExtra(e.target.value)} placeholder="Ej: Primer mes de abono bonificado si se firma antes del viernes." />
              </label>
            </div>
          </section>
        </div>

        <aside className="sticky">
          <section className="panel">
            <h3>Resumen</h3>
            {t.lineas.length ? (
              t.lineas.map((l) => (
                <div className="sum-row" key={l.producto.id}>
                  <span>{l.producto.nombre}</span>
                  <span>{fmt(l.setup, moneda)}</span>
                </div>
              ))
            ) : (
              <p className="muted small" style={{ margin: 0 }}>Elegí servicios o un paquete.</p>
            )}
            {t.descSetup > 0 || t.descMensual > 0 ? (
              <div className="sum-row">
                <span>Bonificación</span>
                <span>− {fmt(t.descSetup + t.descMensual, moneda)}</span>
              </div>
            ) : null}

            <div className="sum-big">
              <div>
                <small>Implementación</small>
                <b>{fmt(t.totalSetup, moneda)}</b>
              </div>
              <div className="acc">
                <small>Mensual</small>
                <b>{fmt(t.totalMensual, moneda)}</b>
              </div>
            </div>

            {t.lineas.length ? (
              <div className="internal">
                <div className="t">Interno · no sale en el PDF</div>
                <div className="sum-row"><span>Nos queda (implementación)</span><span>{fmt(t.ganSetup, moneda)}</span></div>
                <div className="sum-row"><span>Nos queda (mensual)</span><span>{fmt(t.ganMensual, moneda)}</span></div>
                <div className="sum-row"><span>Valor primer año</span><span>{fmt(t.totalSetup + t.totalMensual * 12, moneda)}</span></div>
              </div>
            ) : null}

            <div className="actions">
              <button className="btn primary block" disabled={busy || faltan.length > 0} onClick={() => generar("descargar")}>
                {busy ? "Generando…" : "Descargar PDF"}
              </button>
              <button className="btn block" disabled={busy || faltan.length > 0} onClick={() => generar("ver")}>
                Vista previa
              </button>
              {faltan.length ? <p className="small muted" style={{ margin: 0 }}>Falta {faltan.join(" y ")}.</p> : null}
            </div>
          </section>
        </aside>
      </div>
      {toast ? <div className="toast">{toast}</div> : null}
    </>
  );
}
