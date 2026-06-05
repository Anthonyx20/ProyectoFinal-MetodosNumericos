/**
 * raices.js — Módulo E: Raíces de Ecuaciones
 * Métodos: Bisección, Newton-Raphson, Secante
 * Escenario: Encontrar el punto de equilibrio económico familiar
 * f(x) = 1000 + 50x − 2000  →  raíz es el precio de equilibrio
 */

let chartRaicesRef = null;
let chartConvergRef = null;

/**
 * Evalúa f(x) de forma segura desde el string ingresado por el usuario.
 * Permite expresiones como: x**2 - 4, Math.sin(x) - x/2, etc.
 */
function evalF(expr, x) {
  try {
    const exprSafe = expr.replace(/\^/g, '**');
    const f = new Function('x', `"use strict"; return ${exprSafe};`);
    const val = f(x);
    return isNaN(val) || !isFinite(val) ? NaN : val;
  } catch {
    return NaN;
  }
}

/**
 * Derivada numérica de f en x usando diferencias centradas
 * f'(x) ≈ [f(x+h) - f(x-h)] / (2h)
 */
function derivadaNumerica(expr, x) {
  const h = 1e-7;
  return (evalF(expr, x + h) - evalF(expr, x - h)) / (2 * h);
}

// ─────────────────────────────────────────────
// MÉTODO 1: Bisección
// Requiere f(a)*f(b) < 0 (cambio de signo en [a, b])
// En cada iteración: c = (a+b)/2
// Si f(a)*f(c) < 0 → b = c, else → a = c
// Convergencia garantizada pero lenta: O(log₂((b-a)/ε)) iteraciones
// ─────────────────────────────────────────────
function biseccion(expr, a, b, tol, maxIter) {
  const fa = evalF(expr, a);
  const fb = evalF(expr, b);

  if (isNaN(fa) || isNaN(fb)) return { error: 'La función no es evaluable en el intervalo.', historial: [] };
  if (fa * fb > 0) return { error: 'f(a) y f(b) tienen el mismo signo. No hay cambio de signo en [' + a + ', ' + b + ']. Ajuste el intervalo.', historial: [] };

  let historial = [];
  let aAct = a, bAct = b;

  for (let k = 0; k < maxIter; k++) {
    const c  = (aAct + bAct) / 2;
    const fc = evalF(expr, c);
    const error = Math.abs(bAct - aAct) / 2;

    historial.push({
      iter: k + 1,
      a: aAct.toFixed(8),
      b: bAct.toFixed(8),
      c: c.toFixed(8),
      fc: fc.toFixed(8),
      error: error.toFixed(8)
    });

    if (isNaN(fc)) break;
    if (error < tol || Math.abs(fc) < tol) {
      return { raiz: c, iteraciones: k + 1, historial };
    }

    if (evalF(expr, aAct) * fc < 0) {
      bAct = c;
    } else {
      aAct = c;
    }
  }

  const raiz = (aAct + bAct) / 2;
  return { raiz, iteraciones: maxIter, historial };
}

// ─────────────────────────────────────────────
// MÉTODO 2: Newton-Raphson
// x_{n+1} = x_n - f(x_n) / f'(x_n)
// Convergencia cuadrática cerca de la raíz: e_{n+1} ≈ C * e_n²
// Requiere f'(x) ≠ 0 y buena estimación inicial
// ─────────────────────────────────────────────
function newtonRaphson(expr, a, b, tol, maxIter) {
  // Punto inicial: promedio del intervalo
  let x = (a + b) / 2;
  let historial = [];

  for (let k = 0; k < maxIter; k++) {
    const fx  = evalF(expr, x);
    const fpx = derivadaNumerica(expr, x);

    if (isNaN(fx) || isNaN(fpx)) break;
    if (Math.abs(fpx) < 1e-14) {
      return { error: 'Derivada ≈ 0 en x = ' + x.toFixed(6) + '. Newton-Raphson diverge.', historial };
    }

    const xNuevo = x - fx / fpx;
    const error  = Math.abs(xNuevo - x);

    historial.push({
      iter: k + 1,
      x: x.toFixed(8),
      fx: fx.toFixed(8),
      fpx: fpx.toFixed(8),
      xNuevo: xNuevo.toFixed(8),
      error: error.toFixed(8)
    });

    x = xNuevo;
    if (error < tol && Math.abs(fx) < tol * 100) {
      return { raiz: x, iteraciones: k + 1, historial };
    }
  }

  return { raiz: x, iteraciones: maxIter, historial };
}

// ─────────────────────────────────────────────
// MÉTODO 3: Secante
// Igual que Newton pero sin derivada analítica.
// x_{n+1} = x_n - f(x_n) * (x_n - x_{n-1}) / (f(x_n) - f(x_{n-1}))
// Convergencia superlineal: orden ≈ 1.618 (número áureo)
// ─────────────────────────────────────────────
function secante(expr, a, b, tol, maxIter) {
  let x0 = a, x1 = b;
  let historial = [];

  for (let k = 0; k < maxIter; k++) {
    const f0 = evalF(expr, x0);
    const f1 = evalF(expr, x1);

    if (isNaN(f0) || isNaN(f1)) break;
    const denom = f1 - f0;
    if (Math.abs(denom) < 1e-14) {
      return { error: 'f(x_n) - f(x_{n-1}) ≈ 0. La secante no puede continuar.', historial };
    }

    const x2    = x1 - f1 * (x1 - x0) / denom;
    const error = Math.abs(x2 - x1);

    historial.push({
      iter: k + 1,
      x0: x0.toFixed(8),
      x1: x1.toFixed(8),
      x2: x2.toFixed(8),
      f1: f1.toFixed(8),
      error: error.toFixed(8)
    });

    x0 = x1;
    x1 = x2;

    if (error < tol && Math.abs(f1) < tol * 100) {
      return { raiz: x2, iteraciones: k + 1, historial };
    }
  }

  return { raiz: x1, iteraciones: maxIter, historial };
}

// ─────────────────────────────────────────────
// FUNCIÓN PRINCIPAL
// ─────────────────────────────────────────────
function resolverRaices() {
  const expr    = document.getElementById('sE_funcion').value.trim();
  const a       = parseFloat(document.getElementById('sE_a').value);
  const b       = parseFloat(document.getElementById('sE_b').value);
  const tol     = parseFloat(document.getElementById('sE_tol').value);
  const maxIter = parseInt(document.getElementById('sE_maxIter').value);

  if (!expr) { alert('Ingrese una función f(x) válida.'); return; }
  if (isNaN(a) || isNaN(b)) { alert('Ingrese valores numéricos para a y b.'); return; }

  const resBis  = biseccion(expr, a, b, tol, maxIter);
  const resNewt = newtonRaphson(expr, a, b, tol, maxIter);
  const resSec  = secante(expr, a, b, tol, maxIter);

  // Graficar la función
  graficarFuncion(expr, a, b, resBis, resNewt, resSec);

  // Tarjetas de comparación
  mostrarComparacionRaices(resBis, resNewt, resSec);

  // Poblar tablas
  poblarTablaRaices(resBis, resNewt, resSec);

  // Gráfico de convergencia del error
  graficarConvergencia(resBis, resNewt, resSec);

  // Interpretación
  interpretarRaices(resBis, resNewt, resSec, expr, a, b);

  document.getElementById('sE_results').classList.remove('hidden');
  document.getElementById('sE_results').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ── Gráfico de la función ──
function graficarFuncion(expr, a, b, resBis, resNewt, resSec) {
  if (chartRaicesRef) chartRaicesRef.destroy();
  const ctx = document.getElementById('chartRaices').getContext('2d');

  const margin = (b - a) * 0.1;
  const xMin = a - margin, xMax = b + margin;
  const nPts = 300;
  const h = (xMax - xMin) / nPts;
  const xs = [], ys = [];

  for (let i = 0; i <= nPts; i++) {
    const x = xMin + i * h;
    const y = evalF(expr, x);
    if (Math.abs(y) < 1e6) {
      xs.push(parseFloat(x.toFixed(5)));
      ys.push(parseFloat(y.toFixed(6)));
    }
  }

  // Puntos de las raíces encontradas
  const raicesEncontradas = [];
  [resBis, resNewt, resSec].forEach((res, i) => {
    if (res.raiz !== undefined) {
      raicesEncontradas.push({ x: res.raiz, y: evalF(expr, res.raiz) });
    }
  });

  chartRaicesRef = new Chart(ctx, {
    type: 'line',
    data: {
      datasets: [
        {
          label: 'f(x)',
          data: xs.map((x, i) => ({ x, y: ys[i] })),
          borderColor: '#00e5cc',
          borderWidth: 2.5,
          fill: false,
          tension: 0.3,
          pointRadius: 0
        },
        {
          label: 'Línea y = 0',
          data: [{ x: xMin, y: 0 }, { x: xMax, y: 0 }],
          borderColor: 'rgba(255,255,255,0.3)',
          borderWidth: 1.5,
          borderDash: [5, 5],
          fill: false,
          pointRadius: 0
        },
        {
          label: 'Raíces encontradas',
          data: raicesEncontradas,
          type: 'scatter',
          backgroundColor: '#fbbf24',
          pointRadius: 12,
          pointStyle: 'crossRot',
          borderColor: '#fbbf24',
          borderWidth: 3,
          showLine: false
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        title: { display: true, text: 'Gráfico de f(x) y Raíces Encontradas', color: '#1a2340', font: { size: 16 } },
        legend: { labels: { color: '#1a2340', font: { size: 13 } } }
      },
      scales: {
        x: {
          type: 'linear',
          title: { display: true, text: 'x (precio / nivel de producción)', color: '#444', font: { size: 13 } },
          ticks: { color: '#444' }, grid: { color: '#e8edf8' }
        },
        y: {
          title: { display: true, text: 'f(x) (beneficio neto)', color: '#444', font: { size: 13 } },
          ticks: { color: '#444' }, grid: { color: '#e8edf8' }
        }
      }
    }
  });

  document.getElementById('sE_chartDesc').textContent =
    'Gráfico de la función f(x) en el intervalo de búsqueda. Las cruces amarillas marcan las raíces encontradas por los métodos numéricos, es decir, los puntos donde f(x) = 0 (equilibrio económico).';
}

// ── Tarjetas de comparación ──
function mostrarComparacionRaices(resBis, resNewt, resSec) {
  const fmt = v => v !== undefined ? v.toFixed(6) : 'N/A';
  const html = `
    <div class="comp-card">
      <div class="comp-method" style="color:var(--mod-A)">Bisección</div>
      <div class="comp-result" style="color:var(--mod-A)">${resBis.error ? 'Error' : fmt(resBis.raiz)}</div>
      <div class="comp-detail">${resBis.error || resBis.iteraciones + ' iteraciones · Garantizado'}</div>
    </div>
    <div class="comp-card">
      <div class="comp-method" style="color:var(--mod-B)">Newton-Raphson</div>
      <div class="comp-result" style="color:var(--mod-B)">${resNewt.error ? 'Error' : fmt(resNewt.raiz)}</div>
      <div class="comp-detail">${resNewt.error || resNewt.iteraciones + ' iteraciones · Cuadrático'}</div>
    </div>
    <div class="comp-card">
      <div class="comp-method" style="color:var(--mod-C)">Secante</div>
      <div class="comp-result" style="color:var(--mod-C)">${resSec.error ? 'Error' : fmt(resSec.raiz)}</div>
      <div class="comp-detail">${resSec.error || resSec.iteraciones + ' iteraciones · Superlineal'}</div>
    </div>
    <div class="comp-card">
      <div class="comp-method" style="color:var(--mod-E)">Convergencia más rápida</div>
      <div class="comp-result" style="color:var(--mod-E)">${
        [resBis, resNewt, resSec].filter(r => r.raiz !== undefined).sort((a,b) => a.iteraciones - b.iteraciones)[0]
          ? ['Bisección','Newton','Secante'][
              [resBis, resNewt, resSec].indexOf(
                [resBis, resNewt, resSec].filter(r => r.raiz !== undefined).sort((a,b) => a.iteraciones - b.iteraciones)[0]
              )
            ]
          : 'N/A'
      }</div>
      <div class="comp-detail">Según número de iteraciones</div>
    </div>`;
  document.getElementById('sE_comparison').innerHTML = html;
}

// ── Poblar tablas de iteración ──
function poblarTablaRaices(resBis, resNewt, resSec) {
  // Tabla Bisección
  let html = `<thead><tr><th>Iter</th><th>a</th><th>b</th><th>c=(a+b)/2</th><th>f(c)</th><th>Error</th></tr></thead><tbody>`;
  (resBis.historial || []).forEach(h => {
    html += `<tr><td>${h.iter}</td><td>${parseFloat(h.a).toFixed(6)}</td><td>${parseFloat(h.b).toFixed(6)}</td><td>${parseFloat(h.c).toFixed(6)}</td><td>${parseFloat(h.fc).toFixed(6)}</td><td style="color:var(--accent-cyan)">${parseFloat(h.error).toExponential(3)}</td></tr>`;
  });
  if (resBis.error) html += `<tr><td colspan="6" style="color:var(--accent-orange);text-align:center">${resBis.error}</td></tr>`;
  html += '</tbody>';
  document.getElementById('sE_tablaBiseccion').innerHTML = html;

  // Tabla Newton-Raphson
  html = `<thead><tr><th>Iter</th><th>x_n</th><th>f(x_n)</th><th>f'(x_n)</th><th>x_{n+1}</th><th>Error</th></tr></thead><tbody>`;
  (resNewt.historial || []).forEach(h => {
    html += `<tr><td>${h.iter}</td><td>${parseFloat(h.x).toFixed(6)}</td><td>${parseFloat(h.fx).toFixed(6)}</td><td>${parseFloat(h.fpx).toFixed(4)}</td><td>${parseFloat(h.xNuevo).toFixed(6)}</td><td style="color:var(--accent-cyan)">${parseFloat(h.error).toExponential(3)}</td></tr>`;
  });
  if (resNewt.error) html += `<tr><td colspan="6" style="color:var(--accent-orange);text-align:center">${resNewt.error}</td></tr>`;
  html += '</tbody>';
  document.getElementById('sE_tablaNewton').innerHTML = html;

  // Tabla Secante
  html = `<thead><tr><th>Iter</th><th>x_{n-1}</th><th>x_n</th><th>x_{n+1}</th><th>f(x_n)</th><th>Error</th></tr></thead><tbody>`;
  (resSec.historial || []).forEach(h => {
    html += `<tr><td>${h.iter}</td><td>${parseFloat(h.x0).toFixed(6)}</td><td>${parseFloat(h.x1).toFixed(6)}</td><td>${parseFloat(h.x2).toFixed(6)}</td><td>${parseFloat(h.f1).toFixed(6)}</td><td style="color:var(--accent-cyan)">${parseFloat(h.error).toExponential(3)}</td></tr>`;
  });
  if (resSec.error) html += `<tr><td colspan="6" style="color:var(--accent-orange);text-align:center">${resSec.error}</td></tr>`;
  html += '</tbody>';
  document.getElementById('sE_tablaSecante').innerHTML = html;
}

// ── Gráfico de convergencia del error ──
function graficarConvergencia(resBis, resNewt, resSec) {
  if (chartConvergRef) chartConvergRef.destroy();
  const ctx = document.getElementById('chartConvergencia').getContext('2d');
  const datasets = [];

  if (resBis.historial && resBis.historial.length > 0) {
    datasets.push({
      label: 'Bisección',
      data: resBis.historial.map(h => ({ x: h.iter, y: parseFloat(h.error) })),
      borderColor: '#00e5cc', borderWidth: 2, fill: false, tension: 0.3, pointRadius: 4
    });
  }
  if (resNewt.historial && resNewt.historial.length > 0) {
    datasets.push({
      label: 'Newton-Raphson',
      data: resNewt.historial.map(h => ({ x: h.iter, y: parseFloat(h.error) })),
      borderColor: '#ff6b35', borderWidth: 2, fill: false, tension: 0.3, pointRadius: 4
    });
  }
  if (resSec.historial && resSec.historial.length > 0) {
    datasets.push({
      label: 'Secante',
      data: resSec.historial.map(h => ({ x: h.iter, y: parseFloat(h.error) })),
      borderColor: '#4a9eff', borderWidth: 2, fill: false, tension: 0.3, pointRadius: 4
    });
  }

  chartConvergRef = new Chart(ctx, {
    type: 'line',
    data: { datasets },
    options: {
      responsive: true,
      plugins: {
        title: { display: true, text: 'Convergencia del Error por Iteración', color: '#1a2340', font: { size: 16 } },
        legend: { labels: { color: '#1a2340', font: { size: 13 } } }
      },
      scales: {
        x: {
          type: 'linear',
          title: { display: true, text: 'Iteración n', color: '#444', font: { size: 13 } },
          ticks: { color: '#444' }, grid: { color: '#e8edf8' }
        },
        y: {
          type: 'logarithmic',
          title: { display: true, text: 'Error absoluto (log)', color: '#444', font: { size: 13 } },
          ticks: { color: '#444' }, grid: { color: '#e8edf8' }
        }
      }
    }
  });
}

// ── Interpretación automática ──
function interpretarRaices(resBis, resNewt, resSec, expr, a, b) {
  const raizRef = resBis.raiz !== undefined ? resBis.raiz : (resNewt.raiz || resSec.raiz);
  const fRaiz   = raizRef !== undefined ? evalF(expr, raizRef) : NaN;
  const expresionLegible = document.getElementById('sE_funcion').value;

  let html = `<h3>🔍 Interpretación Económica del Resultado</h3>`;

  if (raizRef !== undefined) {
    html += `<p><strong style="color:black;">Raíz encontrada: x* = ${raizRef.toFixed(6)}</strong>. Este valor satisface f(x*) ≈ 0 (f(x*) = ${fRaiz.toFixed(8)}), indicando que en x = ${raizRef.toFixed(4)} los ingresos y costos se equilibran exactamente.</p>`;
    html += `<p><strong style="color:black;">Interpretación económica:</strong> Para la función f(x) = ${expresionLegible}, la raíz x* = ${raizRef.toFixed(4)} representa el <strong style="color:black;">precio o nivel de producción de punto de equilibrio</strong>. Por debajo de este valor, la familia gasta más de lo que ingresa; por encima, existe excedente.</p>`;
  } else {
    html += `<p>⚠ No se encontró una raíz en el intervalo [${a}, ${b}]. Verifique que f(a) y f(b) tienen signos opuestos o amplíe el intervalo de búsqueda.</p>`;
  }

  html += `
    <p><strong style="color:black;">Velocidades de convergencia:</strong></p>
    <p>• <strong style="color:black;">Bisección:</strong> ${resBis.iteraciones || 'N/A'} iteraciones — convergencia lineal O(1/2^n), robusta pero lenta.</p>
    <p>• <strong style="color:black;">Newton-Raphson:</strong> ${resNewt.iteraciones || 'N/A'} iteraciones — convergencia cuadrática O(e_n²), muy rápido cerca de la raíz.</p>
    <p>• <strong style="color:black;">Secante:</strong> ${resSec.iteraciones || 'N/A'} iteraciones — convergencia de orden 1.618 (áureo), compromiso entre velocidad y simplicidad.</p>
    <p><strong style="color:black;">Conclusión:</strong> Newton-Raphson es el método más eficiente cuando la función es diferenciable y la estimación inicial está cerca de la raíz. Bisección es el más confiable cuando sólo se conoce el intervalo de cambio de signo.</p>
  `;

  document.getElementById('sE_interpretation').innerHTML = html;
}
