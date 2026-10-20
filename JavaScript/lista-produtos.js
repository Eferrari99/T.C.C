document.addEventListener('DOMContentLoaded', async () => {
    const list = document.getElementById('listaProdutos');
    const search = document.getElementById('buscaProdutos');
    const message = document.getElementById('mensagemProdutos');
    if (!list || !window.TaxiDogProdutos) return;

    let products = [];
    function render() {
        const term = (search?.value || '').trim().toLocaleLowerCase('pt-BR');
        const filtered = products.filter(product =>
            `${product.nome} ${product.categoria} ${product.loja}`.toLocaleLowerCase('pt-BR').includes(term)
        );
        list.replaceChildren();
        filtered.forEach(product => list.appendChild(TaxiDogProdutos.productCard(product)));
        message.textContent = filtered.length ? `${filtered.length} produto(s) encontrado(s).` : 'Nenhum produto encontrado.';
    }

    try {
        products = await TaxiDogProdutos.getProducts();
        render();
        search?.addEventListener('input', render);
    } catch (error) {
        message.textContent = error.message;
    }
});