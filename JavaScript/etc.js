/* =========================
   CARROSSEL DO BANNER
========================= */

let imagemAtual = 0;

function anterior() {

    const imagens =
        document.querySelector(".imagens");

    if (!imagens) {
        return;
    }

    const quantidadeImagens =
        imagens.children.length;

    imagemAtual--;

    if (imagemAtual < 0) {
        imagemAtual = quantidadeImagens - 1;
    }

    imagens.style.transform =
        `translateX(-${imagemAtual * 1200}px)`;
}


function proximo() {

    const imagens =
        document.querySelector(".imagens");

    if (!imagens) {
        return;
    }

    const quantidadeImagens =
        imagens.children.length;

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

    setInterval(function () {
        proximo();
    }, 3000);

});


/* =========================
   CARROSSEL DE PRODUTOS
========================= */

let posicao = 0;
let quantidadeProdutos = 0;
let movimentoProduto = 0;
let animando = false;

const quantidadeCopias = 10;


/* =========================
   INICIALIZAÇÃO
========================= */

document.addEventListener("DOMContentLoaded", function () {

    const produtos =
        document.getElementById("produtos");

    if (!produtos) {
        return;
    }

    const produtosOriginais =
        Array.from(produtos.children);

    quantidadeProdutos =
        produtosOriginais.length;


    const fragmentoAntes =
        document.createDocumentFragment();

    const fragmentoDepois =
        document.createDocumentFragment();


    /* Produtos antes */

    for (let i = 0; i < quantidadeCopias; i++) {

        produtosOriginais.forEach(function (produto) {

            fragmentoAntes.appendChild(
                produto.cloneNode(true)
            );

        });

    }


    /* Produtos depois */

    for (let i = 0; i < quantidadeCopias; i++) {

        produtosOriginais.forEach(function (produto) {

            fragmentoDepois.appendChild(
                produto.cloneNode(true)
            );

        });

    }


    /* Reorganiza os produtos */

    produtos.innerHTML = "";

    produtos.appendChild(fragmentoAntes);

    produtosOriginais.forEach(function (produto) {
        produtos.appendChild(produto);
    });

    produtos.appendChild(fragmentoDepois);


    /* Começa no meio */

    posicao =
        quantidadeProdutos * quantidadeCopias;

    calcularMovimento();


    /* Posiciona sem animação */

    produtos.style.transition = "none";

    atualizarPosicao();


    /* Libera a animação */

    setTimeout(function () {

        produtos.style.transition =
            "transform 0.5s ease";

    }, 50);

});


/* =========================
   CALCULAR MOVIMENTO
========================= */

function calcularMovimento() {

    const produtos =
        document.getElementById("produtos");

    const card =
        produtos.querySelector(".produto-card");

    const estilo =
        window.getComputedStyle(produtos);

    const largura =
        card.getBoundingClientRect().width;

    const gap =
        parseFloat(estilo.gap);

    movimentoProduto =
        largura + gap;
}


/* =========================
   ATUALIZAR POSIÇÃO
========================= */

function atualizarPosicao() {

    const produtos =
        document.getElementById("produtos");

    produtos.style.transform =
        `translateX(-${posicao * movimentoProduto}px)`;
}


/* =========================
   MOVER PRODUTOS
========================= */

function mover(direcao) {

    const produtos =
        document.getElementById("produtos");

    if (!produtos || animando) {
        return;
    }

    calcularMovimento();

    posicao += direcao;

    animando = true;

    produtos.style.transition =
        "transform 0.5s ease";

    atualizarPosicao();
}


/* =========================
   FINAL DA ANIMAÇÃO
========================= */

document.addEventListener("DOMContentLoaded", function () {

    const produtos =
        document.getElementById("produtos");

    if (!produtos) {
        return;
    }


    produtos.addEventListener(
        "transitionend",
        function (evento) {

            if (evento.propertyName !== "transform") {
                return;
            }


            /* Loop para a direita */

            if (
                posicao >=
                quantidadeProdutos *
                (quantidadeCopias + 1)
            ) {

                posicao -= quantidadeProdutos;

                produtos.style.transition =
                    "none";

                atualizarPosicao();

                void produtos.offsetWidth;

                produtos.style.transition =
                    "transform 0.5s ease";
            }


            /* Loop para a esquerda */

            else if (
                posicao <=
                quantidadeProdutos *
                (quantidadeCopias - 1)
            ) {

                posicao += quantidadeProdutos;

                produtos.style.transition =
                    "none";

                atualizarPosicao();

                void produtos.offsetWidth;

                produtos.style.transition =
                    "transform 0.5s ease";
            }


            animando = false;

        }
    );

});