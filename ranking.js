// ranking.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import { getFirestore, collection, getDocs, doc, getDoc } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";
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

let currentUser = null;
let allUsersData = [];
let currentPeriod = 'all';

// Verificar autenticação
onAuthStateChanged(auth, (user) => {
  if (user) {
    currentUser = user;
    loadRankingData();
  } else {
    window.location.href = 'index.html';
  }
});

// Carregar dados do ranking
async function loadRankingData() {
  try {
    const usersCollection = collection(db, "usuarios");
    const usersSnapshot = await getDocs(usersCollection);
    
    allUsersData = [];
    
    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      const userId = userDoc.id;
      
      // Calcular total de minutos
      const materias = userData.materias || {};
      const progressoExtra = userData.progressoExtra || 0;
      const totalMinutos = Object.values(materias).reduce((acc, m) => acc + (m.minutosEstudados || 0), 0) + progressoExtra;
      
      // Calcular streak
      const diasEstudados = userData.diasEstudados || {};
      const streak = calculateStreak(diasEstudados);
      
      // Contar conquistas
      const conquistas = userData.conquistas || {};
      const conquistasDesbloqueadas = Object.values(conquistas).filter(c => c.desbloqueada).length;
      const totalConquistas = Object.keys(conquistas).length;
      
      // Pegar username do usuário (ou usar parte do email como fallback)
      const username = userData.username || userId.substring(0, 8);
      
      allUsersData.push({
        userId,
        username,
        totalMinutos,
        totalHoras: totalMinutos / 60,
        streak,
        conquistas: conquistasDesbloqueadas,
        totalConquistas,
        rank: calculateRank(totalMinutos / 60),
        nivel: calculateLevel(totalMinutos),
        diasEstudados
      });
    }
    
    // Ordenar por total de horas (decrescente)
    allUsersData.sort((a, b) => b.totalMinutos - a.totalMinutos);
    
    // Renderizar ranking
    renderRanking();
    renderPodium();
    renderGlobalStats();
    highlightCurrentUser();
    
  } catch (error) {
    console.error("Erro ao carregar ranking:", error);
    document.getElementById('rankingTableBody').innerHTML = `
      <tr>
        <td colspan="6" class="error">
          <i class="fas fa-exclamation-triangle"></i> Erro ao carregar ranking
        </td>
      </tr>
    `;
  }
}

// Calcular streak
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

// Calcular rank
function calculateRank(totalHoras) {
  if (totalHoras < 10) return 'Novato';
  if (totalHoras < 50) return 'Aprendiz';
  if (totalHoras < 100) return 'Estudante';
  if (totalHoras < 200) return 'Dedicado';
  if (totalHoras < 500) return 'Mestre';
  return 'Lendário';
}

// Calcular nível do mascote
function calculateLevel(totalMinutos) {
  if (totalMinutos >= 18000) return 6;
  if (totalMinutos >= 5400) return 5;
  if (totalMinutos >= 2880) return 4;
  if (totalMinutos >= 1200) return 3;
  if (totalMinutos >= 240) return 2;
  return 1;
}

// Renderizar tabela de ranking
function renderRanking() {
  const tbody = document.getElementById('rankingTableBody');
  tbody.innerHTML = '';
  
  if (allUsersData.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="empty">
          <i class="fas fa-users-slash"></i> Nenhum usuário encontrado
        </td>
      </tr>
    `;
    return;
  }
  
  allUsersData.forEach((user, index) => {
    const position = index + 1;
    const isCurrentUser = user.userId === currentUser.uid;
    
    let positionIcon = `<span class="position-number">${position}º</span>`;
    if (position === 1) positionIcon = '<i class="fas fa-trophy gold-trophy"></i>';
    if (position === 2) positionIcon = '<i class="fas fa-medal silver-medal"></i>';
    if (position === 3) positionIcon = '<i class="fas fa-medal bronze-medal"></i>';
    
    const row = document.createElement('tr');
    if (isCurrentUser) row.classList.add('current-user');
    
    row.innerHTML = `
      <td class="position-cell">${positionIcon}</td>
      <td class="user-cell">
        <div class="user-info">
          <img src="images/mascote${Math.min(user.nivel, 5)}.webp" alt="Avatar" class="user-avatar">
          <a href="perfil-publico.html?userId=${user.userId}" class="user-name-link">
            <span class="user-name">${user.username}${isCurrentUser ? ' (Você)' : ''}</span>
          </a>
        </div>
      </td>
      <td><span class="rank-badge rank-${user.rank.toLowerCase()}">${user.rank}</span></td>
      <td class="hours-cell">${user.totalHoras.toFixed(1)}h</td>
      <td class="streak-cell">
        <i class="fas fa-fire"></i> ${user.streak} dias
      </td>
      <td class="achievements-cell">
        <i class="fas fa-trophy"></i> ${user.conquistas}/${user.totalConquistas}
      </td>
    `;
    
    tbody.appendChild(row);
  });
}

// Renderizar pódio (Top 3)
function renderPodium() {
  const positions = [1, 0, 2]; // Ordem: 2º, 1º, 3º
  const podiumIds = ['podium-2', 'podium-1', 'podium-3'];
  
  positions.forEach((index, i) => {
    const podiumElement = document.getElementById(podiumIds[i]);
    
    if (allUsersData[index]) {
      const user = allUsersData[index];
      const avatar = podiumElement.querySelector('.podium-avatar img');
      const name = podiumElement.querySelector('.podium-info h3');
      const hours = podiumElement.querySelector('.podium-hours');
      const rank = podiumElement.querySelector('.podium-rank');
      
      avatar.src = `images/mascote${Math.min(user.nivel, 5)}.webp`;
      
      // Tornar o nome clicável
      name.innerHTML = `<a href="perfil-publico.html?userId=${user.userId}" style="color: inherit; text-decoration: none;">${user.username}</a>`;
      hours.textContent = `${user.totalHoras.toFixed(1)}h`;
      rank.textContent = user.rank;
      
      if (user.userId === currentUser.uid) {
        podiumElement.classList.add('current-user-podium');
      }
    } else {
      const name = podiumElement.querySelector('.podium-info h3');
      const hours = podiumElement.querySelector('.podium-hours');
      const rank = podiumElement.querySelector('.podium-rank');
      
      name.textContent = '---';
      hours.textContent = '0h';
      rank.textContent = 'Vazio';
    }
  });
}

// Renderizar estatísticas globais
function renderGlobalStats() {
  const totalUsers = allUsersData.length;
  const totalHours = allUsersData.reduce((acc, user) => acc + user.totalHoras, 0);
  const maxStreak = Math.max(...allUsersData.map(user => user.streak), 0);
  const avgHours = totalUsers > 0 ? totalHours / totalUsers : 0;
  
  document.getElementById('totalUsers').textContent = totalUsers;
  document.getElementById('totalHours').textContent = `${totalHours.toFixed(1)}h`;
  document.getElementById('maxStreak').textContent = `${maxStreak} dias`;
  document.getElementById('avgHours').textContent = `${avgHours.toFixed(1)}h`;
}

// Destacar usuário atual
function highlightCurrentUser() {
  const currentUserIndex = allUsersData.findIndex(user => user.userId === currentUser.uid);
  
  if (currentUserIndex !== -1) {
    const position = currentUserIndex + 1;
    const positionSpan = document.querySelector('#yourPosition span');
    positionSpan.textContent = `${position}º lugar`;
    
    if (position === 1) {
      positionSpan.style.color = '#FFD700';
    } else if (position === 2) {
      positionSpan.style.color = '#C0C0C0';
    } else if (position === 3) {
      positionSpan.style.color = '#CD7F32';
    } else {
      positionSpan.style.color = '#00D4FF';
    }
  }
}

// Mudar período do ranking (funcionalidade futura)
window.changeRankingPeriod = function(period) {
  currentPeriod = period;
  
  // Atualizar botões ativos
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  document.querySelector(`[data-period="${period}"]`).classList.add('active');
  
  // Por enquanto, apenas recarrega os mesmos dados
  // No futuro, pode filtrar por data
  renderRanking();
  renderPodium();
  renderGlobalStats();
  highlightCurrentUser();
}

// Função de logout
window.logout = async function() {
  try {
    await signOut(auth);
    window.location.href = 'index.html';
  } catch (erro) {
    console.error("Erro ao fazer logout:", erro.message);
  }
}
