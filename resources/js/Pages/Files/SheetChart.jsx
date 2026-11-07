import React, { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';

const CHART_COLORS = [
  '#4285F4',
  '#34A853',
  '#FBBC04',
  '#EA4335',
  '#A142F4',
  '#24C1E0',
];

export default function SheetChart({ chart, height = 300 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current || !chart?.datasets?.length) return undefined;
    const isPie = chart.type === 'pie';
    const instance = new Chart(canvasRef.current, {
      type: chart.type,
      data: {
        labels: chart.labels,
        datasets: chart.datasets.map((dataset, index) => ({
          ...dataset,
          backgroundColor: isPie
            ? CHART_COLORS
            : `${CHART_COLORS[index % CHART_COLORS.length]}33`,
          borderColor: isPie
            ? CHART_COLORS
            : CHART_COLORS[index % CHART_COLORS.length],
          borderWidth: isPie ? 1 : 2,
          tension: chart.type === 'line' ? 0.3 : 0,
          fill: false,
        })),
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: isPie || chart.datasets.length > 1, position: 'bottom' },
          title: { display: Boolean(chart.title), text: chart.title },
        },
        scales: isPie ? {} : {
          x: { grid: { color: '#e5e7eb' } },
          y: { beginAtZero: true, grid: { color: '#e5e7eb' } },
        },
      },
    });

    return () => instance.destroy();
  }, [chart]);

  return (
    <div style={{ height }} className="relative w-full">
      <canvas ref={canvasRef} role="img" aria-label={chart.title || 'Graphique du tableur'} />
    </div>
  );
}
