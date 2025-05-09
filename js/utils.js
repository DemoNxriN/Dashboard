/**
 * Utilidades para el Dashboard de Monitorización
 */

// Función para formatear bytes a unidades legibles (KB, MB, GB, etc.)
function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i];
}

// Función para formatear tiempo en formato legible
function formatUptime(seconds) {
  const days = Math.floor(seconds / (3600 * 24));
  const hours = Math.floor((seconds % (3600 * 24)) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  let result = '';
  if (days > 0) result += `${days} día${days > 1 ? 's' : ''}, `;
  if (hours > 0 || days > 0) result += `${hours} hora${hours > 1 ? 's' : ''}, `;
  result += `${minutes} minuto${minutes > 1 ? 's' : ''}`;
  
  return result;
}

// Función para formatear timestamp a hora local
function formatTime(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('es-ES', { 
    hour: '2-digit', 
    minute: '2-digit', 
    second: '2-digit' 
  });
}

// Función para formatear fecha completa
function formatDate(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleDateString('es-ES', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Función para generar un número aleatorio entre min y max
function randomNumber(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Función para generar un color aleatorio en formato hexadecimal
function randomColor() {
  return `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`;
}

// Función para actualizar un gauge
function updateGauge(gaugeId, valueId, value) {
  const gauge = document.getElementById(gaugeId);
  const valueElement = document.getElementById(valueId);
  
  if (gauge && valueElement) {
    // Asignar clase de color basada en el valor
    let colorClass = '';
    if (value < 60) {
      gauge.style.backgroundColor = 'var(--color-success)';
    } else if (value < 80) {
      gauge.style.backgroundColor = 'var(--color-warning)';
    } else {
      gauge.style.backgroundColor = 'var(--color-error)';
    }
    
    // Actualizar gauge y valor
    gauge.style.width = `${value}%`;
    valueElement.textContent = `${value}%`;
    
    // Actualizar el indicador de estado
    const card = gauge.closest('.status-card');
    if (card) {
      const indicator = card.querySelector('.status-indicator');
      if (indicator) {
        indicator.className = 'status-indicator';
        if (value < 60) {
          indicator.classList.add('healthy');
        } else if (value < 80) {
          indicator.classList.add('warning');
        } else {
          indicator.classList.add('critical');
        }
      }
    }
  }
}

// Función para actualizar la hora actual
function updateCurrentTime() {
  const timeElement = document.getElementById('last-update');
  if (timeElement) {
    const now = new Date();
    timeElement.textContent = now.toLocaleTimeString('es-ES');
  }
}

// Función para crear una alerta
function createAlert(type, title, message, time) {
  const alertList = document.getElementById('alert-list');
  if (!alertList) return;
  
  // Crear elemento de alerta
  const alertItem = document.createElement('div');
  alertItem.className = 'alert-item';
  
  // Iconos basados en tipo
  let icon = '';
  switch (type) {
    case 'critical':
      icon = '⚠️';
      break;
    case 'warning':
      icon = '⚠️';
      break;
    case 'info':
      icon = 'ℹ️';
      break;
    case 'success':
      icon = '✓';
      break;
    default:
      icon = 'ℹ️';
  }
  
  // Construir HTML de la alerta
  alertItem.innerHTML = `
    <div class="alert-icon ${type}">${icon}</div>
    <div class="alert-content">
      <div class="alert-title">${title}</div>
      <div class="alert-message">${message}</div>
    </div>
    <div class="alert-time">${time}</div>
  `;
  
  // Agregar al inicio de la lista
  alertList.insertBefore(alertItem, alertList.firstChild);
  
  // Limitar a 10 alertas
  if (alertList.children.length > 10) {
    alertList.removeChild(alertList.lastChild);
  }
}

// Función para alternar entre modo claro y oscuro
function toggleTheme() {
  const body = document.body;
  const isDarkTheme = body.classList.contains('dark-theme');
  
  if (isDarkTheme) {
    body.classList.remove('dark-theme');
    localStorage.setItem('theme', 'light');
  } else {
    body.classList.add('dark-theme');
    localStorage.setItem('theme', 'dark');
  }
}

// Función para aplicar el tema almacenado en localStorage
function applyStoredTheme() {
  const storedTheme = localStorage.getItem('theme');
  if (storedTheme === 'dark') {
    document.body.classList.add('dark-theme');
  }
}