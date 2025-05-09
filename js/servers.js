/**
 * Gestión de datos de servidores para el Dashboard de Monitorización
 */

// Definición de servidores de ejemplo
const serversData = {
  server1: {
    name: "Servidor Web",
    ip: "192.168.1.10",
    os: "Linux Ubuntu 24.04 LTS",
    cpu: {
      cores: 16,
      model: "Intel Xeon E5-2680 v4",
      baseUsage: 45
    },
    memory: {
      total: "64 GB",
      baseUsage: 60
    },
    disk: {
      total: "2 TB",
      free: "1.2 TB",
      baseUsage: 40
    },
    network: {
      mainInterface: "eth0",
      baseDownload: 120,
      baseUpload: 40,
      baseLatency: 15
    },
    location: "Barcelona, España",
    uptime: 345600 // 4 días en segundos
  },
  server2: {
    name: "Servidor Base de Datos",
    ip: "192.168.1.20",
    os: "Linux Ubuntu 24.04 LTS",
    cpu: {
      cores: 8,
      model: "AMD Ryzen 7 3700X",
      baseUsage: 30
    },
    memory: {
      total: "32 GB",
      baseUsage: 45
    },
    disk: {
      total: "1 TB",
      free: "600 GB",
      baseUsage: 40
    },
    network: {
      mainInterface: "eth0",
      baseDownload: 80,
      baseUpload: 25,
      baseLatency: 8
    },
    location: "Barcelona, España",
    uptime: 172800 // 2 días en segundos
  }
};

// Servidor actualmente seleccionado
let currentServer = 'server1';

// Función para cambiar el servidor seleccionado
function changeServer(serverId) {
  if (!serversData[serverId]) {
    console.error(`Servidor con ID ${serverId} no encontrado`);
    return;
  }
  
  currentServer = serverId;
  updateServerInfo();
  
  // Simular nueva carga de datos para las gráficas
  if (window.cpuChart && window.memoryChart) {
    // Actualizar con valores base del servidor
    const server = serversData[currentServer];
    
    // Simular nuevos valores para las gráficas basados en los valores base del servidor
    for (let i = 0; i < 24; i++) {
      const cpuVariation = (Math.random() * 15) - 7; // Variación de -7 a +7
      const memVariation = (Math.random() * 10) - 5; // Variación de -5 a +5
      
      const cpuValue = Math.max(5, Math.min(95, server.cpu.baseUsage + cpuVariation));
      const memValue = Math.max(10, Math.min(95, server.memory.baseUsage + memVariation));
      
      window.cpuChart.update(Math.round(cpuValue));
      window.memoryChart.update(Math.round(memValue));
    }
  }
  
  // Generar algunas alertas aleatorias para el nuevo servidor
  generateRandomAlerts();
}

// Función para actualizar la información del servidor en la UI
function updateServerInfo() {
  const server = serversData[currentServer];
  
  // Actualizar detalles del servidor
  document.getElementById('server-name').textContent = server.name;
  document.getElementById('server-ip').textContent = server.ip;
  document.getElementById('server-os').textContent = server.os;
  document.getElementById('server-uptime').textContent = formatUptime(server.uptime);
  document.getElementById('server-temp').textContent = `${randomNumber(35, 55)}°C`;
  document.getElementById('server-location').textContent = server.location;
  
  // Actualizar estadísticas de CPU
  document.getElementById('cpu-cores').textContent = server.cpu.cores;
  const cpuUsage = randomNumber(
    Math.max(5, server.cpu.baseUsage - 10),
    Math.min(95, server.cpu.baseUsage + 10)
  );
  updateGauge('cpu-gauge', 'cpu-percentage', cpuUsage);
  
  // Actualizar estadísticas de memoria
  document.getElementById('memory-total').textContent = server.memory.total;
  const memoryUsage = randomNumber(
    Math.max(5, server.memory.baseUsage - 5),
    Math.min(95, server.memory.baseUsage + 5)
  );
  updateGauge('memory-gauge', 'memory-percentage', memoryUsage);
  
  // Actualizar estadísticas de disco
  document.getElementById('disk-free').textContent = server.disk.free;
  const diskUsage = randomNumber(
    Math.max(5, server.disk.baseUsage - 3),
    Math.min(95, server.disk.baseUsage + 3)
  );
  updateGauge('disk-gauge', 'disk-percentage', diskUsage);
  
  // Actualizar estadísticas de red
  const downloadSpeed = randomNumber(
    Math.max(1, server.network.baseDownload - 20),
    server.network.baseDownload + 50
  );
  const uploadSpeed = randomNumber(
    Math.max(1, server.network.baseUpload - 10),
    server.network.baseUpload + 15
  );
  const latency = randomNumber(
    Math.max(1, server.network.baseLatency - 2),
    server.network.baseLatency + 8
  );
  
  document.getElementById('network-download').textContent = `${downloadSpeed} Mbps`;
  document.getElementById('network-upload').textContent = `${uploadSpeed} Mbps`;
  document.getElementById('network-latency').textContent = `${latency} ms`;
  
  // Actualizar la hora de la última actualización
  updateCurrentTime();
}

// Función para generar alertas aleatorias
function generateRandomAlerts() {
  // Limpiar alertas existentes
  document.getElementById('alert-list').innerHTML = '';
  
  // Servidor actual
  const server = serversData[currentServer];
  
  // Tipos de alerta
  const alertTypes = ['info', 'warning', 'critical', 'success'];
  
  // Posibles alertas por tipo
  const alerts = {
    critical: [
      `Uso de CPU por encima del umbral crítico (95%)`,
      `Memoria RAM agotada (>95%)`,
      `Disco lleno en ${server.name}`,
      `Servidor no responde a ping`,
      `Servicio de base de datos caído en ${server.name}`
    ],
    warning: [
      `Uso de CPU elevado (>80%)`,
      `Memoria RAM por encima del 80%`,
      `Espacio en disco bajo (<10%)`,
      `Latencia de red elevada (${randomNumber(100, 500)} ms)`,
      `Reinicio programado en 30 minutos`
    ],
    info: [
      `Actualización del sistema disponible`,
      `Backup diario completado con éxito`,
      `${randomNumber(5, 20)} nuevos usuarios registrados hoy`,
      `Tráfico de red normal`,
      `Sincronización completada`
    ],
    success: [
      `Servicio reiniciado con éxito`,
      `Actualización de seguridad aplicada`,
      `Backup semanal completado correctamente`,
      `Rendimiento óptimo en las últimas 24h`,
      `Monitorización activada con éxito`
    ]
  };
  
  // Generar entre 3 y 7 alertas aleatorias
  const numAlerts = randomNumber(3, 7);
  const now = new Date();
  
  for (let i = 0; i < numAlerts; i++) {
    // Generar una alerta más probable para servidores con alto uso de recursos
    let alertType = '';
    if (server.cpu.baseUsage > 70 || server.memory.baseUsage > 80) {
      // Mayor probabilidad de alertas críticas o de advertencia
      alertType = Math.random() < 0.7 ? 
        (Math.random() < 0.4 ? 'critical' : 'warning') : 
        (Math.random() < 0.7 ? 'info' : 'success');
    } else {
      // Distribución más equilibrada
      alertType = alertTypes[Math.floor(Math.random() * alertTypes.length)];
    }
    
    // Elegir una alerta aleatoria del tipo seleccionado
    const alertMessages = alerts[alertType];
    const alertMessage = alertMessages[Math.floor(Math.random() * alertMessages.length)];
    
    // Generar un tiempo aleatorio en las últimas 24 horas
    const randomTime = new Date(now.getTime() - Math.random() * 24 * 60 * 60 * 1000);
    const timeString = formatTime(randomTime);
    
    // Crear título según el tipo
    let title = '';
    switch (alertType) {
      case 'critical':
        title = 'Error Crítico';
        break;
      case 'warning':
        title = 'Advertencia';
        break;
      case 'info':
        title = 'Información';
        break;
      case 'success':
        title = 'Operación Exitosa';
        break;
    }
    
    // Crear la alerta
    createAlert(alertType, title, alertMessage, timeString);
  }
}

// Inicializar eventos y datos cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  // Configurar selector de servidores
  const serverSelector = document.getElementById('server-selector');
  if (serverSelector) {
    // Evento de cambio
    serverSelector.addEventListener('change', (e) => {
      changeServer(e.target.value);
    });
    
    // Inicializar con el primer servidor
    changeServer(currentServer);
  }
  
  // Configurar el botón de cambio de tema
  const themeToggle = document.getElementById('theme-toggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', toggleTheme);
  }
  
  // Aplicar tema almacenado
  applyStoredTheme();
});