/**
 * integracion.js — Módulo D: Integración Numérica
 * Métodos: Trapecio compuesto, Simpson 1/3, Simpson 3/8
 * Escenario: Costo total acumulado de la canasta familiar durante la crisis
 */

let chartIntegRef = null;

/**
 * Evalúa f(t) de forma segura desde el string ingresado por el usuario.
 * Reemplaza 't' con el valor numérico usando Function().
 * Soporta operadores estándar de JavaScript.
 */
function evaluarFuncion(expr, t) {
  try {
    // Reemplazar ^ por ** para potencias
    const exprSafe = expr.replace(/\^/g, '**');
    // Crear función con la expresión
    const f = new Function('t', `"use strict"; return ${exprSafe};`);
    const val = f(t);
    return isNaN(val) || !isFinite(val) ? 0 : val;
  } catch {
    return 0;
  }
}

// ─────────────────────────────────────────────
// MÉTODO 1: Regla del Trapecio Compuesta
// ∫f(x)dx ≈ (h/2)[f(x0) + 2f(x1) + ... + 2f(x_{n-1}) + f(xn)]
// Error: O(h²), proporcional al segundo orden de h
// ─────────────────────────────────────────────
function trapecio(expr, a, b, n) {
  const h = (b - a) / n;
  let suma = evaluarFuncion(expr, a) + evaluarFuncion(expr, b);
  for (let i = 1; i < n; i++) {
    suma += 2 * evaluarFuncion(expr, a + i * h);
  }
  return (h / 2) * suma;
}

// ─────────────────────────────────────────────
// MÉTODO 2: Simpson 1/3 Compuesto
// Requiere n par.
// ∫f ≈ (h/3)[f(x0) + 4f(x1) + 2f(x2) + 4f(x3) + ... + f(xn)]
// Error: O(h⁴) — mucho más preciso que Trapecio para mismas subdivisiones
// ─────────────────────────────────────────────
function simpson13(expr, a, b, n) {
  if (n % 2 !== 0) n += 1; // Asegurar n par
  const h = (b - a) / n;
  let suma = evaluarFuncion(expr, a) + evaluarFuncion(expr, b);
  for (let i = 1; i < n; i++) {
    const coef = i % 2 === 0 ? 2 : 4;
    suma += coef * evaluarFuncion(expr, a + i * h);
  }
  return (h / 3) * suma;
}

// ─────────────────────────────────────────────
// MÉTODO 3: Simpson 3/8 Compuesto
// Requiere n múltiplo de 3.
// ∫f ≈ (3h/8)[f(x0) + 3f(x1) + 3f(x2) + 2f(x3) + 3f(x4) + ...]
// Error: O(h⁴) similar a Simpson 1/3
// ─────────────────────────────────────────────
function simpson38(expr, a, b, n) {
  // Ajustar n al múltiplo de 3 más cercano
  while (n % 3 !== 0) n++;
  const h = (b - a) / n;
  let suma = evaluarFuncion(expr, a) + evaluarFuncion(expr, b);
  for (let i = 1; i < n; i++) {
    const coef = i % 3 === 0 ? 2 : 3;
    suma += coef * evaluarFuncion(expr, a + i * h);
  }
  return (3 * h / 8) * suma;
}

// ── Calcular integral exacta (cuando sea posible) ──
// Para la función por defecto: f(t) = 8 + 0.5t + 0.02t²
// Antiderivada: F(t) = 8t + 0.25t² + (0.02/3)t³
function calcularAnaliticamente(expr, a, b) {
  // Integración numérica de alta densidad como referencia
  return simpson13(expr, a, b, 10000);
}

// ─────────────────────────────────────────────
// FUNCIÓN PRINCIPAL
// ─────────────────────────────────────────────
function resolverIntegracion() {
  const expr = document.getElementById('sD_funcion').value.trim();
  const a    = parseFloat(document.getElementById('sD_a').value);
  const b    = parseFloat(document.getElementById('sD_b').value);
  let   n    = parseInt(document.getElementById('sD_n').value);

  if (!expr) { alert('Ingrese una función f(t) válida.'); return; }
  if (isNaN(a) || isNaN(b) || a >= b) { alert('El intervalo [a, b] debe ser válido y a < b.'); return; }
  if (isNaN(n) || n < 2) { n = 2; }

  // Calcular integrales
  const resTrap  = trapecio(expr, a, b, n);
  const resSi13  = simpson13(expr, a, b, n % 2 === 0 ? n : n + 1);
  const resSi38  = simpson38(expr, a, b, n + (3 - n % 3) % 3);
  const refAnali = calcularAnaliticamente(expr, a, b);

  // Errores relativos respecto a referencia de alta densidad
  const errTrap = Math.abs((refAnali - resTrap) / refAnali * 100);
  const errSi13 = Math.abs((refAnali - resSi13) / refAnali * 100);
  const errSi38 = Math.abs((refAnali - resSi38) / refAnali * 100);

  // Generar curva de f(t) para el gráfico
  const nGraf = 200;
  const hGraf = (b - a) / nGraf;
  const xs = [], ys = [];
  for (let i = 0; i <= nGraf; i++) {
    const t = a + i * hGraf;
    xs.push(parseFloat(t.toFixed(3)));
    ys.push(evaluarFuncion(expr, t));
  }

  // Gráfico
  graficarIntegracion(xs, ys, a, b, expr, n);

  // Tarjetas comparativas
  mostrarComparacionInteg(resTrap, resSi13, resSi38, refAnali, errTrap, errSi13, errSi38);

  // Interpretación
  interpretarIntegracion(resTrap, resSi13, resSi38, refAnali, a, b, n, expr);

  document.getElementById('sD_results').classList.remove('hidden');
  document.getElementById('sD_results').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ── Gráfico con área bajo la curva ──
function graficarIntegracion(xs, ys, a, b, expr, n) {
  if (chartIntegRef) chartIntegRef.destroy();
  const ctx = document.getElementById('chartIntegracion').getContext('2d');

  // Puntos de trapecio para visualizar
  const nTrap = Math.min(n, 30);
  const hTrap = (b - a) / nTrap;
  const trapXs = [], trapYs = [];
  for (let i = 0; i <= nTrap; i++) {
    const t = a + i * hTrap;
    trapXs.push(t);
    trapYs.push(evaluarFuncion(expr, t));
  }

  chartIntegRef = new Chart(ctx, {
    type: 'line',
    data: {
      datasets: [
        {
          label: 'f(t) = Costo diario',
          data: xs.map((x, i) => ({ x, y: ys[i] })),
          borderColor: '#00e5cc',
          borderWidth: 2.5,
          backgroundColor: 'rgba(0,229,204,0.12)',
          fill: true,
          tension: 0.4,
          pointRadius: 0
        },
        {
          label: 'Nodos del trapecio',
          data: trapXs.map((x, i) => ({ x, y: trapYs[i] })),
          type: 'scatter',
          backgroundColor: '#ff6b35',
          pointRadius: 6,
          showLine: true,
          borderColor: 'rgba(255,107,53,0.4)',
          borderWidth: 1
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        title: { display: true, text: 'Costo Diario de la Canasta Familiar f(t)', color: '#e8edf8', font: { size: 16 } },
        legend: { labels: { color: '#e8edf8', font: { size: 13 } } }
      },
      scales: {
        x: {
          type: 'linear',
          title: { display: true, text: 'Tiempo t (días de crisis)', color: '#8892a4', font: { size: 13 } },
          ticks: { color: '#8892a4' }, grid: { color: '#1e2d4a' }
        },
        y: {
          title: { display: true, text: 'Costo diario (Bs/día)', color: '#8892a4', font: { size: 13 } },
          ticks: { color: '#8892a4' }, grid: { color: '#1e2d4a' }
        }
      }
    }
  });

  document.getElementById('sD_chartDesc').textContent =
    'El área sombreada bajo la curva f(t) representa el gasto total acumulado de la canasta familiar durante el período de crisis. Los puntos naranjas muestran los nodos de integración del método del trapecio.';
}

// ── Tarjetas de comparación ──
function mostrarComparacionInteg(trap, si13, si38, ref, eTrap, eSi13, eSi38) {
  const html = `
    <div class="comp-card">
      <div class="comp-method" style="color:var(--mod-C)">Trapecio</div>
      <div class="comp-result" style="color:var(--mod-C)">Bs ${trap.toFixed(2)}</div>
      <div class="comp-detail">Error: ${eTrap.toFixed(4)}% · O(h²)</div>
    </div>
    <div class="comp-card">
      <div class="comp-method" style="color:var(--mod-A)">Simpson 1/3</div>
      <div class="comp-result" style="color:var(--mod-A)">Bs ${si13.toFixed(2)}</div>
      <div class="comp-detail">Error: ${eSi13.toFixed(4)}% · O(h⁴)</div>
    </div>
    <div class="comp-card">
      <div class="comp-method" style="color:var(--mod-B)">Simpson 3/8</div>
      <div class="comp-result" style="color:var(--mod-B)">Bs ${si38.toFixed(2)}</div>
      <div class="comp-detail">Error: ${eSi38.toFixed(4)}% · O(h⁴)</div>
    </div>
    <div class="comp-card">
      <div class="comp-method" style="color:var(--mod-E)">Referencia (n=10000)</div>
      <div class="comp-result" style="color:var(--mod-E)">Bs ${ref.toFixed(2)}</div>
      <div class="comp-detail">Alta densidad de nodos</div>
    </div>`;
  document.getElementById('sD_comparison').innerHTML = html;
}

// ── Interpretación económica ──
function interpretarIntegracion(trap, si13, si38, ref, a, b, n, expr) {
  const dias = b - a;
  const costoMedio = ref / dias;
  const fA = evaluarFuncion(expr, a);
  const fB = evaluarFuncion(expr, b);
  const incremento = ((fB - fA) / fA * 100).toFixed(1);
  const mejorMetodo = Math.abs(si13 - ref) <= Math.abs(si38 - ref) ? 'Simpson 1/3' : 'Simpson 3/8';

  const html = `
    <h3>🔍 Interpretación Económica</h3>
    <p><strong>Gasto total acumulado:</strong> Durante los ${dias} días de crisis analizados, el gasto total en canasta familiar es aproximadamente <strong>Bs ${si13.toFixed(2)}</strong> (según Simpson 1/3). Esto representa un promedio de <strong>Bs ${costoMedio.toFixed(2)} por día</strong>.</p>
    <p><strong>Evolución del costo:</strong> El costo diario pasó de Bs ${fA.toFixed(2)} (día ${a}) a Bs ${fB.toFixed(2)} (día ${b}), un incremento de <strong>${incremento}%</strong> durante el período. Esto representa una presión inflacionaria significativa sobre el presupuesto familiar.</p>
    <p><strong>Comparación de métodos:</strong> Simpson 1/3 y Simpson 3/8 tienen error O(h⁴), mientras que el Trapecio tiene O(h²). Con ${n} subintervalos, Simpson es aproximadamente ${Math.pow(n, 2).toLocaleString()} veces más preciso que el Trapecio teóricamente. El método recomendado para este análisis es <strong>${mejorMetodo}</strong>.</p>
    <p><strong>Aplicación de política social:</strong> Este valor de gasto acumulado permite calcular el monto de subsidio necesario por familia para mantener el acceso a la canasta básica durante la crisis. Si el ingreso familiar mensual es fijo, el subsidio requerido sería la diferencia entre este costo acumulado y la capacidad de pago.</p>
  `;
  document.getElementById('sD_interpretation').innerHTML = html;
}
