
document.addEventListener("DOMContentLoaded", function () {

    // CHECKBOX TODOS OS PRODUTOS
    const todosProdutos = document.getElementById("todosProdutos");

    // CHECKBOXES DOS PRODUTOS
    const produtosCheckbox =
        document.querySelectorAll(".produto-checkbox");

    // PRODUTOS
    const produtos =
        document.querySelectorAll(".produto");


    // ==============================
    // SELECIONAR TODOS
    // ==============================

    todosProdutos.addEventListener("change", function () {

        produtosCheckbox.forEach(function (checkbox) {

            checkbox.checked = todosProdutos.checked;

        });

        atualizarResumo();

    });


    // ==============================
    // CHECKBOX INDIVIDUAL
    // ==============================

    produtosCheckbox.forEach(function (checkbox) {

        checkbox.addEventListener("change", function () {

            const todosSelecionados =
                [...produtosCheckbox].every(function (produto) {
                    return produto.checked;
                });

            todosProdutos.checked = todosSelecionados;

            atualizarResumo();

        });

    });


    // ==============================
    // BOTÕES + E -
    // ==============================

    produtos.forEach(function (produto) {

        const botaoMais =
            produto.querySelector(".mais");

        const botaoMenos =
            produto.querySelector(".menos");

        const numeroQuantidade =
            produto.querySelector(".numero-quantidade");


        // BOTÃO +
        botaoMais.addEventListener("click", function () {

            let quantidade =
                Number(numeroQuantidade.textContent);

            quantidade++;

            numeroQuantidade.textContent =
                quantidade;

            atualizarResumo();

        });


        // BOTÃO -
        botaoMenos.addEventListener("click", function () {

            let quantidade =
                Number(numeroQuantidade.textContent);

            if (quantidade > 1) {

                quantidade--;

                numeroQuantidade.textContent =
                    quantidade;

                atualizarResumo();

            }

        });

    });


    // ==============================
    // BOTÃO CONFIRMAR COMPRA
    // ==============================

    const botaoConfirmar =
        document.getElementById("confirmarCompra");

    const mensagemCompra =
        document.getElementById("mensagemCompra");


    botaoConfirmar.addEventListener("click", function () {

        const quantidade =
            Number(
                document.getElementById("quantidade-produtos").textContent
            );


        // Verifica se algum produto foi selecionado
        if (quantidade === 0) {

            alert("Selecione pelo menos um produto.");

            return;

        }


        // Mostra a mensagem
        mensagemCompra.style.display = "block";

    });


    // ==============================
    // ATUALIZAR RESUMO
    // ==============================

    function atualizarResumo() {

        let quantidadeTotal = 0;

        let subtotal = 0;


        produtos.forEach(function (produto) {

            const checkbox =
                produto.querySelector(".produto-checkbox");


            // Só calcula produtos selecionados
            if (checkbox.checked) {

                const preco =
                    Number(produto.dataset.preco);

                const quantidade =
                    Number(
                        produto.querySelector(".numero-quantidade").textContent
                    );


                quantidadeTotal += quantidade;

                subtotal += preco * quantidade;

            }

        });


        // FRETE
        const frete =
            quantidadeTotal > 0 ? 10 : 0;


        // TOTAL
        const total =
            subtotal + frete;


        // QUANTIDADE
        document.getElementById("quantidade-produtos").textContent =
            quantidadeTotal;


        // SUBTOTAL
        document.getElementById("subtotal").textContent =
            formatarDinheiro(subtotal);


        // FRETE
        document.getElementById("frete").textContent =
            formatarDinheiro(frete);


        // TOTAL
        document.getElementById("total").textContent =
            formatarDinheiro(total);

    }


    // ==============================
    // FORMATAÇÃO DO DINHEIRO
    // ==============================

    function formatarDinheiro(valor) {

        return valor.toLocaleString("pt-BR", {

            style: "currency",

            currency: "BRL"

        });

    }


    // ==============================
    // INICIAR
    // ==============================

    atualizarResumo();

});