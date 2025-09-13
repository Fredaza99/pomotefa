// dashboard.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";

// Configuração do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyARWCI-yDweVjmZWc99GZFsFB8A4tnZDaY",
  authDomain: "pomotefa.firebaseapp.com",
  projectId: "pomotefa",
  storageBucket: "pomotefa.firebasestorage.app",
  messagingSenderId: "759701977199",
  appId: "1:759701977199:web:c9b2c6bbdd73900e89b59a",
  measurementId: "G-HZZ9KXB1MD"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

let productivityChart, subjectChart;

onAuthStateChanged(auth, (user) => {
  if (user) {
    loadDashboardData(user);
  } else {
    window.location.href = 'index.html';
  }
});

async function loadDashboardData(user) {
  const userRef = doc(db, "usuarios", user.uid);
  const docSnap = await getDoc(userRef);

  if (docSnap.exists()) {
    const data = docSnap.data();
    const materias = data.materias || {};
    const conquistas = data.conquistas || {};
    const diasEstudados = data.diasEstudados || {};
    const progressoExtra = data.progressoExtra || 0;

    // Calcular métricas
    const totalMinutos = Object.values(materias).reduce((acc, m) => acc + m.minutosEstudados, 0) + progressoExtra;
    const totalHoras = totalMinutos / 60;

    // Atualizar KPIs
    updateKPIs(totalHoras, diasEstudados, conquistas, materias);
    
    // Criar gráficos
    createProductivityChart(diasEstudados);
    createSubjectChart(materias);
    createHeatmap(diasEstudados);
    
    // Atualizar métricas
    updateMetrics(materias, diasEstudados);
  }
}

function updateKPIs(totalHoras, diasEstudados, conquistas, materias) {
  document.getElementById('total-hours-kpi').textContent = `${totalHoras.toFixed(1)}h`;
  
  const streak = calculateStreak(diasEstudados);
  document.getElementById('streak-kpi').textContent = `${streak} dias`;
  
  const totalConquistas = Object.keys(conquistas).length;
  const conquistasDesbloqueadas = Object.values(conquistas).filter(c => c.desbloqueada).length;
  document.getElementById('achievements-kpi').textContent = `${conquistasDesbloqueadas}/${totalConquistas}`;
  
  // Calcular eficiência baseada nas metas
  const eficiencia = calculateEfficiency(materias);
  document.getElementById('efficiency-kpi').textContent = `${eficiencia}%`;
}

function calculateStreak(diasEstudados) {
  const dayStrings = Object.keys(diasEstudados);
  if (!dayStrings || dayStrings.length === 0) return 0;

  const dates = dayStrings.map(dayStr => {
    const parts = dayStr.split('/');
    return new Date(parts[2], parts[1] - 1, parts[0]);
  }).sort((a, b) => b - a);

  let streak = 1;
  let lastDate = dates[0];

  for (let i = 1; i < dates.length; i++) {
    const currentDate = dates[i];
    const diffTime = lastDate.setHours(0,0,0,0) - currentDate.setHours(0,0,0,0);
    const diffDays = diffTime / (1000 * 60 * 60 * 24);

    if (diffDays === 1) {
      streak++;
      lastDate = currentDate;
    } else if (diffDays > 1) {
      break;
    }
  }
  return streak;
}

function calculateEfficiency(materias) {
  const materiasArray = Object.values(materias);
  if (materiasArray.length === 0) return 0;
  
  const totalEficiencia = materiasArray.reduce((acc, materia) => {
    const progresso = Math.min((materia.minutosEstudados / (materia.metaHoras * 60)) * 100, 100);
    return acc + progresso;
  }, 0);
  
  return Math.round(totalEficiencia / materiasArray.length);
}

function createProductivityChart(diasEstudados) {
  const ctx = document.getElementById('productivityChart').getContext('2d');
  
  // Gerar dados dos últimos 7 dias
  const labels = [];
  const data = [];
  const today = new Date();
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toLocaleDateString('pt-BR');
    
    labels.push(date.toLocaleDateString('pt-BR', { weekday: 'short' }));
    data.push(diasEstudados[dateStr] ? Math.random() * 5 + 1 : 0); // Simulando dados
  }

  productivityChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'Horas Estudadas',
        data: data,
        borderColor: '#FDB7EA',
        backgroundColor: 'rgba(253, 183, 234, 0.1)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#FDB7EA',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        intersect: false
      },
      plugins: {
        legend: {
          display: false
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: {
            color: '#333'
          },
          ticks: {
            color: '#ccc'
          }
        },
        x: {
          grid: {
            color: '#333'
          },
          ticks: {
            color: '#ccc'
          }
        }
      },
      onResize: (chart, size) => {
        chart.canvas.style.height = '300px';
      }
    }
  });
}

function createSubjectChart(materias) {
  const ctx = document.getElementById('subjectChart').getContext('2d');
  
  const labels = Object.keys(materias);
  const data = Object.values(materias).map(m => m.minutosEstudados);
  
  const colors = [
    '#FDB7EA', '#ff94fa', '#da16d0', '#b300b3', '#8a008a',
    '#ff6b9d', '#c44569', '#f8b500', '#ff9ff3', '#54a0ff'
  ];

  subjectChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: labels,
      datasets: [{
        data: data,
        backgroundColor: colors.slice(0, labels.length),
        borderColor: '#1e1e1e',
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: '#ccc',
            padding: 20,
            usePointStyle: true
          }
        }
      },
      onResize: (chart, size) => {
        chart.canvas.style.height = '300px';
      }
    }
  });
}

function createHeatmap(diasEstudados) {
  const container = document.getElementById('heatmapContainer');
  container.innerHTML = '';
  
  const today = new Date();
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - 364); // 365 dias atrás
  
  for (let i = 0; i < 365; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    const dateStr = date.toLocaleDateString('pt-BR');
    
    const day = document.createElement('div');
    day.className = 'heatmap-day';
    
    // Simular níveis de atividade
    const hasActivity = diasEstudados[dateStr];
    if (hasActivity) {
      const level = Math.floor(Math.random() * 4) + 1;
      day.classList.add(`level-${level}`);
    } else {
      day.classList.add('level-0');
    }
    
    day.title = `${dateStr}: ${hasActivity ? 'Estudou' : 'Não estudou'}`;
    container.appendChild(day);
  }
}

function updateMetrics(materias, diasEstudados) {
  // Simular métricas baseadas nos dados reais
  const materiasArray = Object.entries(materias);
  
  if (materiasArray.length > 0) {
    const materiaFavorita = materiasArray.reduce((prev, current) => 
      prev[1].minutosEstudados > current[1].minutosEstudados ? prev : current
    );
    
    // Atualizar métricas com dados simulados mas realistas
    document.getElementById('best-day').textContent = 'Segunda-feira';
    document.getElementById('best-time').textContent = '14:00 - 16:00';
    document.getElementById('avg-session').textContent = '1h 23min';
  }
}

// Event listeners para controles do gráfico
document.addEventListener('DOMContentLoaded', () => {
  const chartBtns = document.querySelectorAll('.chart-btn');
  chartBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      chartBtns.forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      
      const period = e.target.dataset.period;
      // Aqui você pode implementar a lógica para atualizar o gráfico baseado no período
      console.log(`Atualizando gráfico para ${period} dias`);
    });
  });
});

// Função de logout
window.logout = async function() {
  try {
    await signOut(auth);
    window.location.href = 'index.html';
  } catch (erro) {
    console.error("Erro ao fazer logout:", erro.message);
  }
}
