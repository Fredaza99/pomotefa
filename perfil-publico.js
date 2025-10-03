// perfil-publico.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import { getFirestore, doc, getDoc, collection, getDocs } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";

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

// Pegar userId da URL
const urlParams = new URLSearchParams(window.location.search);
const targetUserId = urlParams.get('userId');

onAuthStateChanged(auth, (user) => {
  if (user) {
    if (targetUserId) {
      loadPublicProfile(targetUserId);
    } else {
      // Se não tem userId na URL, redireciona para ranking
      window.location.href = 'ranking.html';
    }
  } else {
    // Usuário não está logado, redirecionar para login
    window.location.href = 'index.html';
  }
});

async function loadPublicProfile(userId) {
  try {
    const userRef = doc(db, "usuarios", userId);
    const docSnap = await getDoc(userRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      
      // Extrair dados do Firebase
      const materias = data.materias || {};
      const conquistas = data.conquistas || {};
      const diasEstudados = data.diasEstudados || {};
      const progressoExtra = data.progressoExtra || 0;
      const username = data.username || 'Usuário';

      const totalMinutos = Object.values(materias).reduce((acc, m) => acc + m.minutosEstudados, 0) + progressoExtra;
      const totalHoras = totalMinutos / 60;

      // 1. Atualizar informações básicas
      document.getElementById('user-name').textContent = username;
      document.title = `${username} - Perfil | Pomotefa`;
      updateAvatar(totalMinutos);

      // 2. Rank Atual
      document.getElementById('user-rank').textContent = calculateRank(totalHoras);

      // 3. Número de Conquistas
      const numConquistas = Object.values(conquistas).filter(c => c.desbloqueada).length;
      document.getElementById('user-achievements').textContent = numConquistas;

      // 4. Streak de Estudo
      document.getElementById('user-streak').textContent = `${calculateStreak(diasEstudados)} dias`;

      // 5. Matéria Favorita
      document.getElementById('user-fav-subject').textContent = findFavoriteSubject(materias);

      // 6. Conquistas Recentes
      displayRecentAchievements(conquistas);

      // 7. Matérias de Estudo
      displaySubjects(materias);

      // 8. Total de Horas Estudadas
      document.getElementById('total-hours-text').textContent = formatarTempo(totalMinutos);
      const rankProgress = (totalHoras % 50) / 50 * 100;
      document.getElementById('total-hours-bar').style.width = `${rankProgress}%`;

      // 9. Posição no Ranking
      await loadRankingPosition(userId, totalMinutos);

    } else {
      document.getElementById('user-name').textContent = 'Usuário não encontrado';
      console.log("Nenhum dado encontrado para este usuário!");
    }
  } catch (error) {
    console.error("Erro ao carregar perfil:", error);
    document.getElementById('user-name').textContent = 'Erro ao carregar perfil';
  }
}

function updateAvatar(totalMinutos) {
  let nivel = 1;
  if (totalMinutos >= 18000) nivel = 6;
  else if (totalMinutos >= 5400) nivel = 5;
  else if (totalMinutos >= 2880) nivel = 4;
  else if (totalMinutos >= 1200) nivel = 3;
  else if (totalMinutos >= 240) nivel = 2;

  const avatarImg = document.getElementById('user-avatar');
  avatarImg.src = `images/mascote${Math.min(nivel, 5)}.webp`;
}

function calculateRank(totalHoras) {
  if (totalHoras < 10) return 'Novato';
  if (totalHoras < 50) return 'Aprendiz';
  if (totalHoras < 100) return 'Estudante';
  if (totalHoras < 200) return 'Dedicado';
  if (totalHoras < 500) return 'Mestre';
  return 'Lendário';
}

function calculateStreak(studyDays) {
  const dayStrings = Object.keys(studyDays);
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

function findFavoriteSubject(materias) {
  if (Object.keys(materias).length === 0) return '-';

  let favSubject = '';
  let maxMinutes = -1;

  for (const [nome, dados] of Object.entries(materias)) {
    if (dados.minutosEstudados > maxMinutes) {
      maxMinutes = dados.minutosEstudados;
      favSubject = nome;
    }
  }
  return favSubject;
}

function displayRecentAchievements(conquistas) {
  const container = document.getElementById('recent-achievements-list');
  container.innerHTML = '';

  const unlocked = Object.values(conquistas).filter(c => c.desbloqueada);

  if (unlocked.length === 0) {
    container.innerHTML = '<p>Nenhuma conquista desbloqueada ainda.</p>';
    return;
  }

  unlocked.slice(-3).reverse().forEach(conquista => {
    const div = document.createElement('div');
    div.className = 'achievement-item';
    div.innerHTML = `
      <img src="${conquista.icone}" alt="Ícone da Conquista">
      <p><strong>${conquista.titulo}</strong> - ${conquista.descricao}</p>
    `;
    container.appendChild(div);
  });
}

function displaySubjects(materias) {
  const container = document.getElementById('subjects-list');
  container.innerHTML = '';

  if (Object.keys(materias).length === 0) {
    container.innerHTML = '<p>Nenhuma matéria cadastrada.</p>';
    return;
  }

  for (const [nome, dados] of Object.entries(materias)) {
    const progresso = Math.min((dados.minutosEstudados / (dados.metaHoras * 60)) * 100, 100);

    const div = document.createElement('div');
    div.className = 'subject-card';
    div.innerHTML = `
      <h3>${nome}</h3>
      <div class="subject-stats">
        <span><i class="fas fa-clock"></i> ${formatarTempo(dados.minutosEstudados)} estudadas</span>
        <span><i class="fas fa-target"></i> Meta: ${dados.metaHoras}h</span>
      </div>
      <div class="subject-progress">
        <div class="subject-progress-bar" style="width: ${progresso}%"></div>
      </div>
      <p class="subject-progress-text">${Math.round(progresso)}% concluído</p>
    `;
    container.appendChild(div);
  }
}

async function loadRankingPosition(userId, totalMinutos) {
  try {
    // Buscar todos os usuários para calcular posição
    const usersCollection = collection(db, "usuarios");
    const usersSnapshot = await getDocs(usersCollection);
    
    const allUsers = [];
    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      const materias = userData.materias || {};
      const progressoExtra = userData.progressoExtra || 0;
      const userTotalMinutos = Object.values(materias).reduce((acc, m) => acc + (m.minutosEstudados || 0), 0) + progressoExtra;
      
      allUsers.push({
        userId: userDoc.id,
        totalMinutos: userTotalMinutos
      });
    }
    
    // Ordenar por minutos
    allUsers.sort((a, b) => b.totalMinutos - a.totalMinutos);
    
    // Encontrar posição
    const position = allUsers.findIndex(u => u.userId === userId) + 1;
    
    const positionElement = document.getElementById('ranking-position');
    if (position > 0) {
      let positionClass = '';
      let icon = '<i class="fas fa-trophy"></i>';
      
      if (position === 1) {
        positionClass = 'gold';
        icon = '<i class="fas fa-crown"></i>';
      } else if (position === 2) {
        positionClass = 'silver';
      } else if (position === 3) {
        positionClass = 'bronze';
      }
      
      positionElement.className = `position-number ${positionClass}`;
      positionElement.innerHTML = `${icon} <span>${position}º lugar</span>`;
    } else {
      positionElement.innerHTML = '<span>Não classificado</span>';
    }
  } catch (error) {
    console.error("Erro ao carregar posição no ranking:", error);
    document.getElementById('ranking-position').innerHTML = '<span>Erro ao carregar</span>';
  }
}
