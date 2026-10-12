# Citriq · Generador de propuestas

App interna para armar propuestas comerciales en PDF en un par de minutos.

- **Nueva propuesta**: datos del prospecto, paquetes rápidos, servicios con precio editable, descuentos y PDF.
- **Historial**: todas las propuestas generadas, con estado (enviada / en negociación / ganada / perdida), tasa de cierre y abono mensual ganado.
- **Configuración**: servicios, precios, bot de GSL (markup o comisión), paquetes, vendedores, condiciones y color de marca.

El PDF se genera en el navegador. No necesita base de datos ni servidor.

## Correr local

```bash
npm install
npm run dev
# http://localhost:3000
```

## Subir a Vercel

1. Crear un repo nuevo en GitHub (ej. `citriq-propuestas`) y subir esta carpeta.
2. En vercel.com: Add New → Project → importar el repo. Vercel detecta Next.js solo; no hace falta configurar nada.
3. (Opcional) Asignar el dominio `propuestas.citriqs.com`: en Vercel, Settings → Domains; en Cloudflare, un registro CNAME `propuestas` → `cname.vercel-dns.com` (con el proxy en "DNS only").
4. (Recomendado) Proteger el acceso, porque la app muestra márgenes internos. En el plan Hobby, la forma simple es no compartir la URL. Para protegerla bien, agregar un middleware con usuario y contraseña (pedírselo a Claude).

## Importante: dónde se guardan los datos

Los precios y el historial se guardan en el **navegador** de cada uno (localStorage):

- Para usar los mismos precios: Configuración → **Exportar**, mandar el `.json` y en el otro navegador **Importar** → Guardar.
- El historial no se comparte entre Salvador y Vito, y se pierde si se borran los datos del navegador.
- Próximo paso si hace falta compartir: guardar config e historial en una Google Sheet o en Vercel KV.

## Estructura

```
app/                 páginas (/, /historial, /configuracion)
components/
  Generador.jsx      formulario de propuesta
  ProposalPDF.jsx    diseño del PDF (@react-pdf/renderer)
  Configuracion.jsx  pantalla de precios y servicios
  Historial.jsx      listado + KPIs
lib/
  defaults.js        valores iniciales (precios DE EJEMPLO)
  calc.js            precios, GSL, totales, formato
  store.js           localStorage
public/fonts/        Inter (embebida en el PDF)
```
