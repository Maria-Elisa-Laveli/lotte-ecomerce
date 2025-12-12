// lotte/favoritos/favoritos.js
const BASE_URL = "https://lotte-ecomerce.onrender.com";

async function loadFavorites() {
  const favoritesArea = document.getElementById("favoritesArea");
  if (!favoritesArea) {
    console.error("Elemento #favoritesArea não encontrado.");
    return;
  }

  // 1️⃣ VERIFICA LOGIN
  const auth = await fetch("https://lotte-ecomerce.onrender.com/checkAuth", {

    credentials: "include"
  }).then(r => r.json()).catch(() => ({ autenticado: false }));

  if (!auth.autenticado) {
    favoritesArea.innerHTML = `
      <div class='empty-favorites'>
        Você precisa estar logado para ver seus favoritos.
      </div>`;
    return;
  }

  // 2️⃣ BUSCA FAVORITOS DO BANCO
 const favProducts = await fetch("https://lotte-ecomerce.onrender.com/favoritos", {

    credentials: "include"
  }).then(r => r.json()).catch(() => []);

  if (!Array.isArray(favProducts) || favProducts.length === 0) {
    favoritesArea.innerHTML = `
      <div class='empty-favorites'>
        💔 Nenhum item favoritado ainda.
      </div>`;
    return;
  }

  favoritesArea.innerHTML = "";

  // 3️⃣ MOSTRA OS CARDS
  favProducts.forEach(prod => {
    const card = document.createElement("div");
    card.className = "product-card";

    card.innerHTML = `
      <img src="${prod.image}" alt="${escapeHtml(prod.name)}">
      <h3>${escapeHtml(prod.name)}</h3>
      <p>${escapeHtml(prod.brand || "")}</p>
      <p class="price">R$ ${Number(prod.price).toFixed(2)}</p>

        <button class="remove-btn" onclick="removerFavorito('${prod._id}')">
    Remover
  </button>
    `;

    favoritesArea.appendChild(card);
  });
}


// função para evitar bug com caracteres especiais
function escapeHtml(text) {
  if (!text) return "";
  return text
    .toString()
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


document.addEventListener("DOMContentLoaded", loadFavorites);
// certifique-se de ter essa constante no topo do arquivo:
// const BASE_URL = "http://localhost:3000";

async function removerFavorito(produtoId) {
  try {
    const res = await fetch(`${BASE_URL}/favoritos/${produtoId}`, {
      method: "DELETE",
      credentials: "include",
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("Falha ao remover:", res.status, text);
      alert("Erro ao remover favorito (veja console).");
      return;
    }

    // Recarrega a lista de favoritos (sua função se chama loadFavorites)
    loadFavorites();
  } catch (error) {
    console.error("Erro ao fazer requisição de remoção:", error);
    alert("Erro de rede ao remover favorito.");
  }
}


