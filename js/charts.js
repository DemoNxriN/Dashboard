/**
 * Gráficas para el Dashboard de Monitorización
 */

// Clase para gestionar las gráficas
class Chart {
  constructor(elementId, options = {}) {
    this.element = document.getElementById(elementId);
    if (!this.element) {
      console.error(`Elemento con id ${elementId} no encontrado`);
      return;
    }
    
    this.options = Object.assign({
      maxPoints: 24, // Puntos máximos a mostrar
      color: 'var(--color-primary)',
      fillColor: 'var(--chart-primary-light)',
      animated: true,
      showLabels: true,
      maxValue: 100,
      minValue: 0
    }, options);
    
    this.data = [];
    this.init();
  }
  
  init() {
    // Limpiar contenido previo
    this.element.innerHTML = '';
    
    // Añadir grid de fondo
    const grid = document.createElement('div');
    grid.className = 'chart-grid';
    for (let i = 0; i < 4; i++) {
      const line = document.createElement('div');
      line.className = 'chart-grid-line';
      grid.appendChild(line);
    }
    this.element.appendChild(grid);
    
    // Contenedor para los puntos y líneas
    this.pointsContainer = document.createElement('div');
    this.pointsContainer.className = 'chart-points';
    this.element.appendChild(this.pointsContainer);
    
    // Área de relleno
    this.areaElement = document.createElement('div');
    this.areaElement.className = 'chart-area';
    this.element.appendChild(this.areaElement);
    
    // Etiquetas de tiempo (eje X)
    if (this.options.showLabels) {
      const labels = document.createElement('div');
      labels.className = 'chart-labels';
      
      // Añadir 5 etiquetas para distribuir a lo largo del eje X
      for (let i = 0; i < 5; i++) {
        const label = document.createElement('div');
        label.className = 'chart-label';
        const hour = new Date();
        hour.setHours(hour.getHours() - (4 - i) * (this.options.maxPoints / 5));
        label.textContent = hour.getHours() + ':00';
        labels.appendChild(label);
      }
      
      this.element.appendChild(labels);
      
      // Etiquetas de valores (eje Y)
      const valueLabels = document.createElement('div');
      valueLabels.className = 'chart-value-labels';
      
      // Añadir 4 etiquetas para distribuir a lo largo del eje Y
      const valueStep = (this.options.maxValue - this.options.minValue) / 4;
      for (let i = 0; i <= 4; i++) {
        const label = document.createElement('div');
        label.className = 'chart-value-label';
        const value = this.options.maxValue - (i * valueStep);
        label.textContent = `${Math.round(value)}%`;
        valueLabels.appendChild(label);
      }
      
      this.element.appendChild(valueLabels);
    }
    
    // Crear tooltip
    this.tooltip = document.createElement('div');
    this.tooltip.className = 'tooltip';
    document.body.appendChild(this.tooltip);
  }
  
  // Actualizar con nuevos datos
  update(newValue) {
    // Agregar nuevo punto
    const now = new Date();
    this.data.push({
      value: newValue,
      time: now.getTime()
    });
    
    // Mantener solo los últimos N puntos
    if (this.data.length > this.options.maxPoints) {
      this.data = this.data.slice(this.data.length - this.options.maxPoints);
    }
    
    this.render();
  }
  
  // Renderizar la gráfica
  render() {
    if (!this.element || this.data.length < 2) return;
    
    // Limpiar puntos anteriores
    this.pointsContainer.innerHTML = '';
    
    const width = this.element.offsetWidth;
    const height = this.element.offsetHeight;
    const pointSpacing = width / (this.options.maxPoints - 1);
    
    let points = [];
    
    // Crear puntos y líneas
    this.data.forEach((point, index) => {
      const x = index * pointSpacing;
      // Normalizar el valor entre 0 y altura del contenedor
      const normalizedValue = (point.value - this.options.minValue) / 
                             (this.options.maxValue - this.options.minValue);
      const y = height - (normalizedValue * height);
      
      points.push({ x, y, data: point });
      
      if (index > 0) {
        // Crear línea desde el punto anterior a este
        const prevPoint = points[index - 1];
        const lineLength = Math.sqrt(Math.pow(x - prevPoint.x, 2) + Math.pow(y - prevPoint.y, 2));
        const angle = Math.atan2(y - prevPoint.y, x - prevPoint.x) * (180 / Math.PI);
        
        const line = document.createElement('div');
        line.className = 'chart-line';
        line.style.width = `${lineLength}px`;
        line.style.left = `${prevPoint.x}px`;
        line.style.top = `${prevPoint.y}px`;
        line.style.transform = `rotate(${angle}deg)`;
        line.style.backgroundColor = this.options.color;
        
        this.pointsContainer.appendChild(line);
      }
      
      // Crear punto
      const dot = document.createElement('div');
      dot.className = 'chart-dot';
      dot.style.left = `${x}px`;
      dot.style.top = `${y}px`;
      dot.style.backgroundColor = this.options.color;
      
      // Añadir evento para mostrar tooltip al pasar el ratón
      dot.addEventListener('mouseover', (e) => {
        this.tooltip.innerHTML = `
          <div class="tooltip-title">Valor</div>
          <div class="tooltip-value">${point.value}%</div>
          <div class="tooltip-time">${formatTime(point.time)}</div>
        `;
        this.tooltip.style.opacity = '1';
        this.tooltip.style.left = `${e.pageX + 10}px`;
        this.tooltip.style.top = `${e.pageY - 40}px`;
      });
      
      dot.addEventListener('mouseout', () => {
        this.tooltip.style.opacity = '0';
      });
      
      this.pointsContainer.appendChild(dot);
    });
    
    // Actualizar área de relleno
    if (points.length > 1) {
      const areaPoints = [...points];
      // Añadir puntos en las esquinas inferiores para completar el polígono
      areaPoints.push({ x: points[points.length - 1].x, y: height });
      areaPoints.push({ x: points[0].x, y: height });
      
      // Ajustar la altura para que coincida con el último punto
      this.areaElement.style.height = `${height - points[points.length - 1].y}px`;
      this.areaElement.style.width = `${points[points.length - 1].x}px`;
    }
  }
  
  // Método para simular datos aleatorios (para demostración)
  simulateData() {
    // Generar un valor aleatorio con tendencia (basado en el último valor si existe)
    let newValue;
    if (this.data.length > 0) {
      const lastValue = this.data[this.data.length - 1].value;
      // Generar un cambio entre -5 y +5 puntos
      const change = Math.random() * 10 - 5;
      newValue = Math.max(this.options.minValue, Math.min(this.options.maxValue, lastValue + change));
    } else {
      // Primer valor aleatorio entre 40-60
      newValue = Math.random() * 20 + 40;
    }
    
    this.update(Math.round(newValue));
  }
}

// Inicializar gráficas cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  // Crear instancias de gráficas
  window.cpuChart = new Chart('cpu-chart', {
    color: 'var(--color-primary)',
    fillColor: 'var(--chart-primary-light)'
  });
  
  window.memoryChart = new Chart('memory-chart', {
    color: 'var(--color-success)',
    fillColor: 'var(--chart-secondary-light)'
  });
  
  // Generar datos iniciales (para demostración)
  for (let i = 0; i < 24; i++) {
    window.cpuChart.simulateData();
    window.memoryChart.simulateData();
  }
});