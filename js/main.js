async function fetchAndDisplaySystemStats() {
    try {
        const response = await fetch('/json/system_stats.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();

        document.getElementById('server-name').textContent = data.hostname || 'N/A';
        document.getElementById('server-ip').textContent = data.ip || 'N/A';
        document.getElementById('server-os').textContent = data.os || 'N/A';
        document.getElementById('server-uptime').textContent = data.uptime || 'N/A';
        document.getElementById('server-temp').textContent = `${data.temperature_celsius || 0}°C`;
        document.getElementById('server-location').textContent = data.location || 'N/A';

        const cpuUsage = data.cpu.usage_percentage || 0;
        document.getElementById('cpu-gauge').style.width = `${cpuUsage}%`;
        document.getElementById('cpu-percentage').textContent = `${cpuUsage}%`;
        document.getElementById('cpu-cores').textContent = data.cpu.cores || 'N/A';
        // Update status indicator for CPU
        const cpuStatusIndicator = document.querySelector('.status-card[data-type="cpu"] .status-indicator');
        if (cpuUsage < 70) {
            cpuStatusIndicator.className = 'status-indicator healthy';
        } else if (cpuUsage < 90) {
            cpuStatusIndicator.className = 'status-indicator warning';
        } else {
            cpuStatusIndicator.className = 'status-indicator critical';
        }

        const memoryUsedGb = data.memory.used_gb || 0;
        const memoryTotalGb = data.memory.total_gb || 0;
        let memoryUsage = 0; // Esta es la variable que calculamos
        if (memoryTotalGb > 0) {
            memoryUsage = (memoryUsedGb / memoryTotalGb) * 100;
        }
        document.getElementById('memory-gauge').style.width = `${memoryUsage.toFixed(1)}%`;
        document.getElementById('memory-percentage').textContent = `${memoryUsage.toFixed(1)}%`;
        document.getElementById('memory-total').textContent = `${memoryTotalGb} GB`;
        // Update status indicator for Memory
        const memoryStatusIndicator = document.querySelector('.status-card[data-type="memory"] .status-indicator');
        if (memoryUsage < 70) {
            memoryStatusIndicator.className = 'status-indicator healthy';
        } else if (memoryUsage < 90) {
            memoryStatusIndicator.className = 'status-indicator warning';
        } else {
            memoryStatusIndicator.className = 'status-indicator critical';
        }

        const diskUsage = data.disk.usage_percentage || 0;
        const diskFreeGb = data.disk.available_gb || 0;
        document.getElementById('disk-gauge').style.width = `${diskUsage}%`;
        document.getElementById('disk-percentage').textContent = `${diskUsage}%`;
        document.getElementById('disk-free').textContent = `${diskFreeGb} GB`;
        const diskStatusIndicator = document.querySelector('.status-card[data-type="disk"] .status-indicator');
        if (diskUsage < 70) {
            diskStatusIndicator.className = 'status-indicator healthy';
        } else if (diskUsage < 90) {
            diskStatusIndicator.className = 'status-indicator warning';
        } else {
            diskStatusIndicator.className = 'status-indicator critical';
        }

        const networkDownload = data.network.download_mbps || 0;
        const networkUpload = data.network.upload_mbps || 0;
        const networkLatency = data.network.latency_ms || 0;
        document.getElementById('network-download').textContent = `${networkDownload} Mbps`;
        document.getElementById('network-upload').textContent = `${networkUpload} Mbps`;
        document.getElementById('network-latency').textContent = `${networkLatency} ms`;
        const networkStatusIndicator = document.querySelector('.status-card[data-type="network"] .status-indicator');
        if (networkLatency < 50) {
            networkStatusIndicator.className = 'status-indicator healthy';
        } else if (networkLatency < 100) {
            networkStatusIndicator.className = 'status-indicator warning';
        } else {
            networkStatusIndicator.className = 'status-indicator critical';
        }


        const alertList = document.getElementById('alert-list');
        alertList.innerHTML = ''; 

        function addAlert(message, type = 'info', icon = 'ℹ️') {
            const alertItem = document.createElement('div');
            alertItem.classList.add('alert-item', type);
            alertItem.innerHTML = `
                <span class="alert-icon">${icon}</span>
                <span class="alert-message">${message}</span>
                <span class="alert-time">${new Date().toLocaleTimeString('es-ES')}</span>
            `;
            alertList.appendChild(alertItem);
        }

        for (const serviceName in data.services) {
            const status = data.services[serviceName];
            if (status !== 'active' && status !== 'inactive') {
                let alertType = 'info';
                let alertIcon = '⚠️';
                if (status === 'failed') {
                    alertType = 'error';
                    alertIcon = '🚨';
                } else if (status === 'unknown') {
                    alertType = 'warning';
                    alertIcon = '⚠️';
                } else if (status === 'not_found') {
                    alertType = 'info';
                    alertIcon = 'ℹ️';
                }
                addAlert(`Servicio "${serviceName}" está en estado: <strong>${status}</strong>.`, alertType, alertIcon);
            }
        }

        const RAM_CRITICAL_THRESHOLD = 90;
        const RAM_WARNING_THRESHOLD = 70;
        if (memoryUsage >= RAM_CRITICAL_THRESHOLD) {
            addAlert(`Uso de RAM CRÍTICO: ${memoryUsage.toFixed(1)}%.`, 'error', '🚨');
        } else if (memoryUsage >= RAM_WARNING_THRESHOLD) {
            addAlert(`Uso de RAM ELEVADO: ${memoryUsage.toFixed(1)}%.`, 'warning', '⚠️');
        } else if (memoryUsage > 50 && memoryUsage < RAM_WARNING_THRESHOLD) {
            addAlert(`Uso de RAM moderado: ${memoryUsage.toFixed(1)}%.`, 'info', 'ℹ️');
        }

        const DISK_CRITICAL_THRESHOLD = 90;
        const DISK_WARNING_THRESHOLD = 70;
        if (diskUsage >= DISK_CRITICAL_THRESHOLD) {
            addAlert(`Uso de Disco CRÍTICO: ${diskUsage}%.`, 'error', '🚨');
        } else if (diskUsage >= DISK_WARNING_THRESHOLD) {
            addAlert(`Uso de Disco ELEVADO: ${diskUsage}%.`, 'warning', '⚠️');
        } else if (diskUsage > 50 && diskUsage < DISK_WARNING_THRESHOLD) {
            addAlert(`Uso de Disco moderado: ${diskUsage}%.`, 'info', 'ℹ️');
        }

        const LATENCY_CRITICAL_THRESHOLD = 150;
        const LATENCY_WARNING_THRESHOLD = 80;
        if (networkLatency >= LATENCY_CRITICAL_THRESHOLD) {
            addAlert(`Latencia de red CRÍTICA: ${networkLatency} ms.`, 'error', '🚨');
        } else if (networkLatency >= LATENCY_WARNING_THRESHOLD) {
            addAlert(`Latencia de red ELEVADA: ${networkLatency} ms.`, 'warning', '⚠️');
        } else if (networkLatency > 0 && networkLatency < LATENCY_WARNING_THRESHOLD) {
            addAlert(`Latencia de red normal: ${networkLatency} ms.`, 'info', 'ℹ️');
        }

        const TRAFFIC_LOW_THRESHOLD_MBPS = 1;
        if (networkDownload < TRAFFIC_LOW_THRESHOLD_MBPS && networkUpload < TRAFFIC_LOW_THRESHOLD_MBPS) {
            addAlert(`Tráfico de red bajo (D: ${networkDownload} Mbps, U: ${networkUpload} Mbps).`, 'info', 'ℹ️');
        }


        if (alertList.innerHTML === '') {
            alertList.innerHTML = '<p class="no-alerts">No hay alertas activas.</p>';
        }


        document.getElementById('last-update').textContent = new Date().toLocaleTimeString('es-ES');

        updateCharts(data, memoryUsage);

    } catch (error) {
        console.error('Error fetching system stats:', error);
        document.getElementById('last-update').textContent = `Error: ${error.message}`;
        const mainContainer = document.querySelector('.dashboard-container');
        if (mainContainer) {
            mainContainer.innerHTML = '<p class="error-message">No se pudieron cargar los datos del servidor. Por favor, intente de nuevo más tarde.</p>';
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    initializeCharts();
    fetchAndDisplaySystemStats();
    setInterval(fetchAndDisplaySystemStats, 60000); 
});