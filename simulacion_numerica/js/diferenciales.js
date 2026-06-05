/**
 * diferenciales.js — Módulo B: Ecuaciones Diferenciales Ordinarias
 * Métodos: Euler, Heun (Euler mejorado), Runge-Kutta 4
 * Modelo: R'(t) = entrada − consumo  →  dinámica de reservas de combustible
 */

let chartDifRef = null;

/**
 * Función de la EDO: dR/dt = entrada - consumo
 * En este modelo, la tasa de cambio de la reserva es
 * la diferencia entre el suministro diario y la demanda diaria.
 * Si consumo > entrada, la reserva decrece (crisis de abastecimiento).
 */
function fEDO(t, R, entrada, consumo) {
  return entrada - consumo;
}

// ─────────────────────────────────────────────
// MÉTODO 1: Euler Explícito (orden 1)
// R_{n+1} = R_n + h * f(t_n, R_n)
// Error global: O(h)  — el más simple pero menos preciso
// ─────────────────────────────────────────────
function metodoEuler(R0, entrada, consumo, h, pasos) {
  let t = 0, R = R0;
  let datos = [{ t: 0, R: R0 }];

  for (let i = 0; i < pasos; i++) {
    let k = fEDO(t, R, entrada, consumo);
    R = R + h * k;
    R = Math.max(0, R); // Las reservas no pueden ser negativas
    t = t + h;
    datos.push({ t: parseFloat(t.toFixed(4)), R: parseFloat(R.toFixed(4)) });
  }
  return datos;
}

// ─────────────────────────────────────────────
// MÉTODO 2: Heun (Euler predictor-corrector, orden 2)
// Predictor: R* = R_n + h * f(t_n, R_n)
// Corrector: R_{n+1} = R_n + (h/2)*[f(t_n, R_n) + f(t_{n+1}, R*)]
// Error global: O(h²) — más preciso que Euler con sólo un paso extra
// ─────────────────────────────────────────────
function metodoHeun(R0, entrada, consumo, h, pasos) {
  let t = 0, R = R0;
  let datos = [{ t: 0, R: R0 }];

  for (let i = 0; i < pasos; i++) {
    let k1 = fEDO(t, R, entrada, consumo);
    let RPred = R + h * k1;
    let k2 = fEDO(t + h, RPred, entrada, consumo);
    R = R + (h / 2) * (k1 + k2);
    R = Math.max(0, R);
    t = t + h;
    datos.push({ t: parseFloat(t.toFixed(4)), R: parseFloat(R.toFixed(4)) });
  }
  return datos;
}

// ─────────────────────────────────────────────
// MÉTODO 3: Runge-Kutta de 4to orden (RK4)
// k1 = f(t_n, R_n)
// k2 = f(t_n + h/2, R_n + (h/2)*k1)
// k3 = f(t_n + h/2, R_n + (h/2)*k2)
// k4 = f(t_n + h,   R_n + h*k3)
// R_{n+1} = R_n + (h/6)*(k1 + 2k2 + 2k3 + k4)
// Error global: O(h⁴) — método estándar para ODEs suaves
// ─────────────────────────────────────────────
function metodoRK4(R0, entrada, consumo, h, pasos) {
  let t = 0, R = R0;
  let datos = [{ t: 0, R: R0 }];

  for (let i = 0; i < pasos; i++) {
    let k1 = fEDO(t,         R,               entrada, consumo);
    let k2 = fEDO(t + h/2,   R + (h/2)*k1,   entrada, consumo);
    let k3 = fEDO(t + h/2,   R + (h/2)*k2,   entrada, consumo);
    let k4 = fEDO(t + h,     R + h*k3,        entrada, consumo);
    R = R + (h / 6) * (k1 + 2*k2 + 2*k3 + k4);
    R = Math.max(0, R);
    t = t + h;
    datos.push({ t: parseFloat(t.toFixed(4)), R: parseFloat(R.toFixed(4)) });
  }
  return datos;
}

// ─────────────────────────────────────────────
// SOLUCIÓN ANALÍTICA EXACTA
// R(t) = R0 + (entrada - consumo) * t  [para tasa constante]
// ─────────────────────────────────────────────
function solucionAnalitica(R0, entrada, consumo, tFinal, h) {
  let datos = [];
  for (let t = 0; t <= tFinal + h/2; t += h) {
    let R = Math.max(0, R0 + (entrada - consumo) * t);
    datos.push({ t: parseFloat(t.toFixed(4)), R: parseFloat(R.toFixed(4)) });
  }
  return datos;
}

// ─────────────────────────────────────────────
// FUNCIÓN PRINCIPAL
// ─────────────────────────────────────────────
function resolverDiferenciales() {
  const R0      = parseFloat(document.getElementById('sB_r0').value);
  const entrada = parseFloat(document.getElementById('sB_entrada').value);
  const consumo = parseFloat(document.getElementById('sB_consumo').value);
  const tiempo  = parseFloat(document.getElementById('sB_tiempo').value);
  const h       = parseFloat(document.getElementById('sB_h').value);

  if (isNaN(R0) || isNaN(entrada) || isNaN(consumo) || isNaN(tiempo) || isNaN(h) || h <= 0) {
    alert('Por favor, verifique que todos los parámetros son válidos y el paso h > 0');
    return;
  }

  const pasos = Math.round(tiempo / h);

  const datoEuler = metodoEuler(R0, entrada, consumo, h, pasos);
  const datoHeun  = metodoHeun(R0, entrada, consumo, h, pasos);
  const datoRK4   = metodoRK4(R0, entrada, consumo, h, pasos);
  const datoExacta = solucionAnalitica(R0, entrada, consumo, tiempo, h);

  // Gráfico comparativo
  graficarDiferenciales(datoEuler, datoHeun, datoRK4, datoExacta);

  // Tabla
  construirTablaDiferenciales(datoEuler, datoHeun, datoRK4, datoExacta, h);

  // Tarjetas de comparación
  mostrarComparacionDif(datoEuler, datoHeun, datoRK4, datoExacta, R0, entrada, consumo, tiempo);

  // Interpretación
  interpretarDiferenciales(R0, entrada, consumo, tiempo, datoRK4);

  document.getElementById('sB_results').classList.remove('hidden');
  document.getElementById('sB_results').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ── Gráfico de curvas comparativas ──
function graficarDiferenciales(euler, heun, rk4, exacta) {
  if (chartDifRef) chartDifRef.destroy();
  const ctx = document.getElementById('chartDiferenciales').getContext('2d');

  chartDifRef = new Chart(ctx, {
    type: 'line',
    data: {
      datasets: [
        {
          label: 'Solución Exacta',
          data: exacta.map(d => ({ x: d.t, y: d.R })),
          borderColor: '#ffffff',
          borderWidth: 2.5,
          borderDash: [8, 4],
          fill: false,
          tension: 0,
          pointRadius: 0
        },
        {
          label: 'RK4 (orden 4)',
          data: rk4.map(d => ({ x: d.t, y: d.R })),
          borderColor: '#00e5cc',
          borderWidth: 2.5,
          fill: { target: 'origin', above: 'rgba(0,229,204,0.05)' },
          tension: 0.2,
          pointRadius: 0
        },
        {
          label: 'Heun (orden 2)',
          data: heun.map(d => ({ x: d.t, y: d.R })),
          borderColor: '#ff6b35',
          borderWidth: 2,
          fill: false,
          tension: 0.2,
          pointRadius: 0
        },
        {
          label: 'Euler (orden 1)',
          data: euler.map(d => ({ x: d.t, y: d.R })),
          borderColor: '#4a9eff',
          borderWidth: 2,
          fill: false,
          tension: 0.2,
          pointRadius: 0
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        title: { display: true, text: 'Evolución de Reservas de Combustible R(t)', color: '#e8edf8', font: { size: 16 } },
        legend: { labels: { color: '#e8edf8', font: { size: 13 } } }
      },
      scales: {
        x: {
          type: 'linear',
          title: { display: true, text: 'Tiempo t (días)', color: '#8892a4', font: { size: 13 } },
          ticks: { color: '#8892a4' }, grid: { color: '#1e2d4a' }
        },
        y: {
          title: { display: true, text: 'Reserva R(t) (toneladas)', color: '#8892a4', font: { size: 13 } },
          ticks: { color: '#8892a4' }, grid: { color: '#1e2d4a' }
        }
      }
    }
  });

  document.getElementById('sB_chartDesc').textContent =
    'Evolución temporal de las reservas de combustible simuladas con tres métodos numéricos y la solución analítica exacta. Las diferencias entre curvas revelan el error de cada método de integración numérica.';
}

// ── Construir tabla comparativa ──
function construirTablaDiferenciales(euler, heun, rk4, exacta, h) {
  const n = Math.min(euler.length, 20); // Mostrar máximo 20 filas
  const paso = Math.max(1, Math.floor(euler.length / n));

  let html = `<thead><tr>
    <th>t (días)</th>
    <th>Exacta</th>
    <th>Euler</th>
    <th>Err. Euler</th>
    <th>Heun</th>
    <th>Err. Heun</th>
    <th>RK4</th>
    <th>Err. RK4</th>
  </tr></thead><tbody>`;

  for (let i = 0; i < euler.length; i += paso) {
    const t = euler[i].t;
    const eEx = exacta[i] ? exacta[i].R : euler[i].R;
    const eEu = euler[i].R;
    const eHe = heun[i].R;
    const eRK = rk4[i].R;
    const errEu = Math.abs(eEx - eEu).toFixed(4);
    const errHe = Math.abs(eEx - eHe).toFixed(4);
    const errRK = Math.abs(eEx - eRK).toFixed(6);

    html += `<tr>
      <td>${t.toFixed(2)}</td>
      <td>${eEx.toFixed(4)}</td>
      <td>${eEu.toFixed(4)}</td>
      <td style="color:${parseFloat(errEu)>1?'var(--accent-orange)':'inherit'}">${errEu}</td>
      <td>${eHe.toFixed(4)}</td>
      <td>${errHe}</td>
      <td>${eRK.toFixed(4)}</td>
      <td style="color:var(--accent-cyan)">${errRK}</td>
    </tr>`;
  }
  html += '</tbody>';
  document.getElementById('sB_table').innerHTML = html;
}

// ── Tarjetas de comparación ──
function mostrarComparacionDif(euler, heun, rk4, exacta, R0, entrada, consumo, tiempo) {
  const tasaNeta = entrada - consumo;
  const tAgotamiento = tasaNeta < 0 ? -(R0 / tasaNeta) : null;
  const finalEuler = euler[euler.length - 1].R;
  const finalRK4   = rk4[rk4.length - 1].R;
  const finalExacta = exacta[exacta.length - 1].R;
  const errorEuler = Math.abs(finalExacta - finalEuler).toFixed(4);
  const errorRK4   = Math.abs(finalExacta - finalRK4).toFixed(6);

  const cards = [
    { metodo: 'Euler (O(h))', valor: finalEuler.toFixed(2), detalle: `Error final: ${errorEuler} ton`, color: 'var(--mod-C)' },
    { metodo: 'Heun (O(h²))', valor: heun[heun.length-1].R.toFixed(2), detalle: `Error reducido por h²`, color: 'var(--mod-B)' },
    { metodo: 'RK4 (O(h⁴))', valor: finalRK4.toFixed(2), detalle: `Error final: ${errorRK4} ton`, color: 'var(--mod-A)' },
    { metodo: tAgotamiento ? '⚠ Agotamiento' : '✓ Sin déficit', valor: tAgotamiento ? `Día ${tAgotamiento.toFixed(1)}` : 'Estable', detalle: tAgotamiento ? 'Reservas llegan a cero' : 'Tasa de entrada ≥ consumo', color: tAgotamiento ? 'var(--accent-orange)' : 'var(--mod-A)' }
  ];

  let html = '';
  cards.forEach(c => {
    html += `<div class="comp-card">
      <div class="comp-method" style="color:${c.color}">${c.metodo}</div>
      <div class="comp-result" style="color:${c.color}">R(${Math.round(euler[euler.length-1].t)}) = ${c.valor}</div>
      <div class="comp-detail">${c.detalle}</div>
    </div>`;
  });
  document.getElementById('sB_comparison').innerHTML = html;
}

// ── Interpretación automática ──
function interpretarDiferenciales(R0, entrada, consumo, tiempo, rk4) {
  const tasaNeta = entrada - consumo;
  const tAgotamiento = tasaNeta < 0 ? (R0 / (-tasaNeta)).toFixed(1) : null;
  const Rfinal = rk4[rk4.length - 1].R;

  let html = `<h3>🔍 Interpretación del Resultado</h3>`;

  if (tAgotamiento) {
    html += `<p>⚠ <strong>ALERTA DE CRISIS:</strong> Con una entrada de ${entrada} ton/día y un consumo de ${consumo} ton/día, la tasa neta es <strong>${tasaNeta.toFixed(1)} ton/día</strong> (negativa). Las reservas se <strong>agotarán aproximadamente en el día ${tAgotamiento}</strong>. Este es el momento crítico para activar planes de emergencia o reducir el consumo.</p>`;
  } else {
    html += `<p>✅ <strong>Sistema estable:</strong> Con entrada ${entrada} ton/día y consumo ${consumo} ton/día, la tasa neta es <strong>+${tasaNeta.toFixed(1)} ton/día</strong>. Las reservas crecen continuamente. Al final de los ${tiempo} días, la reserva proyectada es <strong>${Rfinal.toFixed(1)} toneladas</strong>.</p>`;
  }

  html += `
    <p><strong>Precisión numérica:</strong> RK4 es el método más preciso con error global O(h⁴). Para h = 1 día, el error de RK4 es típicamente miles de veces menor que Euler. Para simulaciones de decisiones críticas (abastecimiento de emergencia), siempre se recomienda RK4.</p>
    <p><strong>Reserva inicial R₀ = ${R0} toneladas:</strong> Corresponde al stock disponible al inicio de la simulación. Un R₀ mayor da más tiempo de reacción en caso de crisis de abastecimiento.</p>
    <p><strong>Recomendación:</strong> ${tasaNeta < 0 ? `Aumentar la entrada diaria en al menos ${Math.abs(tasaNeta).toFixed(1)} ton/día o reducir el consumo para mantener un balance positivo y garantizar suministro continuo.` : 'Mantener el actual balance positivo como colchón de seguridad para imprevistos de demanda.'}</p>
  `;

  document.getElementById('sB_interpretation').innerHTML = html;
}
