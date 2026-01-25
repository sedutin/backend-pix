let produtoSelecionado = "";
let valorSelecionado = 0;

function comprar(produto, valor) {
  produtoSelecionado = produto;
  valorSelecionado = valor;
  document.getElementById("produtoInfo").innerText = `${produto} - R$ ${valor.toFixed(2)}`;
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
  pixArea.innerHTML = "⏳ Gerando Pix...";

  try {
    const response = await fetch("https://backend-pix-yn4k.onrender.com/pix", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        valor: valorSelecionado,
        descricao: `${produtoSelecionado} - ${nome}`,
        email: "cliente@pix.com"
      })
    });

    const data = await response.json();
    const tx = data.point_of_interaction.transaction_data;
    const paymentId = data.id;

    pixArea.innerHTML = `
      <p>⏳ Aguardando confirmação do pagamento...</p>
      <img src="data:image/png;base64,${tx.qr_code_base64}">
      <small>${tx.qr_code}</small>
    `;

    const interval = setInterval(async () => {
      const check = await fetch(`https://backend-pix-yn4k.onrender.com/status/${paymentId}`);
      const statusData = await check.json();

      if (statusData.status === "approved") {
        clearInterval(interval);
        pixArea.innerHTML = "✅ Pagamento confirmado! Redirecionando...";

        const msg = encodeURIComponent(
          `📦 NOVO PEDIDO PAGO\nProduto: ${produtoSelecionado}\nValor: R$ ${valorSelecionado.toFixed(2)}\nNome: ${nome}\nWhats: ${whats}\nFFID: ${ffid}`
        );

        setTimeout(() => {
          window.location.href = `https://wa.me/5574999249732?text=${msg}`;
        }, 1500);
      }
    }, 3000);

  } catch (err) {
    pixArea.innerHTML = "❌ Erro ao gerar Pix. Tente novamente.";
    console.error(err);
  }
}
