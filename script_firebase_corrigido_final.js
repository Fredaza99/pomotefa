
// Firebase SDKs
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import { getFirestore, doc, setDoc, getDoc, updateDoc, increment } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";


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

// Inicialização
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
let usuarioRef = null;
let usuarioLogado = null;

let uid = null;


const auth = getAuth(app);


// Carregar do Firebase
async function carregarDoFirebase() {
  if (!usuarioRef) {
    console.warn("Tentativa de acessar dados sem usuário logado.");
    return;
  }
  const snap = await getDoc(usuarioRef); 
  if (snap.exists()) {
    const dados = snap.data();
    materias = dados.materias || {};
    
    // Mesclar conquistas salvas com as novas
    const conquistasSalvas = dados.conquistas || {};
    for (const id in conquistasSalvas) {
      if (conquistas[id]) {
        conquistas[id].desbloqueada = conquistasSalvas[id].desbloqueada;
      }
    }
    
    progressoExtra = dados.progressoExtra || 0;
    diasEstudados = dados.diasEstudados || {};
    horariosEstudo = dados.horariosEstudo || {};
    
    // Salvar conquistas atualizadas (incluindo novas)
    await updateDoc(usuarioRef, { conquistas: conquistas });
    
    atualizarSelect();
    atualizarTabela();
    atualizarMascote();
    atualizarResumoEstudos();
    atualizarConquistas();
  } else {
    await setDoc(usuarioRef, {
      materias: {},
      conquistas: conquistas,
      progressoExtra: 0,
      diasEstudados: {},
      horariosEstudo: {}
    });
  }
}




async function salvarNoFirebase(dados) {
  if (!usuarioRef) return;

  if (!dados || typeof dados !== "object") {
    console.warn("⚠️ Dados inválidos para salvar no Firebase:", dados);
    return;
  }

  try {
    const docSnap = await getDoc(usuarioRef);
    if (docSnap.exists()) {
      await updateDoc(usuarioRef, dados);
    } else {
      await setDoc(usuarioRef, dados);
    }
  } catch (erro) {
    console.error("Erro ao salvar dados no Firestore:", erro);
  }
}


function gerarDadosParaSalvar() {
  return {
    materias: materias || {},
    conquistas: conquistas || {},
    progressoExtra: progressoExtra || 0,
    diasEstudados: diasEstudados || {},
    horariosEstudo: horariosEstudo || {}
  };
}



let materias = {};

let diasEstudados = {};

let horariosEstudo = {}; // Rastrear horários de estudo

// Função para obter faixa de horário atual
function getFaixaHorario() {
  const agora = new Date();
  const hora = agora.getHours();
  
  if (hora >= 6 && hora < 9) return '06:00 - 09:00';
  if (hora >= 9 && hora < 12) return '09:00 - 12:00';
  if (hora >= 12 && hora < 15) return '12:00 - 15:00';
  if (hora >= 15 && hora < 18) return '15:00 - 18:00';
  if (hora >= 18 && hora < 21) return '18:00 - 21:00';
  if (hora >= 21 && hora < 24) return '21:00 - 00:00';
  return '00:00 - 06:00';
}

let timerInterval;
let tempoRestante = 0;
let timerAtivo = false;

// Variáveis do Modo de Foco
let focusMode = false;
let focusTimer = null;
let currentCycle = 1;
let currentSession = 'focus'; // 'focus' ou 'break'
let focusTimeRemaining = 30 * 60; // 30 minutos em segundos
let isBreakTime = false;
let segundosAcumuladosFoco = 0; // Contador de segundos para modo Pomodoro

// Configuração dos ciclos Pomodoro
const pomodoroConfig = {
  focusTime: 30 * 60, // 30 minutos
  shortBreak: 5 * 60, // 5 minutos
  longBreak: 25 * 60, // 25 minutos (20-30 min)
  totalCycles: 4
};

let materiaSelecionada = "";
let segundosAcumulados = 0;
let progressoExtra = 0;

if ("Notification" in window && Notification.permission !== "granted") {
    Notification.requestPermission();
}

export function registrar() {
  const email = document.getElementById("email").value;
  const senha = document.getElementById("senha").value;

  createUserWithEmailAndPassword(auth, email, senha)
    .then((userCredential) => {
      console.log("Usuário registrado:", userCredential.user.uid);
    })
    .catch((error) => {
      console.error("Erro ao registrar:", error.message);
    });
}

export async function logar() {
  const email = document.getElementById("email").value;
  const senha = document.getElementById("senha").value;

  try {
    const credenciais = await signInWithEmailAndPassword(auth, email, senha);
    console.log("Usuário logado:", credenciais.user.uid);
    window.location.href = 'perfil.html'; // Redireciona para o perfil
  } catch (erro) {
    console.error("Erro ao logar:", erro.message);
  }
}

export async function logout() {
  try {
    await signOut(auth);
    console.log("Usuário deslogado com sucesso");
    window.location.href = 'index.html'; // Redireciona para a página de login
  } catch (erro) {
    console.error("Erro ao fazer logout:", erro.message);
  }
}

let conquistas = {
  primeiraMeta: {
    titulo: "Primeira matéria concluída",
    descricao: "Complete a meta de uma matéria pela primeira vez.",
    icone: "images/conquistas/primeira.png",
    desbloqueada: false
  },
  esforcoDiario: {
    titulo: "Grande esforço",
    descricao: "Estude 8 horas em um único dia.",
    icone: "images/conquistas/grande-esforco.png",
    desbloqueada: false
  },
  maratona: {
    titulo: "Maratona de estudos",
    descricao: "Estude por 3 dias seguidos.",
    icone: "images/conquistas/maratona.png",
    desbloqueada: false
  },
  centenario: {
    titulo: "Centenário do Conhecimento",
    descricao: "Acumule 100 horas totais de estudo.",
    icone: "images/conquistas/primeira.png",
    desbloqueada: false
  },
  corujaDaNoite: {
    titulo: "Coruja da Noite",
    descricao: "Estude 10 horas entre 21:00 e 06:00.",
    icone: "images/conquistas/primeira.png",
    desbloqueada: false
  },
  mestre5Materias: {
    titulo: "Polímata",
    descricao: "Complete a meta de 5 matérias diferentes.",
    icone: "images/conquistas/primeira.png",
    desbloqueada: false
  }
};

const conquistasSalvas = null;
if (conquistasSalvas) {
  const salvas = JSON.parse(conquistasSalvas);
  for (const id in salvas) {
    if (conquistas[id]) {
      conquistas[id].desbloqueada = salvas[id].desbloqueada;
    }
  }
}

function abrirModalConquistas() {
  atualizarConquistas();
  document.getElementById("modalConquistas").style.display = "block";
}

function fecharModalConquistas() {
  document.getElementById("modalConquistas").style.display = "none";
}

function atualizarConquistas() {
  const total = Object.keys(conquistas).length;
  const desbloqueadas = Object.values(conquistas).filter(c => c.desbloqueada).length;

  document.getElementById("progressoConquistas").textContent = `${desbloqueadas} de ${total} conquistadas (${Math.round((desbloqueadas / total) * 100)}%)`;

  const listaDesbloqueadas = document.getElementById("conquistasDesbloqueadas");
  const listaBloqueadas = document.getElementById("conquistasBloqueadas");

  listaDesbloqueadas.innerHTML = "";
  listaBloqueadas.innerHTML = "";

  for (const id in conquistas) {
    const c = conquistas[id];
    const div = document.createElement("div");
    div.className = `conquista ${c.desbloqueada ? 'desbloqueada' : ''}`;
    div.innerHTML = `
  <img class="icone" src="${c.icone}" alt="ícone conquista">
      <div class="info">
        <strong>${c.titulo}</strong>
        <p>${c.descricao}</p>
      </div>
    `;

    if (c.desbloqueada) {
      listaDesbloqueadas.appendChild(div);
    } else {
      listaBloqueadas.appendChild(div);
    }
  }
}

function desbloquearConquista(id) {
  if (!conquistas[id].desbloqueada) {
    conquistas[id].desbloqueada = true;
    // removido localStorage.setItem
    alert(`🏆 Nova conquista: ${conquistas[id].titulo}`);
    atualizarConquistas();
  }
}

function verificarMaratona(dias) {
  if (dias.length < 3) return;

  // Converter strings de data brasileira (dd/mm/yyyy) para objetos Date
  const datas = dias.map(d => {
    const parts = d.split('/');
    return new Date(parts[2], parts[1] - 1, parts[0]);
  }).sort((a, b) => a - b);

  // Verificar os últimos 3 dias
  const ultimos = datas.slice(-3);
  const diff1 = Math.round((ultimos[1] - ultimos[0]) / (1000 * 60 * 60 * 24));
  const diff2 = Math.round((ultimos[2] - ultimos[1]) / (1000 * 60 * 60 * 24));

  if (diff1 === 1 && diff2 === 1 && !conquistas.maratona.desbloqueada) {
    desbloquearConquista("maratona");
  }
}

// Verificar novas conquistas
function verificarNovasConquistas() {
  // 1. Centenário do Conhecimento - 100 horas totais
  const totalMinutos = Object.values(materias).reduce((acc, m) => acc + m.minutosEstudados, 0) + progressoExtra;
  const totalHoras = totalMinutos / 60;
  
  if (totalHoras >= 100 && !conquistas.centenario.desbloqueada) {
    desbloquearConquista("centenario");
  }
  
  // 2. Coruja da Noite - 10 horas entre 21:00 e 06:00
  const horariosNoturnos = ['21:00 - 00:00', '00:00 - 06:00'];
  let minutosNoturnos = 0;
  
  horariosNoturnos.forEach(horario => {
    minutosNoturnos += horariosEstudo[horario] || 0;
  });
  
  if (minutosNoturnos >= 600 && !conquistas.corujaDaNoite.desbloqueada) {
    desbloquearConquista("corujaDaNoite");
  }
  
  // 3. Polímata - Complete 5 matérias diferentes
  let materiasCompletas = 0;
  
  for (const nome in materias) {
    const materia = materias[nome];
    if (materia.minutosEstudados >= materia.metaHoras * 60) {
      materiasCompletas++;
    }
  }
  
  if (materiasCompletas >= 5 && !conquistas.mestre5Materias.desbloqueada) {
    desbloquearConquista("mestre5Materias");
  }
}

function iniciarEstudo() {
  materiaSelecionada = document.getElementById("materiaAtual").value;
  if (!materiaSelecionada || !materias[materiaSelecionada]) return;

  if (timerInterval) return; // Já está rodando

  timerInterval = setInterval(() => {
    tempoRestante++;
    segundosAcumulados++;

    atualizarTimerDisplay();

    // A cada 60 segundos, somamos 1 minuto à matéria
    if (segundosAcumulados >= 60) {
      materias[materiaSelecionada].minutosEstudados += 1;
      segundosAcumulados = 0;

      // ✅ Desbloqueios automáticos (seguros)
      const materia = materias[materiaSelecionada];
      if (
        materia &&
        materia.minutosEstudados >= materia.metaHoras * 60 &&
        !materia.metaConcluida
      ) {
        materia.metaConcluida = true;
        concluirMeta(materiaSelecionada);

        if (!conquistas.primeiraMeta.desbloqueada) {
          desbloquearConquista("primeiraMeta");
        }
      }

      const hoje = new Date().toLocaleDateString('pt-BR');
      
      // Atualizar minutos do dia atual
      if (!diasEstudados[hoje]) {
        diasEstudados[hoje] = 0;
      }
      diasEstudados[hoje] += 1;

      // Verificar conquista de 8 horas em um dia
      if (diasEstudados[hoje] >= 480 && !conquistas.esforcoDiario.desbloqueada) {
        desbloquearConquista("esforcoDiario");
      }

      // Verificar conquista de maratona (3 dias seguidos)
      verificarMaratona(Object.keys(diasEstudados));

      salvarNoFirebase(gerarDadosParaSalvar());
      atualizarTabela();
      atualizarMascote();
      atualizarResumoEstudos();
    }
  }, 1000);
}

function pararEstudo() {
  clearInterval(timerInterval);
  timerInterval = null;
}

function atualizarTimerDisplay() {
  const horas = Math.floor(tempoRestante / 3600);
  const minutos = Math.floor((tempoRestante % 3600) / 60);
  const segundos = tempoRestante % 60;

  const tempoFormatado = 
    `${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}:${String(segundos).padStart(2, '0')}`;

  document.getElementById("timer").textContent = tempoFormatado;
  
  // Atualizar título da aba com o timer
  if (timerInterval) {
    document.title = `⏱️ ${tempoFormatado} - Pomotefa`;
  } else {
    document.title = 'Pomotefa - Timer Pomodoro';
  }
}

function adicionarMateria() {
  const nome = document.getElementById("novaMateria").value.trim();
  const meta = parseFloat(document.getElementById("metaHoras").value);
  if (!nome || !meta || meta <= 0 || materias[nome]) return;

  materias[nome] = { metaHoras: meta, minutosEstudados: 0 };
  atualizarSelect();
  atualizarTabela();
  salvarNoFirebase(gerarDadosParaSalvar());
  atualizarResumoEstudos();
  atualizarMascote();
  document.getElementById("novaMateria").value = "";
  document.getElementById("metaHoras").value = "";
}

function atualizarSelect() {
  const select = document.getElementById("materiaAtual");
  select.innerHTML = "";
  for (const nome in materias) {
    const option = document.createElement("option");
    option.value = nome;
    option.textContent = nome;
    select.appendChild(option);
  }
  materiaSelecionada = select.value;
}

function atualizarTabela() {
  const tbody = document.getElementById("tabelaMetas");
  tbody.innerHTML = "";
  for (const nome in materias) {
    const { metaHoras, minutosEstudados } = materias[nome];
    const progresso = Math.min((minutosEstudados / (metaHoras * 60)) * 100, 100);

    tbody.innerHTML += `
  <tr data-progresso style="--progresso: ${progresso}%">
    <td>${nome}</td>
    <td>${metaHoras}</td>
    <td>${minutosEstudados}</td>
  </tr>
`;
  }
}

function concluirMeta(materiaNome) {
  const materia = materias[materiaNome];
  if (!materia) return;

  // 🎉 Feedback visual
  mostrarToast(`🎉 Parabéns! Você concluiu sua meta de ${materiaNome}!`);

  // ✅ Resetar o progresso, mas manter a meta
  materia.minutosEstudados = 0;

  // ⚙️ Marcar como não concluída para poder atingir de novo no futuro
  materia.metaConcluida = false;

  // 💾 Atualizações visuais e armazenamento
  salvarNoFirebase(gerarDadosParaSalvar());
  atualizarTabela();
  atualizarMascote();
  atualizarResumoEstudos();
}

function mostrarToast(mensagem) {
  const toast = document.getElementById("toastSucesso");
  toast.textContent = mensagem;
  toast.classList.add("visivel");
  
  setTimeout(() => {
    toast.classList.remove("visivel");
  }, 3000);
}

// ===== FUNÇÕES DO MODO DE FOCO =====

// Entrar no modo de foco
function enterFocusMode() {
  if (timerInterval) {
    alert('Pare o timer atual antes de entrar no modo de foco.');
    return;
  }
  
  focusMode = true;
  currentCycle = 1;
  currentSession = 'focus';
  focusTimeRemaining = pomodoroConfig.focusTime;
  isBreakTime = false;
  
  updateFocusDisplay();
  document.getElementById('focusOverlay').classList.add('active');
}

// Sair do modo de foco
function exitFocusMode() {
  focusMode = false;
  if (focusTimer) {
    clearInterval(focusTimer);
    focusTimer = null;
  }
  document.getElementById('focusOverlay').classList.remove('active');
  resetFocusState();
  
  // Restaurar título padrão
  document.title = 'Pomotefa - Timer Pomodoro';
}

// Resetar estado do foco
function resetFocusState() {
  currentCycle = 1;
  currentSession = 'focus';
  focusTimeRemaining = pomodoroConfig.focusTime;
  isBreakTime = false;
  segundosAcumuladosFoco = 0; // Resetar contador de segundos
  updateFocusDisplay();
}

// Toggle do timer de foco
function toggleFocusTimer() {
  const playPauseBtn = document.getElementById('focusPlayPause');
  
  if (focusTimer) {
    // Pausar
    clearInterval(focusTimer);
    focusTimer = null;
    playPauseBtn.innerHTML = '<i class="fas fa-play"></i> Continuar';
  } else {
    // Iniciar/Continuar
    startFocusTimer();
    playPauseBtn.innerHTML = '<i class="fas fa-pause"></i> Pausar';
  }
}

// Iniciar timer de foco
function startFocusTimer() {
  focusTimer = setInterval(() => {
    focusTimeRemaining--;
    updateFocusDisplay();
    
    // Registrar tempo minuto a minuto durante sessão de foco
    if (currentSession === 'focus') {
      segundosAcumuladosFoco++;
      
      if (segundosAcumuladosFoco >= 60) {
        const materiaAtual = document.getElementById('materiaAtual').value;
        if (materiaAtual && materias[materiaAtual]) {
          materias[materiaAtual].minutosEstudados += 1;
          
          // Atualizar diasEstudados
          const hoje = new Date().toLocaleDateString('pt-BR');
          if (!diasEstudados[hoje]) {
            diasEstudados[hoje] = 0;
          }
          diasEstudados[hoje] += 1;
          
          // Atualizar horários de estudo
          const faixaHorario = getFaixaHorario();
          if (!horariosEstudo[faixaHorario]) {
            horariosEstudo[faixaHorario] = 0;
          }
          horariosEstudo[faixaHorario] += 1;
          
          // Verificar conquistas
          if (diasEstudados[hoje] >= 480 && !conquistas.esforcoDiario.desbloqueada) {
            desbloquearConquista("esforcoDiario");
          }
          verificarMaratona(Object.keys(diasEstudados));
          verificarNovasConquistas();
          
          // Salvar no Firebase
          salvarNoFirebase(gerarDadosParaSalvar());
          atualizarTabela();
          atualizarMascote();
          atualizarResumoEstudos();
          
          console.log(`✅ Pomodoro: +1 minuto registrado para ${materiaAtual}`);
        }
        segundosAcumuladosFoco = 0;
      }
    }
    
    if (focusTimeRemaining <= 0) {
      handleFocusSessionComplete();
    }
  }, 1000);
}

// Lidar com sessão completa
function handleFocusSessionComplete() {
  clearInterval(focusTimer);
  focusTimer = null;
  
  // Tocar som de notificação
  playNotificationSound();
  
  if (currentSession === 'focus') {
    // Sessão de foco completa, iniciar pausa
    if (currentCycle === pomodoroConfig.totalCycles) {
      // Pausa longa após 4º ciclo
      focusTimeRemaining = pomodoroConfig.longBreak;
      currentSession = 'longBreak';
    } else {
      // Pausa curta
      focusTimeRemaining = pomodoroConfig.shortBreak;
      currentSession = 'shortBreak';
    }
    isBreakTime = true;
    
    // Resetar contador de segundos ao mudar de sessão
    segundosAcumuladosFoco = 0;
    
    // Tempo já foi registrado minuto a minuto, apenas atualizar interface
    atualizarTabela();
    atualizarMascote();
    atualizarResumoEstudos();
    
  } else {
    // Pausa completa
    if (currentCycle === pomodoroConfig.totalCycles) {
      // Ciclo completo, resetar
      mostrarToast('🎉 Ciclo Pomodoro completo! Parabéns!');
      exitFocusMode();
      return;
    } else {
      // Próximo ciclo
      currentCycle++;
      currentSession = 'focus';
      focusTimeRemaining = pomodoroConfig.focusTime;
      isBreakTime = false;
    }
  }
  
  updateFocusDisplay();
  
  // Auto-iniciar próxima sessão após 3 segundos
  setTimeout(() => {
    if (focusMode) {
      startFocusTimer();
      document.getElementById('focusPlayPause').innerHTML = '<i class="fas fa-pause"></i> Pausar';
    }
  }, 3000);
}

// Pular sessão atual
function skipFocusSession() {
  if (focusTimer) {
    clearInterval(focusTimer);
    focusTimer = null;
  }
  
  focusTimeRemaining = 0;
  handleFocusSessionComplete();
}

// Atualizar display do modo de foco
function updateFocusDisplay() {
  const cycleEl = document.getElementById('focusCycleNumber');
  const sessionEl = document.getElementById('focusSessionType');
  const timerEl = document.getElementById('focusTimerDisplay');
  
  cycleEl.textContent = currentCycle;
  
  let sessionText = '';
  let emoji = '';
  
  if (currentSession === 'focus') {
    sessionEl.textContent = 'FOCO';
    sessionEl.style.color = '#00D4FF';
    sessionText = 'FOCO';
    emoji = '🎯';
  } else if (currentSession === 'shortBreak') {
    sessionEl.textContent = 'PAUSA CURTA';
    sessionEl.style.color = '#FFD700';
    sessionText = 'PAUSA';
    emoji = '☕';
  } else if (currentSession === 'longBreak') {
    sessionEl.textContent = 'PAUSA LONGA';
    sessionEl.style.color = '#FF6B6B';
    sessionText = 'PAUSA LONGA';
    emoji = '🌟';
  }
  
  const minutes = Math.floor(focusTimeRemaining / 60);
  const seconds = focusTimeRemaining % 60;
  const timeFormatted = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  
  timerEl.textContent = timeFormatted;
  
  // Atualizar título da aba no modo Pomodoro
  if (focusMode && focusTimer) {
    document.title = `${emoji} ${timeFormatted} ${sessionText} - Pomotefa`;
  } else if (focusMode) {
    document.title = `${emoji} ${timeFormatted} ${sessionText} (Pausado) - Pomotefa`;
  }
}

// Tocar som de notificação
function playNotificationSound() {
  try {
    const audio = new Audio();
    if (currentSession === 'focus') {
      audio.src = 'sounds/fim-pomodoro.mp3';
    } else {
      audio.src = 'sounds/fim-intervalo.mp3';
    }
    audio.play().catch(e => console.log('Não foi possível tocar o som:', e));
  } catch (e) {
    console.log('Erro ao tocar som:', e);
  }
}

// Tornar funções globais
window.enterFocusMode = enterFocusMode;
window.exitFocusMode = exitFocusMode;
window.toggleFocusTimer = toggleFocusTimer;
window.skipFocusSession = skipFocusSession;

// ===== TOOLTIP POMODORO =====

// Gerenciar tooltip customizado
document.addEventListener('DOMContentLoaded', () => {
  const helpIcon = document.querySelector('.pomodoro-help-icon');
  const tooltip = document.getElementById('pomodoro-info');
  
  if (helpIcon && tooltip) {
    let tooltipTimeout;
    
    helpIcon.addEventListener('mouseenter', () => {
      clearTimeout(tooltipTimeout);
      tooltip.classList.add('show');
    });
    
    helpIcon.addEventListener('mouseleave', () => {
      tooltipTimeout = setTimeout(() => {
        tooltip.classList.remove('show');
      }, 200);
    });
    
    // Manter tooltip visível quando hover sobre ele
    tooltip.addEventListener('mouseenter', () => {
      clearTimeout(tooltipTimeout);
    });
    
    tooltip.addEventListener('mouseleave', () => {
      tooltip.classList.remove('show');
    });
  }
});








function verificarConquistas() {
  const materia = materias[materiaSelecionada];
  if (
    materia &&
    materia.minutosEstudados >= materia.metaHoras * 60 &&
    !conquistas.primeiraMeta.desbloqueada
  ) {
    desbloquearConquista("primeiraMeta");
  }

  // Verificar maratona com os dados globais
  verificarMaratona(Object.keys(diasEstudados));
}


  
  function atualizarResumoEstudos() {
    const totalMinutos = Object.values(materias).reduce((soma, mat) => soma + mat.minutosEstudados, 0) + progressoExtra;
  
    const resumoEl = document.getElementById("resumoEstudos");
    const totalEl = document.getElementById("totalHoras");
  
    if (resumoEl && totalEl) {
      totalEl.textContent = formatarTempo(totalMinutos);
    }
  
    const tooltipDetalhes = document.getElementById("tooltipDetalhes");
    if (tooltipDetalhes) {
      tooltipDetalhes.textContent = ""; // limpa antes
      for (const nome in materias) {
        tooltipDetalhes.textContent += `${nome}: ${formatarTempo(materias[nome].minutosEstudados)}\n`;
      }
    }
  }
  

  
  
  
  

  function atualizarMascote() {
    const totalMinutos = Object.values(materias).reduce((soma, mat) => soma + mat.minutosEstudados, 0) + progressoExtra;
    const totalHoras = totalMinutos / 60;
    const mascoteImg = document.getElementById("mascoteImg");
    const nivelMascote = document.getElementById("nivelMascote");
    const barraXp = document.getElementById("xpMascote");
    const textoXp = document.getElementById("xpTexto");
    const rankBadge = document.getElementById("rankBadge");
  
    let nivel = 1;
    let xpMin = 0;
    let xpMax = 240;
    let rank = "Novato";
    let rankClass = "novato";
  
    // Calcular rank baseado em horas (igual ao ranking)
    if (totalHoras >= 500) {
      rank = "Lendário";
      rankClass = "lendário";
    } else if (totalHoras >= 200) {
      rank = "Mestre";
      rankClass = "mestre";
    } else if (totalHoras >= 100) {
      rank = "Dedicado";
      rankClass = "dedicado";
    } else if (totalHoras >= 50) {
      rank = "Estudante";
      rankClass = "estudante";
    } else if (totalHoras >= 10) {
      rank = "Aprendiz";
      rankClass = "aprendiz";
    } else {
      rank = "Novato";
      rankClass = "novato";
    }
  
    // Calcular nível do mascote baseado em minutos
    if (totalMinutos >= 18000) { // 300h
      nivel = 6;
      xpMin = 18000;
      xpMax = 18000;
    } else if (totalMinutos >= 5400) { // 90h
      nivel = 5;
      xpMin = 5400;
      xpMax = 18000;
    } else if (totalMinutos >= 2880) { // 48h
      nivel = 4;
      xpMin = 2880;
      xpMax = 5400;
    } else if (totalMinutos >= 1200) { // 20h
      nivel = 3;
      xpMin = 1200;
      xpMax = 2880;
    } else if (totalMinutos >= 240) { // 4h
      nivel = 2;
      xpMin = 240;
      xpMax = 1200;
    } else {
      nivel = 1;
      xpMin = 0;
      xpMax = 240;
    }
  
    mascoteImg.src = `images/mascote${Math.min(nivel, 5)}.webp`;
    nivelMascote.textContent = Math.min(nivel, 5);
    
    // Adicionar classe de nível para animações
    mascoteImg.className = '';
    if (nivel >= 3) {
      mascoteImg.classList.add(`nivel-${Math.min(nivel, 5)}`);
    }
    
    // Atualizar badge de rank
    if (rankBadge) {
      rankBadge.textContent = rank;
      rankBadge.className = `rank-badge rank-${rankClass}`;
    }
  
    const xpAtualMin = totalMinutos - xpMin;
    const xpNecessarioMin = xpMax - xpMin;
    const progresso = xpNecessarioMin > 0 ? (xpAtualMin / xpNecessarioMin) * 100 : 100;
  
    barraXp.style.width = `${Math.min(progresso, 100)}%`;
    textoXp.textContent = `XP: ${xpAtualMin} / ${xpNecessarioMin} min`;
  }
  
  
  function ativarModoEdicao() {
    const tabelaEdicao = document.getElementById("tabelaEdicao");
    tabelaEdicao.innerHTML = "";
  
    for (const nome in materias) {
      const { metaHoras } = materias[nome];
  
      tabelaEdicao.innerHTML += `
        <tr>
          <td><input type="text" value="${nome}" data-original="${nome}" class="input-nome"></td>
          <td><input type="number" min="0.5" step="0.5" value="${metaHoras}" class="input-meta"></td>
          <td><button onclick="excluirMateria('${nome}')">🗑️ Excluir</button></td>
        </tr>
      `;
    }
  
    document.getElementById("modoEdicao").style.display = "block";
  }
  
  function salvarEdicoes() {
    const linhas = document.querySelectorAll("#tabelaEdicao tr");
  
    const novasMaterias = {};
    for (const linha of linhas) {
      const inputNome = linha.querySelector(".input-nome");
      const inputMeta = linha.querySelector(".input-meta");
  
      const novoNome = inputNome.value.trim();
      const meta = parseFloat(inputMeta.value);
      const nomeOriginal = inputNome.getAttribute("data-original");
  
      if (!novoNome || !meta || meta <= 0) continue;
  
      const minutosEstudados = materias[nomeOriginal]?.minutosEstudados || 0;
      novasMaterias[novoNome] = { metaHoras: meta, minutosEstudados };
    }
  
    materias = novasMaterias;
    salvarNoFirebase(gerarDadosParaSalvar());
    atualizarTabela();
    atualizarSelect();
    atualizarResumoEstudos();
    atualizarMascote();
  
    document.getElementById("modoEdicao").style.display = "none";
    document.getElementById("editarMateriasBtn").disabled = false;
      }
  
  function excluirMateria(nome) {
    if (confirm(`Tem certeza que deseja excluir "${nome}"?`)) {
      if (materias[nome]?.minutosEstudados) {
        progressoExtra += materias[nome].minutosEstudados;
      }
      delete materias[nome];
      salvarNoFirebase(gerarDadosParaSalvar());
      ativarModoEdicao();
    }
  }




  
  
  
  


function verificarFirefox() {
  if (navigator.userAgent.includes("Firefox")) {
    const aviso = document.getElementById("aviso-firefox");
    if (aviso) aviso.classList.remove("oculto");
  }
}

function fecharAvisoFirefox() {
  const aviso = document.getElementById("aviso-firefox");
  if (aviso) aviso.classList.add("oculto");
}

verificarFirefox();






window.registrar = registrar;
window.logar = logar;
window.logout = logout;
window.adicionarMateria = adicionarMateria;
window.abrirModalConquistas = abrirModalConquistas;
window.fecharModalConquistas = fecharModalConquistas;
window.iniciarEstudo = iniciarEstudo;
window.pararEstudo = pararEstudo;
window.salvarEdicoes = salvarEdicoes;
window.excluirMateria = excluirMateria;
window.ativarModoEdicao = ativarModoEdicao;


let firebasePronto = false;

onAuthStateChanged(auth, (user) => {
  if (user) {
    usuarioLogado = user;
    usuarioRef = doc(db, "usuarios", user.uid);
    carregarDoFirebase(); // Carregar dados quando usuário estiver logado
    firebasePronto = true;

    console.log("Usuário autenticado:", user.email);
    atualizarTimerDisplay();
    carregarDoFirebase();
    atualizarResumoEstudos();
  } else {
    console.warn("Usuário deslogado");
  }
  document.body.classList.remove("oculto");

});

