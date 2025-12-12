document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("quizForm");
  const resultado = document.getElementById("resultado");
  const cronogramaDiv = document.getElementById("cronograma");

  function getRadioValue(name) {
    const el = document.querySelector(`input[name="${name}"]:checked`);
    return el ? el.value : null;
  }

  async function gerarCronograma() {
    const respostas = {
      tipo: getRadioValue("tipo"),
      necessidade: getRadioValue("necessidade"),
      quimica: getRadioValue("quimica"),
      lavagem: getRadioValue("lavagem"),
      objetivo: getRadioValue("objetivo"),
    };

    // valida se todas foram respondidas
    for (let key in respostas) {
      if (!respostas[key]) {
        alert("Por favor, responda todas as perguntas.");
        return;
      }
    }

    form.classList.add("hidden");
    resultado.classList.remove("hidden");
    cronogramaDiv.innerHTML = "<p class='loading'>✨ Gerando seu cronograma...</p>";

    try {
      const res = await fetch("http://localhost:3000/api/cronograma", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ respostas }),
      });

      if (!res.ok) throw new Error("Erro no servidor");

      const data = await res.json();
      let cronograma = data.cronograma || "Erro ao gerar cronograma.";

      cronograma = cronograma.replace(/\*/g, "").trim();
      cronogramaDiv.innerHTML = cronograma;

    } catch (error) {
      console.error(error);
      cronogramaDiv.innerHTML =
        "<p class='error'>❌ Erro ao gerar o cronograma. Tente novamente.</p>";
    }
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    gerarCronograma();
  });
});
