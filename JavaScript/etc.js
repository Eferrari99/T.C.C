
/* =========================
   CARROSSEL DO BANNER
========================= */

let imagemAtual = 0;

function anterior() {
    const imagens = document.querySelector(".imagens");

    if (!imagens) return;

    const quantidadeImagens = imagens.children.length;
    if (quantidadeImagens === 0) return;

    imagemAtual--;

    if (imagemAtual < 0) {
        imagemAtual = quantidadeImagens - 1;
    }

    imagens.style.transform =
        `translateX(-${imagemAtual * 1200}px)`;
}

function proximo() {
    const imagens = document.querySelector(".imagens");

    if (!imagens) return;

    const quantidadeImagens = imagens.children.length;
    if (quantidadeImagens === 0) return;

    imagemAtual++;

    if (imagemAtual >= quantidadeImagens) {
        imagemAtual = 0;
    }

    imagens.style.transform =
        `translateX(-${imagemAtual * 1200}px)`;
}


/* =========================
   BANNER AUTOMÁTICO
========================= */

document.addEventListener("DOMContentLoaded", function () {
    if (document.querySelector(".imagens")) {
        setInterval(proximo, 3000);
    }
});


/* =========================
   CARROSSEL INFINITO
   DE PRODUTOS
========================= */


/* =========================
   CARROSSEL INFINITO DE PRODUTOS
========================= */

let posicao = 0;
let quantidadeProdutos = 0;
let movimentoProduto = 0;
let animando = false;
let carrosselInicializado = false;

const quantidadeCopias = 10;

window.inicializarCarrossel = function () {
    const produtos = document.getElementById("produtos");

    if (!produtos || carrosselInicializado) return;

    const originais = Array.from(produtos.children).filter(
        item => item.classList.contains("produto-card")
    );

    if (originais.length === 0) return;

    quantidadeProdutos = originais.length;

    const antes = document.createDocumentFragment();
    const depois = document.createDocumentFragment();

    for (let i = 0; i < quantidadeCopias; i++) {
        originais.forEach(produto => {
            antes.appendChild(produto.cloneNode(true));
            depois.appendChild(produto.cloneNode(true));
        });
    }

    produtos.replaceChildren(antes, ...originais, depois);

    carrosselInicializado = true;
    posicao = quantidadeProdutos * quantidadeCopias;

    calcularMovimento();

    produtos.style.transition = "none";
    atualizarPosicao();

    void produtos.offsetWidth;

    produtos.style.transition = "transform 0.5s ease";
};

function calcularMovimento() {
    const produtos = document.getElementById("produtos");
    const card = produtos?.querySelector(".produto-card");

    if (!produtos || !card) return;

    const estilo = getComputedStyle(produtos);
    movimentoProduto =
        card.getBoundingClientRect().width +
        (parseFloat(estilo.columnGap || estilo.gap) || 0);
}

function atualizarPosicao() {
    const produtos = document.getElementById("produtos");

    if (!produtos) return;

    produtos.style.transform =
        `translateX(-${posicao * movimentoProduto}px)`;
}

function mover(direcao) {
    const produtos = document.getElementById("produtos");

    if (!produtos || !carrosselInicializado || animando) return;

    calcularMovimento();

    if (movimentoProduto <= 0) return;

    animando = true;
    posicao += direcao > 0 ? 1 : -1;

    produtos.style.transition = "transform 0.5s ease";
    atualizarPosicao();
}

document.addEventListener("DOMContentLoaded", () => {
    const produtos = document.getElementById("produtos");

    if (!produtos) return;

    const tentarInicializar = () => {
        if (produtos.querySelector(".produto-card")) {
            inicializarCarrossel();
            return true;
        }
        return false;
    };

    if (tentarInicializar()) return;

    const observador = new MutationObserver(() => {
        if (tentarInicializar()) observador.disconnect();
    });

    observador.observe(produtos, { childList: true });
});

document.addEventListener("DOMContentLoaded", () => {
    const produtos = document.getElementById("produtos");

    if (!produtos) return;

    produtos.addEventListener("transitionend", evento => {
        if (evento.propertyName !== "transform") return;

        const limite = quantidadeProdutos * (quantidadeCopias + 1);

        if (posicao >= limite) {
            posicao -= quantidadeProdutos;
        } else if (posicao < quantidadeProdutos * quantidadeCopias) {
            posicao += quantidadeProdutos;
        }

        produtos.style.transition = "none";
        atualizarPosicao();

        void produtos.offsetWidth;

        produtos.style.transition = "transform 0.5s ease";
        animando = false;
    });
});
