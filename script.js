let materias = {};
let timer = null;
let tempoDecorrido = 0;
let materiaSelecionada = "";
let segundosAcumulados = 0;

if ("Notification" in window && Notification.permission !== "granted") {
    Notification.requestPermission();
  }
  

// Carregar dados do localStorage
function carregarDoLocalStorage() {
    const dadosSalvos = localStorage.getItem("materiasEstudo");
    if (dadosSalvos) {
      materias = JSON.parse(dadosSalvos);
      atualizarSelect();
      atualizarTabela();
      atualizarMascote();
      atualizarResumoEstudos();
      

    }
  }
  
  // Salvar dados no localStorage
  function salvarNoLocalStorage() {
    localStorage.setItem("materiasEstudo", JSON.stringify(materias));
  }


  function iniciarEstudo() {
    materiaSelecionada = document.getElementById("materiaAtual").value;
    if (!materiaSelecionada || !materias[materiaSelecionada]) return;
  
    if (timer) return; // Já está rodando
  
    timer = setInterval(() => {
      tempoDecorrido++;
      segundosAcumulados++;
  
      atualizarTimerDisplay();
  
      // A cada 60 segundos, somamos 1 minuto à matéria
      if (segundosAcumulados >= 60) {
        materias[materiaSelecionada].minutosEstudados += 1;
        segundosAcumulados = 0;
  
        salvarNoLocalStorage();
        atualizarTabela();
        atualizarMascote();
        atualizarResumoEstudos();
      }
    
    }, 1000);
  }
  
  function pararEstudo() {
    clearInterval(timer);
    timer = null;
  }
  
  function atualizarTimerDisplay() {
    const horas = Math.floor(tempoDecorrido / 3600);
    const minutos = Math.floor((tempoDecorrido % 3600) / 60);
    const segundos = tempoDecorrido % 60;
  
    const tempoFormatado = 
      `${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}:${String(segundos).padStart(2, '0')}`;
  
    document.getElementById("timer").textContent = tempoFormatado;
    document.title = timer ? `⏳ ${tempoFormatado} - Pomotefa` : 'Pomotefa';
  }
  

function adicionarMateria() {
  const nome = document.getElementById("novaMateria").value.trim();
  const meta = parseInt(document.getElementById("metaHoras").value);
  if (!nome || !meta || materias[nome]) return;

  materias[nome] = { metaHoras: meta, minutosEstudados: 0 };
  atualizarSelect();
  atualizarTabela();
  salvarNoLocalStorage();
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



  function notificar(titulo, corpo) {
    if (Notification.permission === "granted") {
      new Notification(titulo, {
        body: corpo,
        icon: "images/emoji1.jpg" // ou um ícone qualquer
      });
    }
  }

  function tocarSom(tipo) {
    const audio = document.getElementById(tipo);
    if (audio) {
      audio.currentTime = 0;
      audio.play();
    }
  }
  
  
  

  function atualizarMascote() {
    const totalMinutos = Object.values(materias).reduce((soma, mat) => soma + mat.minutosEstudados, 0);
    const mascoteImg = document.getElementById("mascoteImg");
    const nivelMascote = document.getElementById("nivelMascote");
    const barraXp = document.getElementById("xpMascote");
    const textoXp = document.getElementById("xpTexto");
  
    let nivel = 1;
    let xpMin = 0;
    let xpMax = 240;
  
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
  
    const xpAtualMin = totalMinutos - xpMin;
    const xpNecessarioMin = xpMax - xpMin;
    const progresso = xpNecessarioMin > 0 ? (xpAtualMin / xpNecessarioMin) * 100 : 100;
  
    barraXp.style.width = `${Math.min(progresso, 100)}%`;
    textoXp.textContent = `XP: ${xpAtualMin} / ${xpNecessarioMin} min`;
  }
  
  
  
  
  
  

// Iniciar com tempo padrão
atualizarTimerDisplay();
carregarDoLocalStorage();
atualizarResumoEstudos();
