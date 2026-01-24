let produtoSelecionado = "";
let valorSelecionado = 0;

const BACKEND_URL = "https://backend-pix-yn4k.onrender.com";

function comprar(produto, valor) {
  produtoSelecionado = produto;
  valorSelecionado = valor;

  document.getElementById("produtoInfo").innerText =
    `${produto} - R$ ${valor.toFixed(2)}`;

  document.getElementById("pixArea").innerHTML = "";
  document.getElementById("checkout").style.display = "flex";
}

function fechar() {
  document.getElementById("checkout").style.display = "none";
}

async function pagarPix() {
  const nome = document.getElementById("nome").value;
  const whats = document.getElementById("whats").value;
  const ffid = document.getElementById("ffid").value;

  if (!nome || !whats || !ffid) {
    alert("Preencha todos os campos!");
    return;
  }

  const pixArea = document.getElementById("pixArea");
  pixArea.innerHTML = "Gerando Pix...";

  try {
    const response = await fetch(`${BACKEND_URL}/pix`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        valor: valorSelecionado,
        descricao: `${produtoSelecionado} - ${nome}`,
        email: "cliente@email.com"
      })
    });

    const data = await response.json();

    if (!data.point_of_interaction) {
      console.error("Resposta inválida:", data);
      pixArea.innerHTML = "Erro ao gerar Pix. Verifique o backend.";
      return;
    }

    const tx = data.point_of_interaction.transaction_data;
    const paymentId = data.id;

    pixArea.innerHTML = "";

    const img = document.createElement("img");
    img.src = `data:image/png;base64,${tx.qr_code_base64}`;
    pixArea.appendChild(img);

    const small = document.createElement("small");
    small.innerText = tx.qr_code;
    pixArea.appendChild(small);

    const interval = setInterval(async () => {
      const res = await fetch(`${BACKEND_URL}/status/${paymentId}`);
      const statusData = await res.json();

      console.log("Status:", statusData.status);

      if (statusData.status === "approved") {
        clearInterval(interval);

        const msg = encodeURIComponent(
          `Pagamento confirmado!\nProduto: ${produtoSelecionado}\nValor: R$ ${valorSelecionado.toFixed(
            2
          )}\nNome: ${nome}\nWhatsApp: ${whats}\nFFID: ${ffid}`
        );

        window.location.href =
          `https://wa.me/5574999249732?text=${msg}`;
      }
    }, 1500);

  } catch (err) {
    console.error("Erro frontend:", err);
    pixArea.innerHTML = "Erro ao conectar com servidor.";
  }
}
