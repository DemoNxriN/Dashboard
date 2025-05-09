/**
 * Punto de entrada principal para el Dashboard de Monitorización
 */

// Intervalo para actualizar datos (en milisegundos)
const UPDATE_INTERVAL = 2500;

// Función para actualizar todos los datos del dashboard
function updateDashboard() {
  // Actualizar información del servidor actual
  updateServerInfo();
  
  // Actualizar gráficas con un nuevo punto de datos
  if (window.cpuChart && window.memoryChart) {
    const server = serversData[currentServer];
    
    // Generar valores con variación aleatoria basados en el uso base
    const cpuVariation = (Math.random() * 10) - 5; // Variación de -5 a +5
    const memVariation = (Math.random() * 8) - 4; // Variación de -4 a +4
    
    const cpuValue = Math.max(5, Math.min(95, server.cpu.baseUsage + cpuVariation));
    const memValue = Math.max(10, Math.min(95, server.memory.baseUsage + memVariation));
    
    window.cpuChart.update(Math.round(cpuValue));
    window.memoryChart.update(Math.round(memValue));
  }
  
  // Generar ocasionalmente nuevas alertas (10% de probabilidad)
  if (Math.random() < 0.1) {
    const server = serversData[currentServer];
    const alertTypes = ['info', 'warning', 'success'];
    
    // Aumentar probabilidad de alerta crítica si el servidor tiene alta carga
    if (server.cpu.baseUsage > 70 || server.memory.baseUsage > 80) {
      alertTypes.push('critical', 'warning');
    }
    
    const alertType = alertTypes[Math.floor(Math.random() * alertTypes.length)];
    
    let title, message;
    switch (alertType) {
      case 'critical':
        title = 'Error Crítico';
        message = `Uso de CPU extremadamente alto (${randomNumber(90, 99)}%) en ${server.name}`;
        break;
      case 'warning':
        title = 'Advertencia';
        message = `Memoria al ${randomNumber(75, 90)}% de capacidad en ${server.name}`;
        break;
      case 'info':
        title = 'Información';
        message = `Tráfico de red aumentó a ${randomNumber(server.network.baseDownload, server.network.baseDownload * 2)} Mbps`;
        break;
      case 'success':
        title = 'Operación Exitosa';
        message = `Servicio de monitorización actualizado correctamente`;
        break;
    }
    
    createAlert(alertType, title, message, formatTime(new Date()));
  }
  
  // Añadir efecto visual de actualización
  const indicators = document.querySelectorAll('.status-indicator');
  indicators.forEach(indicator => {
    indicator.classList.add('data-update');
    setTimeout(() => {
      indicator.classList.remove('data-update');
    }, 1000);
  });
}

// Función para inicializar alertas iniciales
function initializeAlerts() {
  // Añadir alerta de bienvenida
  createAlert(
    'info',
    'Bienvenido al Dashboard',
    'El sistema de monitorización está activo y funcionando correctamente.',
    formatTime(new Date())
  );
  
  // Añadir alerta de conexión
  setTimeout(() => {
    createAlert(
      'success',
      'Conexión Establecida',
      `Conectado a ${serversData[currentServer].name} correctamente.`,
      formatTime(new Date())
    );
  }, 1000);
}

// Función para inicializar la simulación de servidor
function initializeServerSimulation() {
  // Inicializar datos
  updateDashboard();
  
  // Configurar actualizaciones periódicas
  setInterval(updateDashboard, UPDATE_INTERVAL);
  
  console.log('Simulación de monitorización iniciada correctamente');
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  // Inicializar alertas
  initializeAlerts();
  
  // Iniciar simulación
  initializeServerSimulation();
  
  console.log('Dashboard de monitorización inicializado');
});