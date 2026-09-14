/* =========================
   CARROSSEL DO BANNER
========================= */

let imagemAtual = 0;


function anterior() {

    if (imagemAtual > 0) {

        imagemAtual--;

    }

    const imagens = document.querySelector(".imagens");

    imagens.style.transform =
        `translateX(-${imagemAtual * 1200}px)`;

}


function proximo() {

    if (imagemAtual < 2) {

        imagemAtual++;

    }

    const imagens = document.querySelector(".imagens");

    imagens.style.transform =
        `translateX(-${imagemAtual * 1200}px)`;

}


/* =========================
   CARROSSEL DE PRODUTOS
========================= */

let posicao = 0;

let quantidadeProdutos = 0;

let movimentoProduto = 0;

let animando = false;


/* Quantidade de cópias */

const quantidadeCopias = 10;


/* =========================
   INICIALIZAÇÃO
========================= */

document.addEventListener("DOMContentLoaded", function () {

    const produtos = document.getElementById("produtos");

    if (!produtos) {

        return;

    }


    /* Guarda os 4 produtos originais */

    const produtosOriginais =
        Array.from(produtos.children);


    quantidadeProdutos =
        produtosOriginais.length;


    /*
        Cria vários produtos antes
        e depois dos originais.
    */

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


    /*
        Limpa a lista
        e coloca tudo novamente.
    */

    produtos.innerHTML = "";


    produtos.appendChild(fragmentoAntes);


    produtosOriginais.forEach(function (produto) {

        produtos.appendChild(produto);

    });


    produtos.appendChild(fragmentoDepois);


    /*
        Começamos no meio dos produtos.
    */

    posicao =
        quantidadeProdutos * quantidadeCopias;


    calcularMovimento();


    /*
        Posiciona os produtos sem animação
        na primeira vez.
    */

    produtos.style.transition = "none";

    atualizarPosicao();


    /*
        Depois libera a animação.
    */

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


    /*
        Move um produto.
    */

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

            /*
                Ignora outras propriedades.
            */

            if (evento.propertyName !== "transform") {

                return;

            }


            /*
                Se chegou muito para a direita,
                volta uma sequência de 4 produtos.
            */

            if (
                posicao >=
                quantidadeProdutos *
                (quantidadeCopias + 1)
            ) {

                posicao -= quantidadeProdutos;


                produtos.style.transition =
                    "none";


                atualizarPosicao();


                /*
                    Força o navegador a aplicar
                    a nova posição antes de
                    liberar a animação novamente.
                */

                void produtos.offsetWidth;


                produtos.style.transition =
                    "transform 0.5s ease";

            }


            /*
                Se chegou muito para a esquerda,
                avança uma sequência de 4 produtos.
            */

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