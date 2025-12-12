const form = document.getElementById("productForm");
let editingProductId = null;

// Base URL da API
const API_URL = 'http://localhost:3000/api/products';

// 🧩 Listar produtos
function renderProducts() {
  fetch(API_URL)
    .then(res => res.json())
    .then(products => {
      const productList = document.getElementById('productList');
      productList.innerHTML = '';

      if (!products || products.length === 0) {
        productList.innerHTML = '<p>Nenhum produto cadastrado.</p>';
        return;
      }

      products.forEach(prod => {
        const div = document.createElement('div');
        div.classList.add('product-item');
        div.innerHTML = `
          <img src="${prod.image}" alt="${prod.name}" style="width:100px; border-radius:8px;">
          <h3>${prod.name}</h3>
          <p><strong>Marca:</strong> ${prod.brand}</p>
          <p><strong>Preço:</strong> R$ ${parseFloat(prod.price).toFixed(2)}</p>
          <p><strong>Estoque:</strong> ${prod.stock}</p>
          <p><strong>Volume:</strong> ${prod.volume || '-'}</p>
          <p><strong>Categoria:</strong> ${prod.category}</p>
      
          <button class="edit-btn" onclick="editProduct('${prod._id}')">Editar</button>
          <button class="delete-btn" onclick="deleteProduct('${prod._id}')">Excluir</button>
          <button class="publish-btn" onclick="togglePublish('${prod._id}', ${prod.isPublished || false})">
            ${prod.isPublished ? 'Remover produto do site' : 'Publicar produto no site'}
          </button>
        `;
        productList.appendChild(div);
      });
      
    })
    .catch(err => console.error('❌ Erro ao carregar produtos:', err));
}

// 🗑️ Excluir produto
function deleteProduct(id) {
  if (!confirm('Tem certeza que deseja excluir este produto?')) return;

  fetch(`${API_URL}/${id}`, { method: 'DELETE' })
    .then(res => res.json())
    .then(data => {
      alert(data.message || 'Produto excluído.');
      renderProducts();
    })
    .catch(err => {
      console.error('❌ Erro ao excluir produto:', err);
      alert('Erro ao excluir produto.');
    });
}

// ✏️ Editar produto
function editProduct(id) {
  fetch(`${API_URL}/${id}`)
    .then(res => res.json())
    .then(prod => {
      if (!prod) return alert('Produto não encontrado.');

      document.getElementById("name").value = prod.name || '';
      document.getElementById("brand").value = prod.brand || '';
      document.getElementById("price").value = 
  prod.price ? prod.price.toString().replace('.', ',') : '';
      document.getElementById("stock").value = prod.stock || '';
      document.getElementById("volume").value = prod.volume || '';
      document.getElementById("category").value = prod.category || '';
      document.getElementById("description").value = prod.description || '';
      document.getElementById("image").value = prod.image || '';

      editingProductId = id;
      document.getElementById("submitBtn").textContent = "Salvar Alterações";

      window.scrollTo({ top: 0, behavior: 'smooth' });
    })
    .catch(err => console.error('Erro ao carregar produto para edição:', err));
}

// 💾 Adicionar/editar produto
form.addEventListener("submit", e => {
  e.preventDefault();

  const priceInput = document.getElementById("price").value;
  const priceValue = parseFloat(priceInput.replace(",", "."));
  if (isNaN(priceValue)) return alert("Por favor, insira um valor numérico válido.");

  const productData = {
    name: document.getElementById("name").value.trim(),
    brand: document.getElementById("brand").value.trim(),
    price: priceValue.toFixed(2),
    stock: parseInt(document.getElementById("stock").value) || 0,
    volume: document.getElementById("volume").value.trim(),
    category: document.getElementById("category").value,
    description: document.getElementById("description").value.trim(),
    image: document.getElementById("image").value.trim(),
  };

  const url = editingProductId ? `${API_URL}/${editingProductId}` : API_URL;
  const method = editingProductId ? 'PUT' : 'POST';

  fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(productData),
  })
    .then(res => res.json())
    .then(data => {
      alert(data.message || 'Operação concluída com sucesso!');
      form.reset();
      editingProductId = null;
      document.getElementById("submitBtn").textContent = "Adicionar Produto";
      renderProducts();
    })
    .catch(err => {
      console.error('Erro ao salvar produto:', err);
      alert('Erro ao salvar produto.');
    });
});

// 🌟 Publicar/remover produto no site
function togglePublish(id, currentStatus) {
  const newStatus = !currentStatus;

  fetch(`${API_URL}/${id}/publish`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ isPublished: newStatus })
  })
    .then(res => res.json())
    .then(data => {
      alert(data.message || (newStatus ? 'Produto publicado no site!' : 'Produto removido do site.'));
      renderProducts();
    })
    .catch(err => {
      console.error(' Erro ao alterar status de publicação:', err);
      alert('Erro ao publicar/remover produto.');
    });
}

// 🔁 Carregar produtos ao abrir a página
document.addEventListener("DOMContentLoaded", renderProducts);

//botao de voltar
document.getElementById("backBtn").addEventListener("click", () => {
  window.location.href = "../../index.html"; // caminho relativo para o index.html
});
