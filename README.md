# Simulación Numérica del Abastecimiento, Precios y Economía Familiar en Contexto de Crisis

> Proyecto Final — Materia: Métodos Numéricos  
> Universidad Mayor de San Andres · 2026

---

## 🌐 Demo en GitHub Pages

Una vez publicado, la página estará disponible en:
```
https://anthonyx20.github.io/ProyectoFinal-MetodosNumericos/
```


## 📋 Descripción

Aplicación web interactiva que aplica cinco familias de métodos numéricos computacionales para modelar y analizar escenarios de crisis económica: distribución de recursos, evolución de reservas, proyección de precios y costo acumulado de la canasta familiar.

---

## 🧮 Módulos Implementados

| Módulo | Tema | Métodos |
|--------|------|---------|
| **A** | Sistemas de Ecuaciones Lineales | Jacobi · Gauss-Seidel · LU · SOR · Gradiente Conjugado |
| **B** | Ecuaciones Diferenciales Ordinarias | Euler · Heun · Runge-Kutta 4 |
| **C** | Interpolación de Precios | Lagrange · Newton (D.D.) · Splines Cúbicos |
| **D** | Integración Numérica | Trapecio · Simpson 1/3 · Simpson 3/8 |
| **E** | Raíces de Ecuaciones | Bisección · Newton-Raphson · Secante |

---

## 📁 Estructura del Proyecto

```
simulacion_numerica/
├── index.html              ← Página principal (toda la estructura HTML)
├── .nojekyll               ← Evita que GitHub Pages procese con Jekyll
├── README.md               ← Este archivo
├── css/
│   └── styles.css          ← Estilos globales, variables, responsive
└── js/
    ├── sistemas.js         ← Módulo A: Sistemas de ecuaciones lineales
    ├── diferenciales.js    ← Módulo B: Ecuaciones diferenciales
    ├── interpolacion.js    ← Módulo C: Interpolación de precios
    ├── integracion.js      ← Módulo D: Integración numérica
    └── raices.js           ← Módulo E: Raíces de ecuaciones
```

---

## 🛠️ Tecnologías Utilizadas

- **HTML5** — Estructura semántica y formularios interactivos
- **CSS3** — Variables CSS, Grid, Flexbox, animaciones, diseño responsive
- **JavaScript ES6+** — Algoritmos numéricos, lógica de UI, Chart.js
- **[Chart.js 4.4](https://www.chartjs.org/)** — Gráficos interactivos (CDN)
- **[KaTeX](https://katex.org/)** — Renderizado de fórmulas matemáticas (CDN)

Sin backend. Sin dependencias locales. Todo corre en el navegador.

---

## ✅ Compatibilidad

- ✅ Chrome / Edge / Firefox / Safari (versiones modernas)
- ✅ Responsive: celular, tablet y escritorio
- ✅ GitHub Pages (sin servidor)
- ✅ Sin cookies ni datos de usuario

---

## 📚 Referencias

- Özsu, M.T. & Valduriez, P. — *Principles of Distributed Database Systems*
- Chapra, S. & Canale, R. — *Numerical Methods for Engineers*
- Burden, R.L. & Faires, J.D. — *Numerical Analysis*

*Proyecto académico — uso educativo*
