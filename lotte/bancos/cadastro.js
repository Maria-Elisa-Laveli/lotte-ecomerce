const form = document.getElementById("cadastroForm");
const mensagem = document.getElementById("mensagem");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const data = {
    nome: document.getElementById("nome").value,
    username: document.getElementById("username").value,
    email: document.getElementById("email").value,
    telefone: document.getElementById("telefone").value,
    senha: document.getElementById("senha").value
  };

  try {
        const res = await fetch("https://lotte-ecomerce.onrender.com/cadastro", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    const result = await res.json();

    if (res.ok) {
      mensagem.textContent = result.message;
      mensagem.style.color = "green";
      form.reset();
    } else {
      mensagem.textContent = result.error;
      mensagem.style.color = "red";
    }
  } catch (err) {
    mensagem.textContent = "Erro ao cadastrar usuário.";
    mensagem.style.color = "red";
    console.error(err);
  }
});
