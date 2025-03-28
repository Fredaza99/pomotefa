let materias = {};
let timer = null;
let tempoRestante = 25 * 60;
let emPausa = true;
let emIntervalo = false;
let materiaSelecionada = "";

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
    }
  }
  
  // Salvar dados no localStorage
  function salvarNoLocalStorage() {
    localStorage.setItem("materiasEstudo", JSON.stringify(materias));
  }
  

function adicionarMateria() {
  const nome = document.getElementById("novaMateria").value.trim();
  const meta = parseInt(document.getElementById("metaHoras").value);
  if (!nome || !meta || materias[nome]) return;

  materias[nome] = { metaHoras: meta, minutosEstudados: 0 };
  atualizarSelect();
  atualizarTabela();
  salvarNoLocalStorage();
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
      <tr>
        <td>${nome}</td>
        <td>${metaHoras}</td>
        <td>${minutosEstudados}</td>
        <td>
          <div class="progress-bar">
            <div class="progress" style="width:${progresso}%"></div>
          </div>
        </td>
      </tr>
    `;
  }
}

function playPomodoro() {
  const estudoMin = parseInt(document.getElementById("tempoEstudo").value);
  const intervaloMin = parseInt(document.getElementById("tempoIntervalo").value);
  materiaSelecionada = document.getElementById("materiaAtual").value;

  if (!materiaSelecionada || !materias[materiaSelecionada]) return;

  if (emPausa) {
    emPausa = false;
    timer = setInterval(() => {
      if (tempoRestante > 0) {
        tempoRestante--;
        atualizarTimerDisplay();
      } else {
        clearInterval(timer);
        emPausa = true;
        if (!emIntervalo) {
            materias[materiaSelecionada].minutosEstudados += estudoMin;
            salvarNoLocalStorage();
            atualizarTabela();
            atualizarMascote();
          
            tempoRestante = intervaloMin * 60;
            emIntervalo = true;
            notificar("Hora da Pausa!", "Bom trabalho! Agora descanse um pouco.");
            tocarSom("somPomodoro");
            playPomodoro();
          
          } else {
            tempoRestante = estudoMin * 60;
            emIntervalo = false;
            notificar("Vamos voltar!", "O intervalo acabou, hora de focar.");
            tocarSom("somIntervalo");
            playPomodoro();
          }
      }
    }, 1000);
  }
}

function pausePomodoro() {
  clearInterval(timer);
  emPausa = true;
}

function resetPomodoro() {
  pausePomodoro();
  const estudoMin = parseInt(document.getElementById("tempoEstudo").value);
  tempoRestante = estudoMin * 60;
  emIntervalo = false;
  atualizarTimerDisplay();
}

function atualizarTimerDisplay() {
    const minutos = Math.floor(tempoRestante / 60);
    const segundos = tempoRestante % 60;
    const tempoFormatado = `${String(minutos).padStart(2, '0')}:${String(segundos).padStart(2, '0')}`;
  
    document.getElementById("timer").textContent = tempoFormatado;
  
    if (!emPausa) {
      document.title = `⏳ ${tempoFormatado} - Pomotefa`;
    } else {
      document.title = 'Pomotefa';
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
  
    let nivel = 1;
    if (totalMinutos >= 240) nivel = 5;
    else if (totalMinutos >= 180) nivel = 4;
    else if (totalMinutos >= 120) nivel = 3;
    else if (totalMinutos >= 60) nivel = 2;
  
    mascoteImg.src = `images/mascote${nivel}.webp`;

    nivelMascote.textContent = `Nível ${nivel}`;
  }
  

// Iniciar com tempo padrão
atualizarTimerDisplay();
carregarDoLocalStorage();
atualizarMascote();
