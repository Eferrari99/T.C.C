let imagemAtual = 0;

function proximo() {
    imagemAtual++;

    if (imagemAtual > 2) {
        imagemAtual = 0;
    }

    document.querySelector(".imagens").style.transform =
        "translateX(-" + (imagemAtual * 1200) + "px)";
}

function anterior() {
    imagemAtual--;

    if (imagemAtual < 0) {
        imagemAtual = 2;
    }

    document.querySelector(".imagens").style.transform =
        "translateX(-" + (imagemAtual * 1200) + "px)";
}