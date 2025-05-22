// Variables para almacenar las instancias de Chart.js
let cpuChart;
let memoryChart;
let networkChart;

// Arrays para almacenar el historial de datos
const MAX_HISTORY_POINTS = 30; // Número máximo de puntos en el historial
const labels = []; // Etiquetas de tiempo para el eje X

const cpuUsageHistory = [];
const memoryUsageHistory = [];
const networkDownloadHistory = [];
const networkUploadHistory = [];
const networkLatencyHistory = [];

/**
 * Inicializa todos los gráficos del dashboard.
 * Se llama una vez al cargar la página.
 */
function initializeCharts() {
    console.log("INTENTO: Inicializando gráficos...");

    const cpuCanvas = document.getElementById('cpu-chart');
    const memoryCanvas = document.getElementById('memory-chart');
    const networkCanvas = document.getElementById('network-chart');

    if (!cpuCanvas) { console.error("ERROR: No se encontró el canvas #cpu-chart."); return; }
    if (!memoryCanvas) { console.error("ERROR: No se encontró el canvas #memory-chart."); return; }
    if (!networkCanvas) { console.error("ERROR: No se encontró el canvas #network-chart."); return; }

    const cpuCtx = cpuCanvas.getContext('2d');
    const memoryCtx = memoryCanvas.getContext('2d');
    const networkCtx = networkCanvas.getContext('2d');

    if (!cpuCtx) { console.error("ERROR: No se pudo obtener el contexto 2D para #cpu-chart."); return; }
    if (!memoryCtx) { console.error("ERROR: No se pudo obtener el contexto 2D para #memory-chart."); return; }
    if (!networkCtx) { console.error("ERROR: No se pudo obtener el contexto 2D para #network-chart."); return; }

    console.log("ÉXITO: Se encontraron todos los canvas y se obtuvieron los contextos 2D.");

    // Configuración base para todos los gráficos
    const commonChartOptions = {
        responsive: true,
        maintainAspectRatio: false, // Permite que los gráficos se adapten a su contenedor
        animation: {
            duration: 0 // Deshabilita la animación para actualizaciones rápidas
        },
        scales: {
            x: {
                type: 'category', // O 'timeseries' si usas fechas exactas
                labels: labels,
                title: {
                    display: true,
                    text: 'Tiempo'
                }
            },
            y: {
                beginAtZero: true,
                title: {
                    display: true,
                    text: 'Valor'
                },
                ticks: {
                    callback: function(value) {
                        return value + '%'; // Por defecto para porcentajes
                    }
                }
            }
        },
        plugins: {
            legend: {
                display: false // O true si tienes múltiples datasets
            },
            tooltip: {
                mode: 'index',
                intersect: false,
            }
        }
    };

    // --- CPU Chart ---
    cpuChart = new Chart(cpuCtx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Uso de CPU',
                data: cpuUsageHistory,
                borderColor: 'rgb(75, 192, 192)',
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                fill: true,
                tension: 0.1
            }]
        },
        options: {
            ...commonChartOptions,
            scales: {
                ...commonChartOptions.scales,
                y: {
                    ...commonChartOptions.scales.y,
                    title: {
                        display: true,
                        text: 'Uso (%)'
                    }
                }
            },
            plugins: {
                ...commonChartOptions.plugins,
                legend: {
                    display: true
                }
            }
        }
    });
    console.log("CPU Chart creado.");

    // --- Memory Chart ---
    memoryChart = new Chart(memoryCtx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Uso de Memoria',
                data: memoryUsageHistory,
                borderColor: 'rgb(255, 99, 132)',
                backgroundColor: 'rgba(255, 99, 132, 0.2)',
                fill: true,
                tension: 0.1
            }]
        },
        options: {
            ...commonChartOptions,
            scales: {
                ...commonChartOptions.scales,
                y: {
                    ...commonChartOptions.scales.y,
                    title: {
                        display: true,
                        text: 'Uso (%)'
                    }
                }
            },
            plugins: {
                ...commonChartOptions.plugins,
                legend: {
                    display: true
                }
            }
        }
    });
    console.log("Memory Chart creado.");


    // --- Network Chart ---
    networkChart = new Chart(networkCtx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Descarga (Mbps)',
                    data: networkDownloadHistory,
                    borderColor: 'rgb(54, 162, 235)',
                    backgroundColor: 'rgba(54, 162, 235, 0.2)',
                    fill: false, // No rellenar para ver ambas líneas claramente
                    tension: 0.1,
                    yAxisID: 'yDownload'
                },
                {
                    label: 'Subida (Mbps)',
                    data: networkUploadHistory,
                    borderColor: 'rgb(255, 159, 64)',
                    backgroundColor: 'rgba(255, 159, 64, 0.2)',
                    fill: false,
                    tension: 0.1,
                    yAxisID: 'yUpload'
                },
                 {
                    label: 'Latencia (ms)',
                    data: networkLatencyHistory,
                    borderColor: 'rgb(153, 102, 255)',
                    backgroundColor: 'rgba(153, 102, 255, 0.2)',
                    fill: false,
                    tension: 0.1,
                    yAxisID: 'yLatency' // Nuevo eje Y para latencia
                }
            ]
        },
        options: {
            ...commonChartOptions,
            scales: {
                x: {
                    ...commonChartOptions.scales.x,
                },
                yDownload: { // Eje Y para descarga
                    type: 'linear',
                    position: 'left',
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Mbps'
                    },
                    ticks: {
                        callback: function(value) {
                            return value + ' Mbps';
                        }
                    }
                },
                yUpload: { // Eje Y para subida (puede compartir con descarga o tener su propio eje si los rangos son muy diferentes)
                    type: 'linear',
                    position: 'left', // Puede ser 'right' si quieres separarlo visualmente
                    beginAtZero: true,
                    title: {
                        display: false // Ocultar si comparte la misma escala que descarga
                    },
                     grid: {
                         drawOnChartArea: false // Evitar que las líneas de la cuadrícula se dibujen dos veces
                     },
                    ticks: {
                        callback: function(value) {
                            return value + ' Mbps';
                        }
                    }
                },
                yLatency: { // Nuevo eje Y para latencia
                    type: 'linear',
                    position: 'right', // Colocar en el lado derecho
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Latencia (ms)'
                    },
                    grid: {
                        drawOnChartArea: false // No dibujar la cuadrícula para este eje
                    },
                    ticks: {
                        callback: function(value) {
                            return value + ' ms';
                        }
                    }
                }
            },
            plugins: {
                ...commonChartOptions.plugins,
                legend: {
                    display: true // Mostrar leyenda para múltiples datasets
                }
            }
        }
    });
    console.log("Network Chart creado.");
    console.log("Gráficos inicializados con éxito.");
}

/**
 * Actualiza los gráficos con los nuevos datos recibidos.
 * @param {object} data - El objeto JSON con las últimas métricas.
 */
function updateCharts(data) {
    console.log("INTENTO: Actualizando gráficos con nuevos datos...");
    // Añadir el nuevo punto de datos
    const currentTime = new Date().toLocaleTimeString('es-ES');
    labels.push(currentTime);
    cpuUsageHistory.push(data.cpu.usage_percentage || 0);
    // Asegurarse de que memoryUsage esté definido y sea un número antes de usarlo
    const memoryUsage = ((data.memory.used_gb || 0) / (data.memory.total_gb || 1)) * 100;
    memoryUsageHistory.push(parseFloat(memoryUsage.toFixed(1)) || 0); // Asegurarse de que sea número
    networkDownloadHistory.push(data.network.download_mbps || 0);
    networkUploadHistory.push(data.network.upload_mbps || 0);
    networkLatencyHistory.push(data.network.latency_ms || 0);

    // Mantener solo el número máximo de puntos en el historial
    if (labels.length > MAX_HISTORY_POINTS) {
        labels.shift();
        cpuUsageHistory.shift();
        memoryUsageHistory.shift();
        networkDownloadHistory.shift();
        networkUploadHistory.shift();
        networkLatencyHistory.shift();
    }

    // Actualizar los gráficos
    if (cpuChart) {
        cpuChart.update();
        console.log("CPU Chart actualizado.");
    } else {
        console.warn("CPU Chart no inicializado, no se puede actualizar.");
    }
    if (memoryChart) {
        memoryChart.update();
        console.log("Memory Chart actualizado.");
    } else {
        console.warn("Memory Chart no inicializado, no se puede actualizar.");
    }
    if (networkChart) {
        networkChart.update();
        console.log("Network Chart actualizado.");
    } else {
        console.warn("Network Chart no inicializado, no se puede actualizar.");
    }
    console.log("FIN: Intento de actualización de gráficos.");
}