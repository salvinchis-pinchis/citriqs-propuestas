"use client";
import { useEffect, useRef, useState } from "react";
import { loadConfig, saveConfig, resetConfig } from "@/lib/store";
import { precioProducto, gananciaProducto, fmt } from "@/lib/calc";

const uid = () => Math.random().toString(36).slice(2, 9);
const num = (v) => (v === "" ? "" : Number(v));

export default function Configuracion() {
  const [c, setC] = useState(null);
  const [dirty, setDirty] = useState(false);
  const [toast, setToast] = useState("");
  const fileRef = useRef(null);

  useEffect(() => setC(loadConfig()), []);
  useEffect(() => {
    const h = (e) => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [dirty]);

  if (!c) return <p className="muted">Cargando…</p>;

  const flash = (m) => {
    setToast(m);
    setTimeout(() => setToast(""), 2600);
  };
  const upd = (fn) => {
    setC((prev) => {
      const n = structuredClone(prev);
      fn(n);
      return n;
    });
    setDirty(true);
  };

  function guardar() {
    const n = { ...c, preciosDeEjemplo: false };
    if (saveConfig(n)) {
      setC(n);
      setDirty(false);
      flash("Configuración guardada");
    } else flash("No se pudo guardar en este navegador");
  }
  function exportar() {
    const blob = new Blob([JSON.stringify(c, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `citriq-config-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 3000);
  }
  function importar(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => {
      try {
        const data = JSON.parse(String(r.result));
        if (!Array.isArray(data.productos) || !data.empresa) throw new Error("formato");
        setC(data);
        setDirty(true);
        flash("Importado. Revisá y tocá Guardar.");
      } catch {
        flash("El archivo no es una configuración válida");
      }
    };
    r.readAsText(f);
    e.target.value = "";
  }
  function restaurar() {
    if (!window.confirm("¿Volver a los valores de ejemplo? Se pierden los cambios guardados.")) return;
    setC(resetConfig());
    setDirty(false);
    flash("Valores de ejemplo restaurados");
  }

  const E = (k) => ({ value: c.empresa[k] ?? "", onChange: (e) => upd((n) => (n.empresa[k] = e.target.value)) });

  return (
    <>
      <div className="row" style={{ marginBottom: 18 }}>
        <div>
          <h1 className="page-title">Configuración</h1>
          <p className="page-sub" style={{ margin: 0 }}>Precios, servicios y datos que salen en cada propuesta.</p>
        </div>
        <div className="spacer" />
        <button className="btn ghost sm" onClick={exportar}>Exportar</button>
        <button className="btn ghost sm" onClick={() => fileRef.current?.click()}>Importar</button>
        <input ref={fileRef} type="file" accept="application/json" hidden onChange={importar} />
        <button className="btn primary" onClick={guardar} disabled={!dirty}>
          {dirty ? "Guardar cambios" : "Guardado"}
        </button>
      </div>

      <div className="banner" style={{ borderColor: "#2a3a4a", background: "#0f1820", color: "#a9c6e0" }}>
        <span>
          La configuración se guarda en este navegador. Para que Vito y vos usen los mismos precios: Exportar acá → mandar el archivo → Importar en el otro navegador.
        </span>
      </div>

      <section className="panel">
        <h3>Empresa</h3>
        <div className="fields">
          <label className="f">Nombre<input className="in" {...E("nombre")} /></label>
          <label className="f">Bajada<input className="in" {...E("tagline")} /></label>
          <label className="f">Web<input className="in" {...E("web")} /></label>
          <label className="f">Email<input className="in" {...E("email")} placeholder="hola@citriqs.com" /></label>
          <label className="f">WhatsApp general<input className="in" {...E("whatsapp")} /></label>
          <label className="f">Link para agendar (Calendly)<input className="in" {...E("calendly")} /></label>
          <label className="f">
            Color de acento
            <div className="row">
              <input type="color" value={c.empresa.colorAcento} onChange={(e) => upd((n) => (n.empresa.colorAcento = e.target.value))} style={{ width: 44, height: 36, border: 0, background: "none", padding: 0 }} />
              <input className="in" style={{ flex: 1 }} {...E("colorAcento")} />
            </div>
          </label>
          <label className="f">
            Moneda
            <select className="in" value={c.moneda} onChange={(e) => upd((n) => (n.moneda = e.target.value))}>
              <option value="USD">USD (dólares)</option>
              <option value="ARS">ARS (pesos)</option>
            </select>
          </label>
          <label className="f">
            Validez de la propuesta (días)
            <input className="in num" type="number" min="1" value={c.validezDias} onChange={(e) => upd((n) => (n.validezDias = num(e.target.value)))} />
          </label>
          <label className="f">
            Nota de impuestos
            <input className="in" value={c.notaImpuestos} onChange={(e) => upd((n) => (n.notaImpuestos = e.target.value))} />
          </label>
        </div>
      </section>

      <section className="panel">
        <h3>
          Vendedores
          <button className="btn sm" onClick={() => upd((n) => n.vendedores.push({ id: uid(), nombre: "", rol: "", whatsapp: "", email: "" }))}>+ Agregar</button>
        </h3>
        {c.vendedores.map((v, i) => (
          <div key={v.id} className="fields g-vend">
            <label className="f">Nombre<input className="in" value={v.nombre} onChange={(e) => upd((n) => (n.vendedores[i].nombre = e.target.value))} /></label>
            <label className="f">Rol<input className="in" value={v.rol} onChange={(e) => upd((n) => (n.vendedores[i].rol = e.target.value))} /></label>
            <label className="f">WhatsApp<input className="in" value={v.whatsapp} onChange={(e) => upd((n) => (n.vendedores[i].whatsapp = e.target.value))} /></label>
            <label className="f">Email<input className="in" value={v.email} onChange={(e) => upd((n) => (n.vendedores[i].email = e.target.value))} /></label>
            <button className="btn danger" disabled={c.vendedores.length < 2} onClick={() => upd((n) => n.vendedores.splice(i, 1))} title="Quitar">✕</button>
          </div>
        ))}
      </section>

      <section className="panel">
        <h3>
          Servicios y precios
          <button
            className="btn sm"
            onClick={() =>
              upd((n) =>
                n.productos.push({ id: uid(), nombre: "Nuevo servicio", descripcion: "", incluye: [], setup: 0, mensual: 0, etiquetaMensual: "", tipo: "propio" })
              )
            }
          >
            + Agregar servicio
          </button>
        </h3>
        {c.productos.map((p, i) => {
          const P = (k) => ({ value: p[k] ?? "", onChange: (e) => upd((n) => (n.productos[i][k] = e.target.value)) });
          const G = (k, isNum = true) => ({
            value: p.gsl?.[k] ?? "",
            onChange: (e) => upd((n) => (n.productos[i].gsl[k] = isNum ? num(e.target.value) : e.target.value)),
          });
          const precio = precioProducto(p);
          const gan = gananciaProducto(p, precio.setup, precio.mensual);
          return (
            <div key={p.id} className="cfg-prod">
              <div className="head">
                <b>
                  {p.nombre || "Sin nombre"} {p.tipo === "gsl" ? <span className="prod-tag">GSL</span> : null}
                </b>
                <div className="row">
                  <button className="btn sm ghost" disabled={i === 0} onClick={() => upd((n) => n.productos.splice(i - 1, 0, n.productos.splice(i, 1)[0]))}>↑</button>
                  <button className="btn sm ghost" disabled={i === c.productos.length - 1} onClick={() => upd((n) => n.productos.splice(i + 1, 0, n.productos.splice(i, 1)[0]))}>↓</button>
                  <button
                    className="btn danger"
                    onClick={() => {
                      if (window.confirm(`¿Eliminar "${p.nombre}"?`))
                        upd((n) => {
                          n.productos.splice(i, 1);
                          n.paquetes.forEach((pk) => (pk.productos = pk.productos.filter((x) => x !== p.id)));
                        });
                    }}
                  >
                    Eliminar
                  </button>
                </div>
              </div>
              <div className="fields">
                <label className="f">Nombre (sale en el PDF)<input className="in" {...P("nombre")} /></label>
                <label className="f">Qué cubre el abono mensual<input className="in" {...P("etiquetaMensual")} placeholder="Ej: Hosting y soporte" /></label>
                <label className="f full">Descripción<textarea className="in" rows={2} {...P("descripcion")} /></label>
                <label className="f full">
                  Qué incluye (uno por línea)
                  <textarea
                    className="in"
                    rows={4}
                    value={(p.incluye || []).join("\n")}
                    onChange={(e) => upd((n) => (n.productos[i].incluye = e.target.value.split("\n")))}
                  />
                </label>

                {p.tipo === "gsl" ? (
                  <>
                    <label className="f">
                      Cómo lo cobramos
                      <select className="in" {...G("modo", false)}>
                        <option value="markup">Markup sobre el costo de GSL</option>
                        <option value="comision">Precio de lista de GSL + comisión</option>
                      </select>
                    </label>
                    <div />
                    {p.gsl.modo === "comision" ? (
                      <>
                        <label className="f">Precio de lista · implementación ({c.moneda})<input className="in num" type="number" min="0" {...G("precioListaSetup")} /></label>
                        <label className="f">Precio de lista · mensual ({c.moneda})<input className="in num" type="number" min="0" {...G("precioListaMensual")} /></label>
                        <label className="f">Nuestra comisión (%)<input className="in num" type="number" min="0" max="100" {...G("comisionPct")} /></label>
                      </>
                    ) : (
                      <>
                        <label className="f">Costo GSL · implementación ({c.moneda})<input className="in num" type="number" min="0" {...G("costoSetup")} /></label>
                        <label className="f">Costo GSL · mensual ({c.moneda})<input className="in num" type="number" min="0" {...G("costoMensual")} /></label>
                        <label className="f">Markup (%)<input className="in num" type="number" min="0" {...G("markupPct")} /></label>
                      </>
                    )}
                    <div className="calc full">
                      Precio al cliente: <b>{fmt(precio.setup, c.moneda)}</b> + <b>{fmt(precio.mensual, c.moneda)}/mes</b> · Nos queda:{" "}
                      <b>{fmt(gan.setup, c.moneda)}</b> + <b>{fmt(gan.mensual, c.moneda)}/mes</b>. El nombre GSL no aparece en el PDF.
                    </div>
                  </>
                ) : (
                  <>
                    <label className="f">Implementación ({c.moneda})<input className="in num" type="number" min="0" value={p.setup} onChange={(e) => upd((n) => (n.productos[i].setup = num(e.target.value)))} /></label>
                    <label className="f">Mensual ({c.moneda})<input className="in num" type="number" min="0" value={p.mensual} onChange={(e) => upd((n) => (n.productos[i].mensual = num(e.target.value)))} /></label>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </section>

      <section className="panel">
        <h3>
          Paquetes
          <button className="btn sm" onClick={() => upd((n) => n.paquetes.push({ id: uid(), nombre: "Nuevo paquete", productos: [], descuentoPct: 0 }))}>+ Agregar paquete</button>
        </h3>
        {c.paquetes.map((pk, i) => (
          <div key={pk.id} className="cfg-prod">
            <div className="fields g-paq">
              <label className="f">Nombre<input className="in" value={pk.nombre} onChange={(e) => upd((n) => (n.paquetes[i].nombre = e.target.value))} /></label>
              <label className="f">Descuento en implementación (%)<input className="in num" type="number" min="0" max="100" value={pk.descuentoPct} onChange={(e) => upd((n) => (n.paquetes[i].descuentoPct = num(e.target.value)))} /></label>
              <button className="btn danger" onClick={() => upd((n) => n.paquetes.splice(i, 1))}>Eliminar</button>
            </div>
            <div className="chips" style={{ marginTop: 10 }}>
              {c.productos.map((p) => {
                const on = pk.productos.includes(p.id);
                return (
                  <label key={p.id} className="chip" style={on ? { borderColor: "var(--acc)" } : null}>
                    <input
                      type="checkbox"
                      checked={on}
                      style={{ accentColor: "var(--acc)", marginRight: 6 }}
                      onChange={() =>
                        upd((n) => {
                          const arr = n.paquetes[i].productos;
                          n.paquetes[i].productos = on ? arr.filter((x) => x !== p.id) : [...arr, p.id];
                        })
                      }
                    />
                    {p.nombre}
                  </label>
                );
              })}
            </div>
          </div>
        ))}
      </section>

      <section className="panel">
        <h3>Cómo trabajamos (sale en el PDF)</h3>
        {c.proceso.map((st, i) => (
          <div key={i} className="fields g-step">
            <label className="f">Etapa {i + 1}<input className="in" value={st.titulo} onChange={(e) => upd((n) => (n.proceso[i].titulo = e.target.value))} /></label>
            <label className="f">Descripción<input className="in" value={st.texto} onChange={(e) => upd((n) => (n.proceso[i].texto = e.target.value))} /></label>
            <button className="btn danger" onClick={() => upd((n) => n.proceso.splice(i, 1))}>✕</button>
          </div>
        ))}
        {c.proceso.length < 5 ? (
          <button className="btn sm" onClick={() => upd((n) => n.proceso.push({ titulo: "", texto: "" }))}>+ Agregar etapa</button>
        ) : null}
      </section>

      <section className="panel">
        <h3>Condiciones comerciales (una por línea)</h3>
        <textarea className="in" rows={6} value={c.condiciones.join("\n")} onChange={(e) => upd((n) => (n.condiciones = e.target.value.split("\n")))} />
      </section>

      <div className="row">
        <button className="btn ghost sm" onClick={restaurar}>Restaurar valores de ejemplo</button>
        <div className="spacer" />
        <button className="btn primary" onClick={guardar} disabled={!dirty}>{dirty ? "Guardar cambios" : "Guardado"}</button>
      </div>
      {toast ? <div className="toast">{toast}</div> : null}
    </>
  );
}
