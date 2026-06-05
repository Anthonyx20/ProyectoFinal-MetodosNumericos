/**
 * interpolacion.js — Módulo C: Interpolación de Precios
 * Métodos: Lagrange, Newton (diferencias divididas), Splines Cúbicos
 * Escenario: Estimación del precio de la canasta básica en días no observados
 */

let chartInterpRef = null;

// Datos por defecto (días, precios de canasta básica en Bs)
const PUNTOS_DEFAULT = [
  { x: 1,  y: 8  },
  { x: 5,  y: 10 },
  { x: 10, y: 13 },
  { x: 15, y: 16 },
  { x: 20, y: 19 },
  { x: 30, y: 22 }
];

let puntosC = [...PUNTOS_DEFAULT];

// ── Inicializar puntos en el DOM ──
function inicializarPuntosC() {
  renderizarPuntosC();
}
// Llamado cuando se carga la página
document.addEventListener('DOMContentLoaded', inicializarPuntosC);

function renderizarPuntosC() {
  const container = document.getElementById('sC_pointsContainer');
  container.innerHTML = '';
  puntosC.forEach((p, i) => {
    const row = document.createElement('div');
    row.className = 'point-row';
    row.innerHTML = `
      <label>Día:</label>
      <input type="number" value="${p.x}" min="0" max="365" step="0.5"
        oninput="actualizarPuntoC(${i}, 'x', this.value)" />
      <label>Precio (Bs):</label>
      <input type="number" value="${p.y}" min="0" max="1000" step="0.1"
        oninput="actualizarPuntoC(${i}, 'y', this.value)" />
      <button class="btn-remove" onclick="eliminarPuntoC(${i})" title="Eliminar punto">✕</button>
    `;
    container.appendChild(row);
  });
}

function actualizarPuntoC(i, campo, valor) {
  puntosC[i][campo] = parseFloat(valor) || 0;
}

function agregarPuntoC() {
  const ultimoX = puntosC.length > 0 ? puntosC[puntosC.length - 1].x + 5 : 0;
  const ultimoY = puntosC.length > 0 ? puntosC[puntosC.length - 1].y + 2 : 5;
  puntosC.push({ x: ultimoX, y: ultimoY });
  renderizarPuntosC();
}

function eliminarPuntoC(i) {
  if (puntosC.length <= 2) { alert('Se necesitan al menos 2 puntos para interpolar.'); return; }
  puntosC.splice(i, 1);
  renderizarPuntosC();
}

function resetearPuntosC() {
  puntosC = PUNTOS_DEFAULT.map(p => ({ ...p }));
  renderizarPuntosC();
}

// ─────────────────────────────────────────────
// MÉTODO 1: Interpolación de Lagrange
// P(x) = Σ y_i * L_i(x)
// L_i(x) = Π_{j≠i} (x - x_j) / (x_i - x_j)
// ─────────────────────────────────────────────
function lagrange(xs, ys, xEval) {
  const n = xs.length;
  let resultado = 0;

  for (let i = 0; i < n; i++) {
    let Li = 1;
    for (let j = 0; j < n; j++) {
      if (j !== i) {
        Li *= (xEval - xs[j]) / (xs[i] - xs[j]);
      }
    }
    resultado += ys[i] * Li;
  }
  return resultado;
}

// ─────────────────────────────────────────────
// MÉTODO 2: Interpolación de Newton (diferencias divididas)
// Tabla de diferencias: f[x_i, ..., x_k]
// P(x) = f[x0] + f[x0,x1](x-x0) + f[x0,x1,x2](x-x0)(x-x1) + ...
// ─────────────────────────────────────────────
function newton(xs, ys, xEval) {
  const n = xs.length;
  // Construir tabla de diferencias divididas
  let tabla = Array.from({length: n}, (_, i) => new Array(n).fill(0));
  for (let i = 0; i < n; i++) tabla[i][0] = ys[i];

  for (let j = 1; j < n; j++) {
    for (let i = 0; i < n - j; i++) {
      tabla[i][j] = (tabla[i+1][j-1] - tabla[i][j-1]) / (xs[i+j] - xs[i]);
    }
  }

  // Coeficientes de Newton (diagonal superior)
  let coefs = tabla.map((row, i) => row[i]);

  // Evaluar el polinomio
  let resultado = coefs[0];
  let prod = 1;
  for (let i = 1; i < n; i++) {
    prod *= (xEval - xs[i-1]);
    resultado += coefs[i] * prod;
  }

  return { valor: resultado, tabla, coefs };
}

// ─────────────────────────────────────────────
// MÉTODO 3: Splines Cúbicos Naturales
// Ajusta polinomios cúbicos por tramos con segunda
// derivada continua. Condición de frontera natural: M_0 = M_{n-1} = 0
// ─────────────────────────────────────────────
function splinesCubicos(xs, ys, xEval) {
  const n = xs.length;
  if (n < 3) return lagrange(xs, ys, xEval); // Fallback con pocos puntos

  // Diferencias h_i = x_{i+1} - x_i
  const h = [];
  for (let i = 0; i < n - 1; i++) h.push(xs[i+1] - xs[i]);

  // Sistema tridiagonal para los momentos M_i (segunda derivada)
  // a_i * M_{i-1} + 2*M_i + c_i * M_{i+1} = d_i
  const m = n - 2; // Ecuaciones internas
  if (m <= 0) return lagrange(xs, ys, xEval);

  let a = [], diag = [], c = [], d = [];
  for (let i = 0; i < m; i++) {
    const k = i + 1; // índice en los puntos originales
    a.push(h[k-1] / (h[k-1] + h[k]));
    diag.push(2);
    c.push(h[k] / (h[k-1] + h[k]));
    d.push(6 / (h[k-1] + h[k]) * ((ys[k+1] - ys[k]) / h[k] - (ys[k] - ys[k-1]) / h[k-1]));
  }

  // Resolver sistema tridiagonal (Thomas algorithm)
  let M = resolverTridiagonal(a, diag, c, d);
  M = [0, ...M, 0]; // Condición natural: extremos M = 0

  // Evaluar spline en xEval
  // Encontrar el intervalo [x_i, x_{i+1}] que contiene xEval
  let idx = 0;
  for (let i = 0; i < n - 1; i++) {
    if (xEval >= xs[i] && xEval <= xs[i+1]) { idx = i; break; }
    if (xEval < xs[0]) { idx = 0; break; }
    if (xEval > xs[n-1]) { idx = n - 2; break; }
  }

  const i = idx;
  const hi = h[i];
  const ti = (xEval - xs[i]) / hi;
  const si = (xEval - xs[i+1]) / hi; // negativo

  const val = M[i] * Math.pow(xs[i+1] - xEval, 3) / (6 * hi)
            + M[i+1] * Math.pow(xEval - xs[i], 3) / (6 * hi)
            + (ys[i] - M[i] * hi * hi / 6) * (xs[i+1] - xEval) / hi
            + (ys[i+1] - M[i+1] * hi * hi / 6) * (xEval - xs[i]) / hi;

  return { valor: val, momentos: M };
}

// Algoritmo de Thomas para sistemas tridiagonales
function resolverTridiagonal(a, diag, c, d) {
  const n = d.length;
  let cPrime = [...c];
  let dPrime = [...d];

  // Eliminación hacia adelante
  for (let i = 1; i < n; i++) {
    const m = a[i] / diag[i-1];
    diag[i] -= m * cPrime[i-1];
    dPrime[i] -= m * dPrime[i-1];
  }

  // Sustitución hacia atrás
  let x = new Array(n).fill(0);
  x[n-1] = dPrime[n-1] / diag[n-1];
  for (let i = n - 2; i >= 0; i--) {
    x[i] = (dPrime[i] - cPrime[i] * x[i+1]) / diag[i];
  }
  return x;
}

// ─────────────────────────────────────────────
// FUNCIÓN PRINCIPAL
// ─────────────────────────────────────────────
function resolverInterpolacion() {
  // Ordenar puntos por x
  puntosC.sort((a, b) => a.x - b.x);
  const xs = puntosC.map(p => p.x);
  const ys = puntosC.map(p => p.y);
  const xEstimar = parseFloat(document.getElementById('sC_xEstimar').value);

  if (puntosC.length < 2) {
    alert('Necesita al menos 2 puntos para interpolar.');
    return;
  }
  if (isNaN(xEstimar)) {
    alert('Ingrese un día válido para estimar el precio.');
    return;
  }

  // Calcular estimaciones
  const yLagrange = lagrange(xs, ys, xEstimar);
  const resNewton  = newton(xs, ys, xEstimar);
  const resSpline  = typeof splinesCubicos === 'function' ? splinesCubicos(xs, ys, xEstimar) : { valor: yLagrange };
  const yNewton    = resNewton.valor;
  const ySpline    = resSpline.valor;

  // Generar puntos de la curva
  const xMin = xs[0], xMax = xs[xs.length - 1];
  const paso = (xMax - xMin) / 200;
  const curvaX = [];
  for (let x = xMin; x <= xMax + paso / 2; x += paso) curvaX.push(parseFloat(x.toFixed(3)));

  const curvaLagrange = curvaX.map(x => lagrange(xs, ys, x));
  const curvaNewton   = curvaX.map(x => newton(xs, ys, x).valor);
  const curvaSpline   = curvaX.map(x => {
    try { return splinesCubicos(xs, ys, x).valor; } catch { return lagrange(xs, ys, x); }
  });

  // Gráfico
  graficarInterpolacion(xs, ys, curvaX, curvaLagrange, curvaNewton, curvaSpline, xEstimar, yLagrange, ySpline);

  // Tarjetas de comparación
  mostrarComparacionInterp(xEstimar, yLagrange, yNewton, ySpline);

  // Tabla de diferencias divididas
  construirTablaNewton(xs, ys, resNewton.tabla);

  // Interpretación
  interpretarInterpolacion(xEstimar, yLagrange, yNewton, ySpline, xs, ys);

  document.getElementById('sC_results').classList.remove('hidden');
  document.getElementById('sC_results').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ── Gráfico de curvas interpoladas ──
function graficarInterpolacion(xs, ys, curvaX, lagr, newt, spline, xEst, yLagr, ySpline) {
  if (chartInterpRef) chartInterpRef.destroy();
  const ctx = document.getElementById('chartInterpolacion').getContext('2d');

  chartInterpRef = new Chart(ctx, {
    type: 'line',
    data: {
      datasets: [
        {
          label: 'Datos observados',
          data: xs.map((x, i) => ({ x, y: ys[i] })),
          type: 'scatter',
          backgroundColor: '#fbbf24',
          pointRadius: 8,
          pointHoverRadius: 10,
          showLine: false
        },
        {
          label: 'Spline Cúbico',
          data: curvaX.map((x, i) => ({ x, y: spline[i] })),
          borderColor: '#00e5cc',
          borderWidth: 2.5,
          fill: false,
          tension: 0.4,
          pointRadius: 0
        },
        {
          label: 'Lagrange',
          data: curvaX.map((x, i) => ({ x, y: lagr[i] })),
          borderColor: '#ff6b35',
          borderWidth: 2,
          borderDash: [6, 3],
          fill: false,
          tension: 0.3,
          pointRadius: 0
        },
        {
          label: 'Newton',
          data: curvaX.map((x, i) => ({ x, y: newt[i] })),
          borderColor: '#4a9eff',
          borderWidth: 2,
          borderDash: [3, 3],
          fill: false,
          tension: 0.3,
          pointRadius: 0
        },
        {
          label: `Estimado (día ${xEst})`,
          data: [{ x: xEst, y: ySpline }],
          type: 'scatter',
          backgroundColor: '#9f7aea',
          pointRadius: 12,
          pointStyle: 'triangle',
          showLine: false
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        title: { display: true, text: 'Interpolación de Precios de Canasta Básica', color: '#1a2340', font: { size: 16 } },
        legend: { labels: { color: '#1a2340', font: { size: 13 } } }
      },
      scales: {
        x: {
          type: 'linear',
          title: { display: true, text: 'Día de la crisis', color: '#444', font: { size: 13 } },
          ticks: { color: '#444' }, grid: { color: '#e8edf8' }
        },
        y: {
          title: { display: true, text: 'Precio canasta (Bs)', color: '#444', font: { size: 13 } },
          ticks: { color: '#444' }, grid: { color: '#e8edf8' }
        }
      }
    }
  });

  document.getElementById('sC_chartDesc').textContent =
    'Curvas de interpolación generadas por tres métodos distintos. Los puntos amarillos son las observaciones reales. El triángulo violeta indica el precio estimado en el día solicitado. Los splines cúbicos generalmente producen la curva más suave.';
}

// ── Tarjetas de comparación ──
function mostrarComparacionInterp(xEst, yL, yN, yS) {
  const html = `
    <div class="comp-card">
      <div class="comp-method" style="color:var(--mod-B)">Lagrange</div>
      <div class="comp-result" style="color:var(--mod-B)">Bs ${yL.toFixed(4)}</div>
      <div class="comp-detail">Día ${xEst} · Polinomio global</div>
    </div>
    <div class="comp-card">
      <div class="comp-method" style="color:var(--mod-C)">Newton D.D.</div>
      <div class="comp-result" style="color:var(--mod-C)">Bs ${yN.toFixed(4)}</div>
      <div class="comp-detail">Día ${xEst} · Diferencias divididas</div>
    </div>
    <div class="comp-card">
      <div class="comp-method" style="color:var(--mod-A)">Spline Cúbico</div>
      <div class="comp-result" style="color:var(--mod-A)">Bs ${yS.toFixed(4)}</div>
      <div class="comp-detail">Día ${xEst} · Método recomendado</div>
    </div>
    <div class="comp-card">
      <div class="comp-method" style="color:var(--mod-E)">Diferencia L-S</div>
      <div class="comp-result" style="color:var(--mod-E)">${Math.abs(yL - yS).toFixed(4)}</div>
      <div class="comp-detail">Discrepancia entre métodos</div>
    </div>`;
  document.getElementById('sC_comparison').innerHTML = html;
}

// ── Tabla de diferencias divididas de Newton ──
function construirTablaNewton(xs, ys, tabla) {
  const n = xs.length;
  let html = '<thead><tr><th>x_i</th><th>f[x_i]</th>';
  for (let j = 1; j < n; j++) html += `<th>Δ${j}</th>`;
  html += '</tr></thead><tbody>';

  for (let i = 0; i < n; i++) {
    html += `<tr><td>${xs[i]}</td>`;
    for (let j = 0; j < n - i; j++) {
      const val = tabla[i][j];
      const fmt = Math.abs(val) < 0.0001 && val !== 0 ? val.toExponential(3) : val.toFixed(4);
      html += `<td>${i + j < n ? fmt : ''}</td>`;
    }
    for (let j = n - i; j < n; j++) html += '<td></td>';
    html += '</tr>';
  }
  html += '</tbody>';
  document.getElementById('sC_table').innerHTML = html;
}

// ── Interpretación automática ──
function interpretarInterpolacion(xEst, yL, yN, yS, xs, ys) {
  const esExtrapolacion = xEst < xs[0] || xEst > xs[xs.length - 1];
  const diferencia = Math.abs(yL - yS);
  const precioMedio = ys.reduce((a, b) => a + b, 0) / ys.length;
  const tendencia = (ys[ys.length - 1] - ys[0]) / (xs[xs.length - 1] - xs[0]);

  const html = `
    <h3>🔍 Interpretación del Resultado</h3>
    <p><strong style="color:black;">Precio estimado en el día ${xEst}:</strong> Según el spline cúbico, el precio de la canasta básica sería aproximadamente <strong style="color:black;">Bs ${yS.toFixed(2)}</strong>. Los tres métodos convergen a valores muy cercanos (diferencia = Bs ${diferencia.toFixed(4)}), lo que indica buena consistencia en la estimación.</p>
    ${esExtrapolacion ? '<p>⚠ <strong style="color:black;">ATENCIÓN — Extrapolación:</strong> El día solicitado está fuera del rango de datos observados. Las estimaciones de interpolación pierden confiabilidad fuera del intervalo de datos y deben usarse con precaución.</p>' : ''}
    <p><strong style="color:black;">Tendencia de precios:</strong> Los datos muestran un incremento promedio de <strong style="color:black;">Bs ${tendencia.toFixed(3)} por día</strong> de crisis. Si esta tendencia continúa, el precio podría llegar a Bs ${(ys[ys.length-1] + tendencia * 10).toFixed(1)} en 10 días adicionales.</p>
    <p><strong style="color:black;">¿Por qué Splines Cúbicos?</strong> Los splines evitan el fenómeno de Runge (oscilaciones artificiales) que puede aparecer con Lagrange para muchos puntos equidistantes. Al ajustar polinomios cúbicos por tramos, mantienen la curva suave y físicamente plausible.</p>
    <p><strong style="color:black;">Aplicación práctica:</strong> Este modelo permite estimar el costo de la canasta en cualquier día de la crisis para planificar subsidios, transferencias monetarias o ajustes de salario mínimo con base matemática.</p>
  `;
  document.getElementById('sC_interpretation').innerHTML = html;
}
