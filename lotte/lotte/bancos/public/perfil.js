// Alternar abas
document.querySelectorAll(".tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach((t) => t.classList.remove("active"));
    document.querySelectorAll(".tab-content").forEach((c) => c.classList.remove("active"));
    tab.classList.add("active");
    document.getElementById(tab.dataset.tab).classList.add("active");
  });
});

// quando clicar na aba Favoritos → carregar lista
document.querySelector("[data-tab='favoritos']").addEventListener("click", () => {
  carregarFavoritos();
});


// Função para carregar dados do perfil
async function carregarPerfil() {
  try {
    const resposta = await fetch("http://localhost:3000/perfil", {
      method: "GET",
      credentials: "include" // envia o cookie JWT
    });

    if (!resposta.ok) throw new Error("Erro ao carregar perfil");

    const usuario = await resposta.json();

    // Atualiza os campos do perfil
    document.getElementById("usernameDisplay").textContent = usuario.username || "Usuário";
    document.getElementById("emailDisplay").textContent = usuario.email || "E-mail não informado";
    document.getElementById("nomeDisplay").textContent = usuario.nome || "-";
    document.getElementById("telefoneDisplay").textContent = usuario.telefone || "-";
    document.getElementById("cidadeDisplay").textContent = usuario.cidade || "-";
    document.getElementById("estadoDisplay").textContent = usuario.estado || "-";
    document.getElementById("enderecoDisplay").textContent = usuario.endereco || "-";

  } catch (err) {
    console.error("Erro ao carregar perfil:", err);
    alert("Não foi possível carregar os dados do usuário. Faça login novamente.");
    window.location.href = "login.html";
  }
}

// Executa quando a página carregar
window.onload = carregarPerfil;

// Upload de foto





// Logout global
window.logout = async function() {
  try {
    await fetch("http://localhost:3000/logout", {
      method: "POST",
      credentials: "include" // envia o cookie para apagar
    });
  } catch (e) {
    console.error("Erro ao desconectar:", e);
  }


  sessionStorage.removeItem("userEmail");
  window.location.href = "login.html";
};

