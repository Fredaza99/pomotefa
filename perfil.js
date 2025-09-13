// perfil.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";

// Configuração do Firebase (a mesma do seu projeto)
const firebaseConfig = {
  apiKey: "AIzaSyARWCI-yDweVjmZWc99GZFsFB8A4tnZDaY",
  authDomain: "pomotefa.firebaseapp.com",
  projectId: "pomotefa",
  storageBucket: "pomotefa.firebasestorage.app",
  messagingSenderId: "759701977199",
  appId: "1:759701977199:web:c9b2c6bbdd73900e89b59a",
  measurementId: "G-HZZ9KXB1MD"
};

// Inicialização
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

onAuthStateChanged(auth, (user) => {
  if (user) {
    // Usuário está logado, carregar dados do perfil
    loadProfileData(user);
  } else {
    // Usuário não está logado, redirecionar para a página de login
    window.location.href = 'index.html';
  }
});

async function loadProfileData(user) {
  const userRef = doc(db, "usuarios", user.uid);
  const docSnap = await getDoc(userRef);

  if (docSnap.exists()) {
    const data = docSnap.data();
    
    // Extrair dados do Firebase
    const materias = data.materias || {};
    const conquistas = data.conquistas || {};
    const diasEstudados = data.diasEstudados || {}; // Corrigido para objeto
    const progressoExtra = data.progressoExtra || 0;

    const totalMinutos = Object.values(materias).reduce((acc, m) => acc + m.minutosEstudados, 0) + progressoExtra;
    const totalHoras = totalMinutos / 60;

    // 1. Atualizar informações básicas
    document.getElementById('user-name').textContent = user.email.split('@')[0];
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

    // 7. Total de Horas Estudadas
    document.getElementById('total-hours-text').textContent = `${totalHoras.toFixed(2)} horas`;
    const rankProgress = (totalHoras % 50) / 50 * 100; // Exemplo: progresso para o próximo rank a cada 50h
    document.getElementById('total-hours-bar').style.width = `${rankProgress}%`;

  } else {
    console.log("Nenhum dado encontrado para este usuário!");
    // Lidar com o caso de não haver dados
    document.getElementById('user-name').textContent = user.email.split('@')[0];
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

    // Converte as strings de data (dd/mm/yyyy) para objetos Date
    const dates = dayStrings.map(dayStr => {
        const parts = dayStr.split('/');
        // Formato esperado: dia, mês, ano
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
            break; // A sequência foi quebrada
        }
        // Se diffDays for 0, é o mesmo dia, então ignora
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
    container.innerHTML = '<p>Nenhuma conquista desbloqueada ainda. Continue estudando!</p>';
    return;
  }

  // Exibe as últimas 3 conquistas
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

// Função de logout para a página de perfil
window.logout = async function() {
  try {
    await signOut(auth);
    console.log("Usuário deslogado com sucesso");
    window.location.href = 'index.html';
  } catch (erro) {
    console.error("Erro ao fazer logout:", erro.message);
  }
}
