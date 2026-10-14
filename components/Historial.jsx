"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { loadHistorial, saveHistorial } from "@/lib/store";
import { totales, fmt } from "@/lib/calc";
import { buildPdfBlob, nombreArchivo, descargar } from "@/lib/pdf";

const ESTADOS = [
  { v: "enviada", l: "Enviada" },
  { v: "negociacion", l: "En negociación" },
  { v: "ganada", l: "Ganada" },
  { v: "perdida", l: "Perdida" },
];

export default function Historial() {
  const [h, setH] = useState(null);
  const [filtro, setFiltro] = useState("todas");
  const [q, setQ] = useState("");

  useEffect(() => setH(loadHistorial()), []);

  const lista = useMemo(() => {
    if (!h) return [];
    return h.filter(
      (p) =>
        (filtro === "todas" || p.estado === filtro) &&
        (!q.trim() || `${p.prospecto?.empresa} ${p.numero} ${p.vendedorNombre}`.toLowerCase().includes(q.toLowerCase()))
    );
  }, [h, filtro, q]);

  if (!h) return <p className="muted">Cargando…</p>;

  function setEstado(numero, estado) {
    const n = h.map((p) => (p.numero === numero ? { ...p, estado } : p));
    setH(n);
    saveHistorial(n);
  }
  function eliminar(numero) {
    if (!window.confirm(`¿Eliminar la propuesta ${numero} del historial?`)) return;
    const n = h.filter((p) => p.numero !== numero);
    setH(n);
    saveHistorial(n);
  }
  async function bajar(p) {
    const config = p.configSnapshot;
    const items = Object.entries(p.sel || {}).map(([productoId, v]) => ({ productoId, ...v }));
    const ordered = config.productos.filter((x) => p.sel?.[x.id]).map((x) => items.find((i) => i.productoId === x.id));
    const t = totales(ordered, config, p.descuentoSetupPct, p.descuentoMensualPct);
    const vendedor = config.vendedores.find((v) => v.id === p.vendedorId) || config.vendedores[0];
    const data = {
      config, prospecto: p.prospecto, vendedor, t, numero: p.numero, fecha: p.fecha,
      descuentoSetupPct: p.descuentoSetupPct, descuentoMensualPct: p.descuentoMensualPct, notaExtra: (p.notaExtra || "").trim(),
    };
    descargar(await buildPdfBlob(data), nombreArchivo(data));
  }

  // KPIs (sumas en la moneda de cada propuesta; si mezclan monedas, se separan)
  const monedas = [...new Set(h.map((p) => p.moneda))];
  const m = monedas.length === 1 ? monedas[0] : null;
  const ganadas = h.filter((p) => p.estado === "ganada");
  const cerradas = h.filter((p) => p.estado === "ganada" || p.estado === "perdida");
  const abiertas = h.filter((p) => p.estado === "enviada" || p.estado === "negociacion");
  const tasa = cerradas.length ? Math.round((ganadas.length / cerradas.length) * 100) : null;
  const sum = (arr, k) => arr.reduce((a, p) => a + (Number(p[k]) || 0), 0);

  return (
    <>
      <h1 className="page-title">Historial</h1>
      <p className="page-sub">Todas las propuestas generadas en este navegador. Marcá el estado para seguir el cierre.</p>

      <div className="kpis">
        <div className="kpi"><small>Propuestas</small><b>{h.length}</b></div>
        <div className="kpi"><small>Abiertas</small><b>{abiertas.length}</b>{m ? <span className="small muted">{fmt(sum(abiertas, "totalSetup"), m)} en juego</span> : null}</div>
        <div className="kpi"><small>Tasa de cierre</small><b>{tasa === null ? "—" : `${tasa}%`}</b><span className="small muted">{ganadas.length} ganadas de {cerradas.length} cerradas</span></div>
        <div className="kpi"><small>Abono mensual ganado</small><b>{m ? fmt(sum(ganadas, "totalMensual"), m) : "—"}</b>{m ? <span className="small muted">{fmt(sum(ganadas, "totalSetup"), m)} en implementaciones</span> : <span className="small muted">Monedas mezcladas</span>}</div>
      </div>

      <section className="panel">
        <div className="row" style={{ marginBottom: 12 }}>
          <input className="in" style={{ maxWidth: 280 }} placeholder="Buscar empresa, número o vendedor" value={q} onChange={(e) => setQ(e.target.value)} />
          <select className="in" style={{ maxWidth: 200 }} value={filtro} onChange={(e) => setFiltro(e.target.value)}>
            <option value="todas">Todos los estados</option>
            {ESTADOS.map((e) => <option key={e.v} value={e.v}>{e.l}</option>)}
          </select>
          <div className="spacer" />
          <Link href="/" className="btn primary sm">+ Nueva propuesta</Link>
        </div>

        {lista.length === 0 ? (
          <div className="empty">{h.length ? "No hay propuestas con ese filtro." : "Todavía no generaste propuestas."}</div>
        ) : (
          <div className="table-wrap">
            <table className="t">
              <thead>
                <tr>
                  <th>N°</th><th>Empresa</th><th>Servicios</th><th>Vendedor</th><th>Fecha</th>
                  <th style={{ textAlign: "right" }}>Implementación</th><th style={{ textAlign: "right" }}>Mensual</th><th>Estado</th><th />
                </tr>
              </thead>
              <tbody>
                {lista.map((p) => (
                  <tr key={p.numero}>
                    <td className="muted" style={{ whiteSpace: "nowrap" }}>{p.numero}</td>
                    <td><b>{p.prospecto?.empresa}</b>{p.prospecto?.contacto ? <div className="small muted">{p.prospecto.contacto}</div> : null}</td>
                    <td className="small muted" style={{ maxWidth: 220 }}>{(p.servicios || []).join(", ")}</td>
                    <td className="small">{p.vendedorNombre?.split(" ")[0]}</td>
                    <td className="small muted" style={{ whiteSpace: "nowrap" }}>{new Date(p.fecha).toLocaleDateString("es-AR")}</td>
                    <td className="n">{fmt(p.totalSetup, p.moneda)}</td>
                    <td className="n">{fmt(p.totalMensual, p.moneda)}</td>
                    <td>
                      <select className="estado" data-v={p.estado} value={p.estado} onChange={(e) => setEstado(p.numero, e.target.value)}>
                        {ESTADOS.map((e) => <option key={e.v} value={e.v}>{e.l}</option>)}
                      </select>
                    </td>
                    <td style={{ whiteSpace: "nowrap" }}>
                      <button className="btn sm ghost" onClick={() => bajar(p)} title="Descargar el PDF tal como se envió">PDF</button>{" "}
                      <Link className="btn sm ghost" href={`/?n=${encodeURIComponent(p.numero)}`}>Editar</Link>{" "}
                      <button className="btn danger" onClick={() => eliminar(p.numero)} title="Eliminar">✕</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
