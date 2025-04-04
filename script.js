

let materias = {};
let timer = null;
let tempoDecorrido = 0;
let materiaSelecionada = "";
let segundosAcumulados = 0;
let progressoExtra = 0;




if ("Notification" in window && Notification.permission !== "granted") {
    Notification.requestPermission();
  }
  

  function carregarDoLocalStorage() {
    const dadosSalvos = localStorage.getItem("materiasEstudo");
    if (dadosSalvos) {
      const dados = JSON.parse(dadosSalvos);
      materias = dados.materias || dados; // compatibilidade com estrutura antiga
      progressoExtra = dados.progressoExtra || 0;
  
      atualizarSelect();
      atualizarTabela();
      atualizarMascote();
      atualizarResumoEstudos();
    }
  }

  
  




  function salvarNoLocalStorage() {
    localStorage.setItem("materiasEstudo", JSON.stringify({
      materias,
      progressoExtra
    }));
    verificarConquistas(); // <- adicionado aqui

  }
  
const conquistas = {
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
  }
};

const conquistasSalvas = localStorage.getItem("conquistas");
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
    localStorage.setItem("conquistas", JSON.stringify(conquistas));
    alert(`🏆 Nova conquista: ${conquistas[id].titulo}`);
    atualizarConquistas();
  }
}

function verificarMaratona(dias) {
  const datas = dias.map(d => new Date(d)).sort((a, b) => a - b);
  if (datas.length < 3) return;

  const ultimos = datas.slice(-3);
  const diff1 = (ultimos[1] - ultimos[0]) / (1000 * 60 * 60 * 24);
  const diff2 = (ultimos[2] - ultimos[1]) / (1000 * 60 * 60 * 24);

  if (diff1 === 1 && diff2 === 1 && !conquistas.maratona.desbloqueada) {
    desbloquearConquista("maratona");
  }
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

        const hoje = new Date().toLocaleDateString();
        let minutosHoje = parseInt(localStorage.getItem("estudoHoje_" + hoje) || "0");
        minutosHoje += 1;
        localStorage.setItem("estudoHoje_" + hoje, minutosHoje);

        if (minutosHoje >= 480 && !conquistas.esforcoDiario.desbloqueada) {
          desbloquearConquista("esforcoDiario");
        }

        let diasEstudados = JSON.parse(localStorage.getItem("diasEstudados") || "[]");
        if (!diasEstudados.includes(hoje)) {
          diasEstudados.push(hoje);
          localStorage.setItem("diasEstudados", JSON.stringify(diasEstudados));
        }
        verificarMaratona(diasEstudados);

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
  salvarNoLocalStorage();
  atualizarTabela();
  atualizarResumoEstudos();
  atualizarMascote();
}


function mostrarToast(mensagem) {
  const toast = document.createElement("div");
  toast.className = "toast-sucesso";
  toast.textContent = mensagem;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.classList.add("visivel");
    setTimeout(() => {
      toast.classList.remove("visivel");
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }, 100);
}








function verificarConquistas() {
  const materia = materias[materiaSelecionada];
  if (
    materia &&
    materia.minutosEstudados >= materia.metaHoras * 60 &&
    !conquistas.primeiraMeta.desbloqueada
  ) {
    desbloquearConquista("primeiraMeta");
  }


  let diasEstudados = JSON.parse(localStorage.getItem("diasEstudados") || "[]");
  const hoje = new Date().toISOString().split("T")[0];
  if (!diasEstudados.includes(hoje)) {
    diasEstudados.push(hoje);
    localStorage.setItem("diasEstudados", JSON.stringify(diasEstudados));
  }
  verificarMaratona(diasEstudados);

}


  
  function atualizarResumoEstudos() {
    const totalMinutos = Object.values(materias).reduce((soma, mat) => soma + mat.minutosEstudados, 0) + progressoExtra;
    const totalHoras = (totalMinutos / 60).toFixed(2);
  
    const resumoEl = document.getElementById("resumoEstudos");
    const totalEl = document.getElementById("totalHoras");
    const tooltipDetalhes = document.getElementById("tooltipDetalhes");
  
    if (resumoEl && totalEl) {
      totalEl.textContent = totalHoras;
    }
  
    if (tooltipDetalhes) {
      tooltipDetalhes.textContent = ""; // limpa antes
      for (const nome in materias) {
        const horas = (materias[nome].minutosEstudados / 60).toFixed(2);
        tooltipDetalhes.textContent += `${nome}: ${horas}h\n`;
      }
    }
  }
  

  
  
  
  

  function atualizarMascote() {
    const totalMinutos = Object.values(materias).reduce((soma, mat) => soma + mat.minutosEstudados, 0) + progressoExtra;
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
  
  
  function ativarModoEdicao() {
    const tabelaEdicao = document.getElementById("tabelaEdicao");
    tabelaEdicao.innerHTML = "";
  
    for (const nome in materias) {
      const { metaHoras } = materias[nome];
  
      tabelaEdicao.innerHTML += `
        <tr>
          <td><input type="text" value="${nome}" data-original="${nome}" class="input-nome"></td>
          <td><input type="number" min="1" value="${metaHoras}" class="input-meta"></td>
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
      const meta = parseInt(inputMeta.value);
      const nomeOriginal = inputNome.getAttribute("data-original");
  
      if (!novoNome || !meta) continue;
  
      const minutosEstudados = materias[nomeOriginal]?.minutosEstudados || 0;
      novasMaterias[novoNome] = { metaHoras: meta, minutosEstudados };
    }
  
    materias = novasMaterias;
    salvarNoLocalStorage();
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
      salvarNoLocalStorage();
      ativarModoEdicao();
    }
  }




  
  
  
  

// Iniciar com tempo padrão
atualizarTimerDisplay();
carregarDoLocalStorage();
atualizarResumoEstudos();


document.addEventListener("DOMContentLoaded", () => {
  const btnLogar = document.getElementById("btn-logar");
  const btnRegistrar = document.getElementById("btn-registrar");

  if (btnLogar) btnLogar.addEventListener("click", window.logar);
  if (btnRegistrar) btnRegistrar.addEventListener("click", window.registrar);
});
