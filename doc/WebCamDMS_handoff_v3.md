# WebCam DMS — Handoff v3.0
_Generado: Mayo 2026_

---

## Estado del proyecto

**App:** WebCam DMS  
**Versión:** v3.0  
**Stack:** GitHub Pages (SPA/PWA) + Google Apps Script + Google Sheets  
**Sheet ID:** `1wiYKs_ORUxC-IiMkFiGbv5e0_Ggo4qDPf-I662E-e8A`  
**Hojas:** `Señalización` (WebRTC) · `Config` (token) · `Log` (trazabilidad)

---

## Archivos entregados

| Archivo | Descripción |
|---|---|
| `index_webcam_v3.html` | SPA principal — renombrar a `index.html` al subir |
| `gas_webcam_v2.gs` | GAS backend — sin cambios respecto a v2, no requiere redespliegue |
| `sw_v1.js` / `sw_v2.js` | Service Worker PWA — sin cambios |
| `manifest.json` | Manifiesto PWA — sin cambios |

> **Nota:** El GAS no fue modificado en esta iteración. Si ya estaba desplegado como Web App en v2, no es necesario redesplegar.

---

## Novedades v3 vs v2

| Feature | v2 | v3 |
|---|---|---|
| Tipografía | Syne (display) | DM Sans + DM Mono (igual que Alertar) |
| Fondo de app | Blanco `#ffffff` | `#F5F4F0` cálido (igual que Alertar) |
| Iconos | Mix de emojis + SVG | 100% SVG stroke minimalistas |
| Toggle cámara | ❌ | ✅ Botón flotante frontal/trasera sin cortar WebRTC |
| Aviso background transmisor | ❌ | ✅ Banner naranja si app se minimiza |
| Aviso pausa visor | ❌ | ✅ Banner naranja si conexión se pierde |
| Icono fullscreen | Carácter Unicode `⛶` | SVG expand/compress que swapea al entrar/salir |

---

## Toggle de cámara — cómo funciona

```
Usuario toca botón de cámara (ícono flotante sobre el video)
        ↓
flipCamera() — alterna facingMode: 'environment' ↔ 'user'
        ↓
Detiene tracks actuales del stream
        ↓
getUserMedia({ facingMode: nuevo })
        ↓
Si hay PeerConnection activa:
  → sender.replaceTrack(newTrack)   ← no corta la sesión WebRTC
        ↓
Actualiza localVideo.srcObject
Toast: "Cámara frontal" / "Cámara trasera"
```

**Comportamiento:** el botón aparece cuando la transmisión está activa (estado `waiting` o `connected`). Arranca en cámara trasera (`environment`). Al detener la transmisión, se resetea a trasera para la próxima sesión.

---

## visibilitychange — comportamiento

### Transmisor
- Al minimizar la app → banner naranja: _"App en segundo plano — la transmisión puede interrumpirse. Mantené la pantalla activa."_
- Al volver al frente → banner desaparece.
- El stream puede pausarse o cortarse según el SO/navegador (comportamiento nativo de Android, no controlable desde JS).

### Visor
- Si la conexión WebRTC pasa a `disconnected` o `failed` → banner naranja: _"El transmisor minimizó la app — el video puede estar pausado."_
- Si la conexión se recupera (`connected`) → banner desaparece.
- El evento `visibilitychange` en el visor limpia el banner cuando el visor vuelve al frente y la conexión está bien.

---

## Arquitectura (sin cambios)

```
Usuario abre URL con ?token=XXXX
        ↓
initAuth() → gas({ action: 'validateToken', token })
        ↓
GAS: lee hoja Config → compara token
        ↓
{ ok: true }  →  muestra la app
{ ok: false } →  pantalla de bloqueo (fondo oscuro)
```

**Señalización WebRTC:** polling cada 1500ms a GAS · Sheets como broker de offer/answer/candidates · Se detiene el polling al conectar.

---

## Estructura de deploy

```
/
├── index.html          ← (era index_webcam_v3.html)
├── manifest.json
├── sw_v2.js
└── icons/
    ├── icon-192.png
    └── icon-512.png
```

---

## URL de acceso

```
https://TU_SITE.github.io/webcam/?token=TU_TOKEN
```

Con sala precargada (desde QR):
```
https://TU_SITE.github.io/webcam/?token=TU_TOKEN&sala=XXXX
```

---

## Pendientes / próximas iteraciones

- [ ] Iconos PWA reales (192 y 512px) — fondo `#5B21B6`
- [ ] Audio en la transmisión (toggle micrófono)
- [ ] Fullscreen automático al conectar (toggle en Config)
- [ ] Indicador de calidad de señal WebRTC (RTCPeerConnection stats API)
- [ ] Múltiples tokens (una fila por usuario en hoja `Tokens`)
- [ ] Modo oscuro
- [ ] Reconexión automática si el transmisor vuelve al frente

---

## Prompt de continuación

```
Estamos desarrollando WebCam DMS v3.0 — PWA para transmisión de cámara
en red local vía WebRTC + GAS como señalizador + token de acceso.

Stack: GitHub Pages + GAS + Google Sheets
Sheet ID: 1wiYKs_ORUxC-IiMkFiGbv5e0_Ggo4qDPf-I662E-e8A
Hojas: Señalización | Config (token) | Log
Paleta: violeta oscuro #5B21B6, fondo #F5F4F0, tipografía DM Sans + DM Mono

Archivos actuales:
- index_webcam_v3.html (SPA, WebRTC, PWA, token auth, fullscreen SVG,
  toggle cámara frontal/trasera sin cortar WebRTC, visibilitychange warnings)
- gas_webcam_v2.gs (validateToken, Log_GAS, menú gestionarToken) — sin cambios

Estado: v3 generada, pendiente deploy.

[Describir aquí qué querés continuar o ajustar]
```
