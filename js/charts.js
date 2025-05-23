let cpuChart;
let memoryChart;
let networkChart;

const MAX_HISTORY_POINTS = 30; 
const labels = []; 

const cpuUsageHistory = [];
const memoryUsageHistory = [];
const networkDownloadHistory = [];
const networkUploadHistory = [];
const networkLatencyHistory = [];

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

    const commonChartOptions = {
        responsive: true,
        maintainAspectRatio: false, 
        animation: {
            duration: 0 
        },
        scales: {
            x: {
                type: 'category', 
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
                        return value + '%'; 
                    }
                },
                grid: {
                    display: true,
                    color: 'rgba(0, 0, 0, 0.1)'
                }
            }
        },
        plugins: {
            legend: {
                display: false
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
                tension: 0.1,
                pointRadius: 4,
                pointBackgroundColor: 'rgb(75, 192, 192)',
                pointBorderColor: '#fff', 
                pointHoverRadius: 6,
                pointHoverBackgroundColor: 'rgb(75, 192, 192)',
                pointHoverBorderColor: 'rgba(220,220,220,1)'
            }]
        },
        options: {
            ...commonChartOptions,
            scales: {
                ...commonChartOptions.scales,
                y: {
                    ...commonChartOptions.scales.y,
                    min: 0, 
                    max: 100,
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
                tension: 0.1,
                pointRadius: 4,
                pointBackgroundColor: 'rgb(255, 99, 132)',
                pointBorderColor: '#fff',
                pointHoverRadius: 6,
                pointHoverBackgroundColor: 'rgb(255, 99, 132)',
                pointHoverBorderColor: 'rgba(220,220,220,1)'
            }]
        },
        options: {
            ...commonChartOptions,
            scales: {
                ...commonChartOptions.scales,
                y: {
                    ...commonChartOptions.scales.y,
                    min: 0,  
                    max: 100, 
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
                    fill: false,
                    tension: 0.1,
                    yAxisID: 'yDownload',
                    pointRadius: 4,
                    pointBackgroundColor: 'rgb(54, 162, 235)',
                    pointBorderColor: '#fff',
                    pointHoverRadius: 6,
                    pointHoverBackgroundColor: 'rgb(54, 162, 235)',
                    pointHoverBorderColor: 'rgba(220,220,220,1)'
                },
                {
                    label: 'Subida (Mbps)',
                    data: networkUploadHistory,
                    borderColor: 'rgb(255, 159, 64)',
                    backgroundColor: 'rgba(255, 159, 64, 0.2)',
                    fill: false,
                    tension: 0.1,
                    yAxisID: 'yUpload',
                    pointRadius: 4,
                    pointBackgroundColor: 'rgb(255, 159, 64)',
                    pointBorderColor: '#fff',
                    pointHoverRadius: 6,
                    pointHoverBackgroundColor: 'rgb(255, 159, 64)',
                    pointHoverBorderColor: 'rgba(220,220,220,1)'
                },
                 {
                    label: 'Latencia (ms)',
                    data: networkLatencyHistory,
                    borderColor: 'rgb(153, 102, 255)',
                    backgroundColor: 'rgba(153, 102, 255, 0.2)',
                    fill: false,
                    tension: 0.1,
                    yAxisID: 'yLatency',
                    pointRadius: 4,
                    pointBackgroundColor: 'rgb(153, 102, 255)',
                    pointBorderColor: '#fff',
                    pointHoverRadius: 6,
                    pointHoverBackgroundColor: 'rgb(153, 102, 255)',
                    pointHoverBorderColor: 'rgba(220,220,220,1)'
                }
            ]
        },
        options: {
            ...commonChartOptions,
            scales: {
                x: {
                    ...commonChartOptions.scales.x,
                },
                yDownload: { 
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
                    },
                    grid: { 
                        display: true,
                        color: 'rgba(0, 0, 0, 0.1)'
                    }
                },
                yUpload: { 
                    type: 'linear',
                    position: 'left', 
                    beginAtZero: true,
                    title: {
                        display: false 
                    },
                     grid: {
                         drawOnChartArea: false, 
                         display: true, 
                         color: 'rgba(0, 0, 0, 0.1)'
                     },
                    ticks: {
                        callback: function(value) {
                            return value + ' Mbps';
                        }
                    }
                },
                yLatency: { 
                    type: 'linear',
                    position: 'right',
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Latencia (ms)'
                    },
                    grid: {
                        drawOnChartArea: false, 
                        display: true, 
                        color: 'rgba(0, 0, 0, 0.1)'
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
                    display: true
                }
            }
        }
    });
    console.log("Network Chart creado.");
    console.log("Gráficos inicializados con éxito.");
}

/**
 * 
 * @param {object} data 
 * @param {number} memoryUsagePercent 
 */
function updateCharts(data, memoryUsagePercent) {
    console.log("INTENTO: Actualizando gráficos con nuevos datos...");
    const currentTime = new Date().toLocaleTimeString('es-ES');
    labels.push(currentTime);
    cpuUsageHistory.push(data.cpu.usage_percentage || 0);
    
    memoryUsageHistory.push(memoryUsagePercent || 0); 
    
    networkDownloadHistory.push(data.network.download_mbps || 0);
    networkUploadHistory.push(data.network.upload_mbps || 0);
    networkLatencyHistory.push(data.network.latency_ms || 0);

    if (labels.length > MAX_HISTORY_POINTS) {
        labels.shift();
        cpuUsageHistory.shift();
        memoryUsageHistory.shift();
        networkDownloadHistory.shift();
        networkUploadHistory.shift();
        networkLatencyHistory.shift();
    }

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