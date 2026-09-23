document.addEventListener("DOMContentLoaded", function () {

    const todosProdutos = document.getElementById("todosProdutos");

    todosProdutos.addEventListener("change", function () {

        const produtos = document.querySelectorAll(".produto-checkbox");

        for (let produto of produtos) {
            produto.checked = todosProdutos.checked;
        }

    });

});