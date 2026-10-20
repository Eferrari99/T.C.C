document.addEventListener('DOMContentLoaded', async () => {
    const root = document.getElementById('paginaDescricao');
    if (!root || !window.TaxiDogProdutos) return;

    const id = new URLSearchParams(window.location.search).get('id');
    if (!id) {
        root.innerHTML = '<p class="erro-produto">Produto não especificado. <a href="produtos.html">Voltar aos produtos</a></p>';
        return;
    }

    try {
        const products = await TaxiDogProdutos.getProducts();
        const product = products.find(item => item.id === id);
        if (!product) {
            root.innerHTML = '<p class="erro-produto">Produto não encontrado. <a href="produtos.html">Ver produtos</a></p>';
            return;
        }

        const money = TaxiDogProdutos.money;
        root.innerHTML = `
            <div class="titulo-descricao">Descrição</div>
            <section class="descricao-principal">
                <div class="imagem-destaque"><img id="imagemProduto" alt=""></div>
                <div class="dados-principais">
                    <h1 id="nomeProduto"></h1>
                    <strong class="preco-destaque" id="precoProduto"></strong>
                    <p class="linha-pequena">Ver opções de pagamento</p>
                    <p><span class="bolinha-cor"></span> Cor: <span id="corProduto"></span></p>
                    <p>Loja: <strong id="lojaProduto"></strong></p>
                    <p>Estoque: <span id="estoqueProduto"></span> unidades</p>
                    <p id="textoDescricao"></p>
                </div>
            </section>
            <div class="descricao-inferior">
                <section class="caracteristicas">
                    <h2>Características do produto</h2>
                    <p>Características principais</p>
                    <dl>
                        <div><dt>Marca:</dt><dd id="marcaProduto"></dd></div>
                        <div><dt>Modelo:</dt><dd id="modeloProduto"></dd></div>
                        <div><dt>Cor:</dt><dd id="corProduto2"></dd></div>
                        <div><dt>Capacidade:</dt><dd id="capacidadeProduto"></dd></div>
                        <div><dt>Tamanho:</dt><dd id="tamanhoProduto"></dd></div>
                        <div><dt>Material:</dt><dd id="materialProduto"></dd></div>
                        <div><dt>Dimensões:</dt><dd id="dimensoesProduto"></dd></div>
                    </dl>
                </section>
                <section class="compra-produto">
                    <p><span class="bolinha-cor"></span> Cor: <span id="corProduto3"></span></p>
                    <div class="controle-quantidade">
                        <button id="diminuirQuantidade" type="button" aria-label="Diminuir quantidade">−</button>
                        <span id="quantidadeProduto">1</span>
                        <button id="aumentarQuantidade" type="button" aria-label="Aumentar quantidade">+</button>
                    </div>
                    <button id="adicionarCarrinho" class="adicionar-carrinho" type="button">Adicionar ao carrinho</button>
                    <p id="mensagemAdicionar" role="status" aria-live="polite"></p>
                </section>
            </div>
            <section class="avaliacoes">
                <h2>Opiniões do produto</h2>
                <strong>${Number(product.avaliacao || 0).toFixed(1)} ★★★★★</strong>
                <p>(${Number(product.comentarios || 0)} comentários)</p>
            </section>
            <section class="relacionados">
                <h2>Produtos relacionados</h2>
                <div id="listaRelacionados" class="grade-relacionados"></div>
            </section>
        `;

        const setText = (elementId, value) => {
            const el = document.getElementById(elementId);
            if (el) el.textContent = value ?? '';
        };
        const image = document.getElementById('imagemProduto');
        image.src = product.imagem;
        image.alt = product.nome;
        setText('nomeProduto', product.nome);
        setText('precoProduto', money(product.preco));
        setText('corProduto', product.cor);
        setText('corProduto2', product.cor);
        setText('corProduto3', product.cor);
        setText('lojaProduto', product.loja);
        setText('estoqueProduto', product.estoque);
        setText('textoDescricao', product.descricao);
        setText('marcaProduto', product.marca);
        setText('modeloProduto', product.modelo);
        setText('capacidadeProduto', product.capacidade);
        setText('tamanhoProduto', product.tamanho);
        setText('materialProduto', product.material);
        setText('dimensoesProduto', product.dimensoes);

        let quantity = 1;
        const quantityText = document.getElementById('quantidadeProduto');
        document.getElementById('diminuirQuantidade').addEventListener('click', () => {
            quantity = Math.max(1, quantity - 1);
            quantityText.textContent = quantity;
        });
        document.getElementById('aumentarQuantidade').addEventListener('click', () => {
            quantity = Math.min(Number(product.estoque) || 99, quantity + 1);
            quantityText.textContent = quantity;
        });
        document.getElementById('adicionarCarrinho').addEventListener('click', () => {
            TaxiDogProdutos.addToCart(product.id, quantity);
            document.getElementById('mensagemAdicionar').textContent = 'Produto adicionado ao carrinho!';
        });

        const related = document.getElementById('listaRelacionados');
        products.filter(item => item.id !== product.id).slice(0, 4).forEach(item => {
            const card = TaxiDogProdutos.productCard(item, true);
            related.appendChild(card);
        });
    } catch (error) {
        root.textContent = error.message;
    }
});