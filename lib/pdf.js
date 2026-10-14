"use client";
// Genera el PDF en el navegador (no necesita servidor).

export async function buildPdfBlob(data) {
  const [{ pdf }, { default: ProposalPDF }, React] = await Promise.all([
    import("@react-pdf/renderer"),
    import("@/components/ProposalPDF"),
    import("react"),
  ]);
  return pdf(React.createElement(ProposalPDF, { data })).toBlob();
}

export function nombreArchivo(data) {
  const limpio = (s) =>
    String(s || "")
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-zA-Z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  return `Propuesta-${limpio(data.config.empresa.nombre)}-${limpio(data.prospecto.empresa) || "cliente"}-${data.numero}.pdf`;
}

export function descargar(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

export function abrir(blob) {
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank", "noopener");
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}
