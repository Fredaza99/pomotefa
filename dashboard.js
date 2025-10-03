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
let currentDiasEstudados = {};

// Função auxiliar para formatar minutos em horas e minutos
function formatarTempo(minutos) {
  const horas = Math.floor(minutos / 60);
  const mins = Math.round(minutos % 60);
  
  if (horas === 0) {
    return `${mins}min`;
  } else if (mins === 0) {
    return `${horas}h`;
  } else {
    return `${horas}h ${mins}min`;
  }
}

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
    
    // Armazenar dados globalmente
    currentDiasEstudados = diasEstudados;
    
    // Criar gráficos
    createProductivityChart(diasEstudados);
    createSubjectChart(materias);
    createHeatmap(diasEstudados);
    
    // Atualizar métricas
    updateMetrics(materias, diasEstudados);
  }
}

function updateKPIs(totalHoras, diasEstudados, conquistas, materias) {
  const totalMinutos = totalHoras * 60;
  document.getElementById('total-hours-kpi').textContent = formatarTempo(totalMinutos);
  
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

function createProductivityChart(diasEstudados, period = 7) {
  const ctx = document.getElementById('productivityChart').getContext('2d');
  
  // Gerar dados baseado no período
  const labels = [];
  const data = [];
  const today = new Date();
  
  for (let i = period - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toLocaleDateString('pt-BR');
    
    if (period <= 7) {
      labels.push(date.toLocaleDateString('pt-BR', { weekday: 'short' }));
    } else if (period <= 30) {
      labels.push(date.getDate().toString());
    } else {
      labels.push(date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }));
    }
    
    const minutosNoDia = diasEstudados[dateStr] || 0;
    data.push(minutosNoDia); // Manter em minutos
  }

  productivityChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'Tempo Estudado',
        data: data,
        borderColor: '#00D4FF',
        backgroundColor: 'rgba(0, 212, 255, 0.1)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#00D4FF',
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
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              return formatarTempo(context.parsed.y);
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: {
            color: '#333'
          },
          ticks: {
            color: '#ccc',
            callback: function(value) {
              return formatarTempo(value);
            }
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
  
  // Cores espaciais variadas
  const colors = [
    '#00D4FF', // Ciano
    '#A855F7', // Roxo
    '#EC4899', // Rosa
    '#F59E0B', // Laranja
    '#10B981', // Verde
    '#8B5CF6', // Violeta
    '#F97316', // Laranja escuro
    '#06B6D4', // Turquesa
    '#EF4444', // Vermelho
    '#14B8A6'  // Teal
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
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const label = context.label || '';
              const value = context.parsed;
              return label + ': ' + formatarTempo(value);
            }
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
    
    // Calcular nível baseado nos minutos estudados
    const minutosNoDia = diasEstudados[dateStr] || 0;
    let level = 0;
    if (minutosNoDia > 0) {
      if (minutosNoDia >= 240) level = 4; // 4+ horas
      else if (minutosNoDia >= 180) level = 3; // 3+ horas
      else if (minutosNoDia >= 120) level = 2; // 2+ horas
      else level = 1; // Qualquer tempo
    }
    day.classList.add(`level-${level}`);
    
    day.title = `${dateStr}: ${minutosNoDia > 0 ? formatarTempo(minutosNoDia) + ' estudadas' : 'Não estudou'}`;
    container.appendChild(day);
  }
}

function updateMetrics(materias, diasEstudados) {
  const materiasArray = Object.entries(materias);
  const diasArray = Object.entries(diasEstudados);
  
  if (materiasArray.length > 0 && diasArray.length > 0) {
    // Calcular melhor dia da semana
    const diasSemana = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
    const estudoPorDia = new Array(7).fill(0);
    const contadorDias = new Array(7).fill(0);
    
    diasArray.forEach(([dateStr, minutos]) => {
      const [dia, mes, ano] = dateStr.split('/');
      const date = new Date(ano, mes - 1, dia);
      const diaSemana = date.getDay();
      estudoPorDia[diaSemana] += minutos;
      contadorDias[diaSemana]++;
    });
    
    const mediaPorDia = estudoPorDia.map((total, i) => 
      contadorDias[i] > 0 ? total / contadorDias[i] : 0
    );
    
    const melhorDiaIndex = mediaPorDia.indexOf(Math.max(...mediaPorDia));
    
    document.getElementById('best-day').textContent = diasSemana[melhorDiaIndex];
    document.querySelector('#best-day').nextElementSibling.textContent = `Média: ${formatarTempo(mediaPorDia[melhorDiaIndex])}`;
    
    // Calcular tempo médio por sessão
    const totalSessoes = diasArray.length;
    const totalMinutos = diasArray.reduce((acc, [, minutos]) => acc + minutos, 0);
    const mediaSessao = totalMinutos / totalSessoes;
    const horas = Math.floor(mediaSessao / 60);
    const minutos = Math.round(mediaSessao % 60);
    
    document.getElementById('avg-session').textContent = `${horas}h ${minutos}min`;
    
    // Calcular meta mensal (baseado nos últimos 30 dias)
    const hoje = new Date();
    const trintaDiasAtras = new Date(hoje.getTime() - (30 * 24 * 60 * 60 * 1000));
    
    let minutosUltimos30Dias = 0;
    diasArray.forEach(([dateStr, minutos]) => {
      const [dia, mes, ano] = dateStr.split('/');
      const date = new Date(ano, mes - 1, dia);
      if (date >= trintaDiasAtras) {
        minutosUltimos30Dias += minutos;
      }
    });
    
    const horasUltimos30Dias = minutosUltimos30Dias / 60;
    const metaMensal = 60; // Meta de 60 horas por mês
    const progressoMeta = Math.min((horasUltimos30Dias / metaMensal) * 100, 100);
    
    document.getElementById('monthly-goal').textContent = `${Math.round(progressoMeta)}%`;
    document.querySelector('.progress-fill').style.width = `${progressoMeta}%`;
  } else {
    // Valores padrão quando não há dados
    document.getElementById('best-day').textContent = '-';
    document.querySelector('#best-day').nextElementSibling.textContent = 'Sem dados';
    document.getElementById('avg-session').textContent = '0h 0min';
    document.getElementById('monthly-goal').textContent = '0%';
    document.querySelector('.progress-fill').style.width = '0%';
  }
  
  // Calcular horário mais produtivo baseado em dados reais
  calculateBestStudyTime(diasEstudados);
}

// Calcular horário mais produtivo
async function calculateBestStudyTime(diasEstudados) {
  try {
    const user = auth.currentUser;
    if (!user) return;
    
    const userRef = doc(db, "usuarios", user.uid);
    const docSnap = await getDoc(userRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      const horariosEstudo = data.horariosEstudo || {};
      
      if (Object.keys(horariosEstudo).length > 0) {
        // Encontrar o horário com mais minutos estudados
        let melhorHorario = '';
        let maxMinutos = 0;
        
        for (const [horario, minutos] of Object.entries(horariosEstudo)) {
          if (minutos > maxMinutos) {
            maxMinutos = minutos;
            melhorHorario = horario;
          }
        }
        
        document.getElementById('best-time').textContent = melhorHorario || 'Sem dados';
      } else {
        document.getElementById('best-time').textContent = 'Sem dados';
      }
    }
  } catch (error) {
    console.error('Erro ao calcular melhor horário:', error);
    document.getElementById('best-time').textContent = 'Erro ao carregar';
  }
}

// Event listeners para controles do gráfico
document.addEventListener('DOMContentLoaded', () => {
  const chartBtns = document.querySelectorAll('.chart-btn');
  chartBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      chartBtns.forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      
      const period = parseInt(e.target.dataset.period);
      if (productivityChart) {
        productivityChart.destroy();
      }
      createProductivityChart(currentDiasEstudados, period);
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
