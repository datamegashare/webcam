// ============================================================
//  WebCam DMS — GAS Señalizador WebRTC
//  gas_webcam_v2.gs
//  Sheet ID: 1wiYKs_ORUxC-IiMkFiGbv5e0_Ggo4qDPf-I662E-e8A
//  Novedades v2: validateToken, hoja Config
// ============================================================

const SHEET_ID    = '1wiYKs_ORUxC-IiMkFiGbv5e0_Ggo4qDPf-I662E-e8A';
const SHEET_SIG   = 'Señalización';
const SHEET_CFG   = 'Config';
const VERSION     = 'v2.0';

// Columnas Señalización:  A: sala | B: tipo | C: datos | D: timestamp
// Columnas Config:        A: clave | B: valor

// ─────────────────────────────────────────────────────────
//  doGet — router principal
// ─────────────────────────────────────────────────────────
function doGet(e) {
  const action = e.parameter.action || '';
  const sala   = e.parameter.sala   || '';

  let result;
  try {
    switch (action) {
      case 'validateToken':  result = validateToken(e.parameter.token);           break;
      case 'setOffer':       result = setOffer(sala, e.parameter.datos);          break;
      case 'getOffer':       result = getOffer(sala);                             break;
      case 'setAnswer':      result = setAnswer(sala, e.parameter.datos);         break;
      case 'getAnswer':      result = getAnswer(sala);                            break;
      case 'addCandidate':   result = addCandidate(sala, e.parameter.datos, e.parameter.rol); break;
      case 'getCandidates':  result = getCandidates(sala, e.parameter.rol);       break;
      case 'clearSession':   result = clearSession(sala);                         break;
      case 'ping':           result = { ok: true, version: VERSION };             break;
      default:               result = { error: 'Acción desconocida' };
    }
  } catch (err) {
    Log_GAS('ERROR doGet action=' + action + ' → ' + err.message);
    result = { error: err.message };
  }

  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

// ─────────────────────────────────────────────────────────
//  validateToken — consulta hoja Config
// ─────────────────────────────────────────────────────────
function validateToken(token) {
  if (!token) {
    Log_GAS('validateToken: token vacío');
    return { ok: false, reason: 'Token vacío' };
  }

  const storedToken = _getConfig('token');

  if (!storedToken) {
    Log_GAS('validateToken: no hay token configurado en Sheet');
    return { ok: false, reason: 'Token no configurado' };
  }

  const valid = (token.trim() === storedToken.trim());
  Log_GAS('validateToken: ' + (valid ? 'VÁLIDO' : 'INVÁLIDO') + ' token=' + token.substring(0, 4) + '***');
  return valid ? { ok: true } : { ok: false, reason: 'Token inválido' };
}

// ─────────────────────────────────────────────────────────
//  Config helpers
// ─────────────────────────────────────────────────────────
function _getConfig(clave) {
  const ss    = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheetByName(SHEET_CFG);
  if (!sheet) return null;

  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]).trim() === clave) {
      return String(data[i][1]).trim();
    }
  }
  return null;
}

// ─────────────────────────────────────────────────────────
//  Señalización (sin cambios de lógica vs v1)
// ─────────────────────────────────────────────────────────
function setOffer(sala, datos) {
  _upsert(sala, 'offer', datos);
  return { ok: true };
}

function getOffer(sala) {
  const row = _find(sala, 'offer');
  return row ? { ok: true, datos: row[2] } : { ok: false };
}

function setAnswer(sala, datos) {
  _upsert(sala, 'answer', datos);
  return { ok: true };
}

function getAnswer(sala) {
  const row = _find(sala, 'answer');
  return row ? { ok: true, datos: row[2] } : { ok: false };
}

function addCandidate(sala, datos, rol) {
  const tipo  = 'candidate_' + rol;
  const sheet = _sheet();
  sheet.appendRow([sala, tipo, datos, new Date().toISOString()]);
  return { ok: true };
}

function getCandidates(sala, rol) {
  const tipo = 'candidate_' + rol;
  const data = _sheet().getDataRange().getValues();
  const list = [];
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === sala && data[i][1] === tipo) list.push(data[i][2]);
  }
  return { ok: true, candidates: list };
}

function clearSession(sala) {
  const sheet = _sheet();
  const data  = sheet.getDataRange().getValues();
  for (let i = data.length - 1; i >= 1; i--) {
    if (data[i][0] === sala) sheet.deleteRow(i + 1);
  }
  return { ok: true };
}

// ─────────────────────────────────────────────────────────
//  Helpers internos
// ─────────────────────────────────────────────────────────
function _sheet() {
  return SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_SIG);
}

function _find(sala, tipo) {
  const data = _sheet().getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === sala && data[i][1] === tipo) return data[i];
  }
  return null;
}

function _upsert(sala, tipo, datos) {
  const sheet = _sheet();
  const data  = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === sala && data[i][1] === tipo) {
      sheet.getRange(i + 1, 3).setValue(datos);
      sheet.getRange(i + 1, 4).setValue(new Date().toISOString());
      return;
    }
  }
  sheet.appendRow([sala, tipo, datos, new Date().toISOString()]);
}

// ─────────────────────────────────────────────────────────
//  Log_GAS — trazabilidad en hoja Log
// ─────────────────────────────────────────────────────────
function Log_GAS(msg) {
  try {
    const ss    = SpreadsheetApp.openById(SHEET_ID);
    let log     = ss.getSheetByName('Log');
    if (!log) {
      log = ss.insertSheet('Log');
      log.getRange(1,1,1,3).setValues([['timestamp','origen','mensaje']]);
      log.getRange(1,1,1,3).setBackground('#5B21B6').setFontColor('#fff').setFontWeight('bold');
    }
    log.appendRow([new Date().toISOString(), 'GAS_v2', msg]);
  } catch(e) {
    console.log('Log_GAS error: ' + e.message);
  }
}

// ─────────────────────────────────────────────────────────
//  MENÚ y CONFIGURACIÓN
// ─────────────────────────────────────────────────────────
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('📷 WebCam DMS')
    .addItem('⚙️ Configurar hojas',          'configurarHojas')
    .addItem('🔑 Ver / cambiar token',        'gestionarToken')
    .addItem('🧹 Limpiar todas las sesiones', 'limpiarTodasSesiones')
    .addItem('📊 Ver estado actual',          'verEstado')
    .addItem('ℹ️ Versión',                    'mostrarVersion')
    .addToUi();
}

function configurarHojas() {
  const ss = SpreadsheetApp.openById(SHEET_ID);

  // ── Hoja Señalización ──────────────────────────────────
  let sig = ss.getSheetByName(SHEET_SIG);
  if (!sig) sig = ss.insertSheet(SHEET_SIG);
  sig.getRange(1,1,1,4).setValues([['sala','tipo','datos','timestamp']]);
  _formatHeader(sig.getRange(1,1,1,4));
  sig.setColumnWidth(1,120); sig.setColumnWidth(2,140);
  sig.setColumnWidth(3,500); sig.setColumnWidth(4,180);
  sig.setFrozenRows(1);

  // ── Hoja Config ───────────────────────────────────────
  let cfg = ss.getSheetByName(SHEET_CFG);
  if (!cfg) {
    cfg = ss.insertSheet(SHEET_CFG);
    cfg.getRange(1,1,1,2).setValues([['clave','valor']]);
    _formatHeader(cfg.getRange(1,1,1,2));
    cfg.setColumnWidth(1,180); cfg.setColumnWidth(2,300);
    cfg.setFrozenRows(1);
    // Token de ejemplo
    cfg.appendRow(['token', 'CAMBIAR_ESTE_TOKEN']);
    SpreadsheetApp.getUi().alert(
      '✅ Hojas configuradas.\n\n' +
      'Se creó la hoja "Config" con un token de ejemplo.\n' +
      'Usá 📷 WebCam DMS → 🔑 Ver / cambiar token para actualizarlo.'
    );
  } else {
    SpreadsheetApp.getUi().alert('✅ Hojas revisadas. Config ya existía.');
  }
}

function gestionarToken() {
  const ui     = SpreadsheetApp.getUi();
  const actual = _getConfig('token') || '(no configurado)';

  const resp = ui.prompt(
    '🔑 Token de acceso',
    'Token actual: ' + actual + '\n\nIngresá el nuevo token (dejá vacío para no cambiar):',
    ui.ButtonSet.OK_CANCEL
  );

  if (resp.getSelectedButton() !== ui.Button.OK) return;
  const nuevo = resp.getResponseText().trim();
  if (!nuevo) { ui.alert('ℹ️ Token sin cambios.'); return; }

  // Actualizar en hoja Config
  const ss    = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheetByName(SHEET_CFG);
  const data  = sheet.getDataRange().getValues();
  let actualizado = false;
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]).trim() === 'token') {
      sheet.getRange(i + 1, 2).setValue(nuevo);
      actualizado = true;
      break;
    }
  }
  if (!actualizado) sheet.appendRow(['token', nuevo]);

  Log_GAS('Token actualizado desde menú GAS');
  ui.alert('✅ Token actualizado.\n\nNuevo token: ' + nuevo +
           '\n\nURL de acceso:\nhttps://TU_SITE.github.io/webcam/?token=' + nuevo);
}

function limpiarTodasSesiones() {
  const ui   = SpreadsheetApp.getUi();
  const resp = ui.alert('🧹 Limpiar sesiones',
    '¿Eliminar TODAS las filas de señalización?',
    ui.ButtonSet.YES_NO);
  if (resp !== ui.Button.YES) return;

  const sheet   = _sheet();
  const lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    sheet.deleteRows(2, lastRow - 1);
    ui.alert('✅ Todas las sesiones eliminadas.');
  } else {
    ui.alert('ℹ️ No hay sesiones que limpiar.');
  }
}

function verEstado() {
  const data  = _sheet().getDataRange().getValues();
  const filas = data.length - 1;
  if (filas <= 0) { SpreadsheetApp.getUi().alert('📊 Estado\n\nNo hay sesiones activas.'); return; }

  const salas = {};
  for (let i = 1; i < data.length; i++) {
    const s = data[i][0];
    if (!salas[s]) salas[s] = [];
    salas[s].push(data[i][1]);
  }
  let msg = '📊 Sesiones activas:\n\n';
  for (const s in salas) msg += 'Sala: ' + s + '\n  → ' + salas[s].join(', ') + '\n\n';
  SpreadsheetApp.getUi().alert(msg);
}

function mostrarVersion() {
  const token = _getConfig('token') || '(no configurado)';
  SpreadsheetApp.getUi().alert(
    'WebCam DMS\ngas_webcam_' + VERSION + '\n\n' +
    'Sheet ID:\n' + SHEET_ID + '\n\n' +
    'Token activo: ' + token.substring(0, 4) + '****'
  );
}

function _formatHeader(range) {
  range.setBackground('#5B21B6')
       .setFontColor('#FFFFFF')
       .setFontWeight('bold')
       .setFontSize(11);
}
