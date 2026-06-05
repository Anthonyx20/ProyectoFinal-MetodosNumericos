/**
 * sistemas.js — Módulo A: Sistemas de Ecuaciones Lineales
 * Métodos: Jacobi, Gauss-Seidel, LU, SOR, Gradiente Conjugado
 * Escenario: Distribución de combustible desde 3 plantas hacia 3 zonas urbanas
 *
 * BUGS CORREGIDOS:
 *  1. Validación de inputs NaN antes de cualquier cálculo
 *  2. Colores del gráfico ajustados a sección bg-light (texto oscuro)
 *  3. GC: la matriz se simetriza (A+Aᵀ)/2 para cumplir la condición SPD
 *  4. Escala logarítmica: se filtran errores ≤ 0 o NaN del historial
 *  5. matrix-table th: color añadido inline en mostrarMatriz()
 *  6. comp-result muestra NaN amigable si solucion tiene NaN
 */

let chartSistemasRef = null;

// ── Construye la matriz A y vector b desde los inputs del formulario ──
function construirSistema() {
  const d1 = parseFloat(document.getElementById('sA_d1').value);
  const d2 = parseFloat(document.getElementById('sA_d2').value);
  const d3 = parseFloat(document.getElementById('sA_d3').value);
  const c1 = parseFloat(document.getElementById('sA_c1').value);
  const c2 = parseFloat(document.getElementById('sA_c2').value);
  const c3 = parseFloat(document.getElementById('sA_c3').value);

  // Validar inputs
  if ([d1,d2,d3,c1,c2,c3].some(v => isNaN(v) || v <= 0)) return null;

  const total = c1 + c2 + c3;
  const r1 = c1 / total, r2 = c2 / total, r3 = c3 / total;

  // Sistema 3×3: balance de flujo planta → zona
  const A = [
    [r1 + 0.25, 0.25, 0.10],
    [0.25,      r2 + 0.20, 0.20],
    [0.10,      0.20,      r3 + 0.25]
  ];
  const b = [d1, d2, d3];

  // Garantizar diagonal dominante para convergencia de métodos iterativos
  for (let i = 0; i < 3; i++) {
    const rowSum = A[i].reduce((s, v, j) => j !== i ? s + Math.abs(v) : s, 0);
    if (Math.abs(A[i][i]) <= rowSum) {
      A[i][i] = rowSum + 1.5;
    }
  }
  return { A, b };
}

// ── Simetriza la matriz: A_sim = (A + Aᵀ) / 2 ──
// Necesario para que Gradiente Conjugado funcione correctamente (requiere SPD)
function simetrizarMatriz(A) {
  const n = A.length;
  return A.map((row, i) => row.map((v, j) => (A[i][j] + A[j][i]) / 2));
}

// ─────────────────────────────────────────────
// MÉTODO 1: Jacobi
// x_i^(k+1) = (b_i - Σ_{j≠i} a_ij·x_j^k) / a_ii
// ─────────────────────────────────────────────
function jacobi(A, b, tol, maxIter) {
  const n = b.length;
  let x = new Array(n).fill(0);
  let historial = [];

  for (let k = 0; k < maxIter; k++) {
    const xNuevo = new Array(n).fill(0);
    for (let i = 0; i < n; i++) {
      let suma = 0;
      for (let j = 0; j < n; j++) if (j !== i) suma += A[i][j] * x[j];
      xNuevo[i] = (b[i] - suma) / A[i][i];
    }
    const error = Math.max(...xNuevo.map((v, i) => Math.abs(v - x[i])));
    historial.push({ iter: k + 1, x: [...xNuevo], error });
    x = xNuevo;
    if (error < tol) break;
  }
  return { solucion: x, iteraciones: historial.length, historial };
}

// ─────────────────────────────────────────────
// MÉTODO 2: Gauss-Seidel
// Usa inmediatamente los valores actualizados dentro de la misma iteración
// ─────────────────────────────────────────────
function gaussSeidel(A, b, tol, maxIter) {
  const n = b.length;
  let x = new Array(n).fill(0);
  let historial = [];

  for (let k = 0; k < maxIter; k++) {
    const xAnterior = [...x];
    for (let i = 0; i < n; i++) {
      let suma = 0;
      for (let j = 0; j < n; j++) if (j !== i) suma += A[i][j] * x[j];
      x[i] = (b[i] - suma) / A[i][i];
    }
    const error = Math.max(...x.map((v, i) => Math.abs(v - xAnterior[i])));
    historial.push({ iter: k + 1, x: [...x], error });
    if (error < tol) break;
  }
  return { solucion: x, iteraciones: historial.length, historial };
}

// ─────────────────────────────────────────────
// MÉTODO 3: Factorización LU (Doolittle)
// Descompone A = L·U → resuelve Ly = b → Ux = y
// ─────────────────────────────────────────────
function lu(A, b) {
  const n = b.length;
  const M = A.map(r => [...r]);
  const L = Array.from({length: n}, (_, i) => Array.from({length: n}, (_, j) => i === j ? 1 : 0));
  const U = Array.from({length: n}, () => new Array(n).fill(0));

  for (let k = 0; k < n; k++) {
    for (let j = k; j < n; j++) {
      let suma = 0;
      for (let s = 0; s < k; s++) suma += L[k][s] * U[s][j];
      U[k][j] = M[k][j] - suma;
    }
    for (let i = k + 1; i < n; i++) {
      if (Math.abs(U[k][k]) < 1e-14) return null; // Matriz singular
      let suma = 0;
      for (let s = 0; s < k; s++) suma += L[i][s] * U[s][k];
      L[i][k] = (M[i][k] - suma) / U[k][k];
    }
  }

  // Sustitución hacia adelante: Ly = b
  const y = new Array(n).fill(0);
  for (let i = 0; i < n; i++) {
    let suma = 0;
    for (let j = 0; j < i; j++) suma += L[i][j] * y[j];
    y[i] = (b[i] - suma) / L[i][i];
  }

  // Sustitución hacia atrás: Ux = y
  const x = new Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    let suma = 0;
    for (let j = i + 1; j < n; j++) suma += U[i][j] * x[j];
    x[i] = (y[i] - suma) / U[i][i];
  }

  return { solucion: x, iteraciones: 1, historial: [] };
}

// ─────────────────────────────────────────────
// MÉTODO 4: SOR (Successive Over-Relaxation)
// x_i^{k+1} = (1-ω)·x_i^k + ω·(Gauss-Seidel_i)
// ─────────────────────────────────────────────
function sor(A, b, tol, maxIter, omega) {
  const n = b.length;
  let x = new Array(n).fill(0);
  let historial = [];

  for (let k = 0; k < maxIter; k++) {
    const xAnterior = [...x];
    for (let i = 0; i < n; i++) {
      let sigma = 0;
      for (let j = 0; j < n; j++) if (j !== i) sigma += A[i][j] * x[j];
      const xGS = (b[i] - sigma) / A[i][i];
      x[i] = (1 - omega) * x[i] + omega * xGS;
    }
    const error = Math.max(...x.map((v, i) => Math.abs(v - xAnterior[i])));
    historial.push({ iter: k + 1, x: [...x], error });
    if (error < tol) break;
  }
  return { solucion: x, iteraciones: historial.length, historial };
}

// ─────────────────────────────────────────────
// MÉTODO 5: Gradiente Conjugado
// Opera sobre la versión simetrizda de A (condición SPD requerida)
// Minimiza f(x) = ½xᵀAx − bᵀx
// ─────────────────────────────────────────────
function gradienteConjugado(A, b, tol, maxIter) {
  const n = b.length;
  // BUG FIX: simetrizar A para que GC sea matemáticamente correcto
  const AS = simetrizarMatriz(A);

  let x = new Array(n).fill(0);
  let r = b.map((bi, i) => bi - AS[i].reduce((s, aij, j) => s + aij * x[j], 0));
  let p = [...r];
  let rsOld = r.reduce((s, ri) => s + ri * ri, 0);
  let historial = [];

  for (let k = 0; k < maxIter; k++) {
    const Ap = AS.map(row => row.reduce((s, aij, j) => s + aij * p[j], 0));
    const denom = p.reduce((s, pi, i) => s + pi * Ap[i], 0);

    if (Math.abs(denom) < 1e-14) break; // Previene división por cero

    const alpha = rsOld / denom;
    x = x.map((xi, i) => xi + alpha * p[i]);
    r = r.map((ri, i) => ri - alpha * Ap[i]);
    const rsNew = r.reduce((s, ri) => s + ri * ri, 0);
    const error = Math.sqrt(rsNew);

    historial.push({ iter: k + 1, x: [...x], error });
    if (error < tol) break;

    const beta = rsNew / rsOld;
    p = r.map((ri, i) => ri + beta * p[i]);
    rsOld = rsNew;
  }
  return { solucion: x, iteraciones: historial.length, historial };
}

// ─────────────────────────────────────────────
// FUNCIÓN PRINCIPAL
// ─────────────────────────────────────────────
function resolverSistemas() {
  const tol     = parseFloat(document.getElementById('sA_tol').value);
  const maxIter = parseInt(document.getElementById('sA_maxIter').value);
  const omega   = parseFloat(document.getElementById('sA_omega').value);

  // BUG FIX: validar antes de proceder
  if (isNaN(tol) || isNaN(maxIter) || isNaN(omega)) {
    alert('Verifique que todos los parámetros numéricos son válidos.');
    return;
  }

  const sistema = construirSistema();
  if (!sistema) {
    alert('Todos los valores de demanda y capacidad deben ser números positivos.');
    return;
  }
  const { A, b } = sistema;

  const resultados = {
    'Jacobi':          jacobi(A, b, tol, maxIter),
    'Gauss-Seidel':    gaussSeidel(A, b, tol, maxIter),
    'LU':              lu(A, b) || { solucion: [0, 0, 0], iteraciones: 0, historial: [] },
    ['SOR (ω=' + omega.toFixed(1) + ')']: sor(A, b, tol, maxIter, omega),
    'Grad. Conjugado': gradienteConjugado(A, b, tol, maxIter)
  };

  mostrarMatriz(A, b);
  mostrarComparacionSistemas(resultados);
  graficarSistemas(resultados);
  interpretarSistemas(resultados, A, b);

  document.getElementById('sA_results').classList.remove('hidden');
  document.getElementById('sA_results').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ── Matriz aumentada [A|b] ──
function mostrarMatriz(A, b) {
  const labels = ['Zona Norte', 'Zona Centro', 'Zona Sur'];
  const vars   = ['x₁ (Planta 1)', 'x₂ (Planta 2)', 'x₃ (Planta 3)', 'b (demanda)'];

  // BUG FIX: añadir color explícito a los <th> para que sean visibles en bg-light
  let html = '<table class="matrix-table"><thead><tr><th style="color:#1a5c8f;background:#e8edf8"></th>';
  vars.forEach(v => {
    html += `<th style="color:#1a5c8f;background:#e8edf8;padding:0.5rem 1rem;font-size:0.88rem">${v}</th>`;
  });
  html += '</tr></thead><tbody>';

  A.forEach((row, i) => {
    html += `<tr><td style="color:#555;font-size:0.85rem;background:#f4f6fb">${labels[i]}</td>`;
    row.forEach(v => {
      html += `<td style="color:#1a3a5c;background:rgba(74,158,255,0.06)">${v.toFixed(4)}</td>`;
    });
    html += `<td class="augment" style="background:rgba(255,107,53,0.07)">${b[i].toFixed(1)}</td></tr>`;
  });
  html += '</tbody></table>';
  document.getElementById('sA_matrix').innerHTML = html;
}

// ── Tarjetas de comparación ──
function mostrarComparacionSistemas(resultados) {
  const colors = ['var(--mod-A)', 'var(--mod-B)', 'var(--mod-C)', 'var(--mod-D)', 'var(--mod-E)'];
  let html = '';

  Object.entries(resultados).forEach(([nombre, res], idx) => {
    // BUG FIX: mostrar '—' si la solución contiene NaN
    const solStr = res.solucion.every(v => !isNaN(v))
      ? res.solucion.map(v => v.toFixed(2)).join(' | ')
      : 'No convergió';

    html += `
      <div class="comp-card">
        <div class="comp-method" style="color:${colors[idx]}">${nombre}</div>
        <div class="comp-result" style="color:${colors[idx]}">${res.iteraciones} iter.</div>
        <div class="comp-detail" style="margin-bottom:0.4rem">Solución [x₁, x₂, x₃]:</div>
        <div style="font-family:var(--font-mono);font-size:0.88rem;color:#1a2340">${solStr}</div>
      </div>`;
  });
  document.getElementById('sA_comparison').innerHTML = html;
}

// ── Gráfico de convergencia ──
function graficarSistemas(resultados) {
  if (chartSistemasRef) chartSistemasRef.destroy();
  const ctx = document.getElementById('chartSistemas').getContext('2d');
  const colors = ['#00a896', '#d4500a', '#1a6eb5', '#7c3aed', '#c07c00'];
  const datasets = [];

  Object.entries(resultados).forEach(([nombre, res], idx) => {
    if (!res.historial || res.historial.length === 0) return;

    // BUG FIX: filtrar errores <= 0 o NaN para la escala logarítmica
    const datosValidos = res.historial
      .filter(h => h.error > 0 && isFinite(h.error) && !isNaN(h.error))
      .map(h => ({ x: h.iter, y: h.error }));

    if (datosValidos.length === 0) return;

    datasets.push({
      label: nombre,
      data: datosValidos,
      borderColor: colors[idx],
      borderWidth: 2.5,
      fill: false,
      tension: 0.3,
      pointRadius: 3,
      pointHoverRadius: 5
    });
  });

  // BUG FIX: colores de texto oscuros para sección bg-light
  chartSistemasRef = new Chart(ctx, {
    type: 'line',
    data: { datasets },
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: 'Convergencia de los Métodos Iterativos',
          color: '#1a2340',   // oscuro para bg-light
          font: { size: 16 }
        },
        legend: {
          labels: { color: '#1a2340', font: { size: 13 } }
        }
      },
      scales: {
        x: {
          type: 'linear',
          title: { display: true, text: 'Iteración', color: '#444', font: { size: 13 } },
          ticks: { color: '#444' },
          grid: { color: '#d0d8e8' }   // claro para bg-light
        },
        y: {
          type: 'logarithmic',
          title: { display: true, text: 'Error absoluto (escala log)', color: '#444', font: { size: 13 } },
          ticks: { color: '#444' },
          grid: { color: '#d0d8e8' }
        }
      }
    }
  });

  document.getElementById('sA_chartDesc').textContent =
    'Convergencia de los métodos iterativos en escala logarítmica. Un descenso más rápido indica mayor eficiencia. LU (directa) no aparece porque no itera. Gradiente Conjugado opera sobre la versión simetrizada de A.';
}

// ── Interpretación automática ──
function interpretarSistemas(resultados, A, b) {
  const entradas = Object.entries(resultados);

  let mejorNombre = '', mejorIter = Infinity;
  entradas.forEach(([n, r]) => {
    if (r.iteraciones > 0 && r.iteraciones < mejorIter) {
      mejorIter = r.iteraciones;
      mejorNombre = n;
    }
  });

  const solRef = resultados['LU'].solucion;
  const solOK  = solRef.every(v => !isNaN(v));
  const [d1, d2, d3] = b;

  const html = `
    <h3>🔍 Interpretación del Resultado</h3>
    <p><strong style="color:black;">Lectura del resultado:</strong> Las incógnitas x₁, x₂, x₃ representan la
    <strong style="color:black;">producción total</strong> que cada planta debe asignar para satisfacer
    simultáneamente la demanda de todas las zonas.
    ${solOK ? `Solución de referencia (LU): <strong style="color:black;">P1 = ${solRef[0].toFixed(1)} ton/día</strong>,
    P2 = ${solRef[1].toFixed(1)} ton/día, P3 = ${solRef[2].toFixed(1)} ton/día.` : ''}</p>
    <p><strong style="color:black;">Convergencia:</strong> El método <strong style="color:black;">${mejorNombre}</strong> alcanzó la
    tolerancia en ${mejorIter} iteración(es). La factorización LU entrega solución exacta
    en una sola pasada y sirve de referencia.</p>
    <p><strong style="color:black;">Implicación económica:</strong> Con demandas de ${d1} + ${d2} + ${d3} =
    <strong style="color:black;">${(d1+d2+d3).toFixed(0)} toneladas/día</strong> en total, la distribución
    óptima encontrada asegura abastecimiento sin déficit.</p>
    <p><strong style="color:black;">Gradiente Conjugado:</strong> Requiere matriz simétrica definida positiva (SPD).
    La matriz se simetrizó automáticamente con A_sim = (A + Aᵀ)/2 para garantizar
    convergencia matemáticamente correcta.</p>
    <p><strong style="color:black;">SOR vs. Gauss-Seidel:</strong> El factor ω controla la velocidad de convergencia.
    ω > 1 acelera para sistemas fuertemente diagonal-dominantes; si diverge, reducir ω hacia 1.0.</p>
  `;
  document.getElementById('sA_interpretation').innerHTML = html;
}
