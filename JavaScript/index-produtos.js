
document.addEventListener('DOMContentLoaded', async () => {
    const container = document.getElementById('produtos');

    if (!container || !window.TaxiDogProdutos) return;

    try {
        const products = await window.TaxiDogProdutos.getProducts();

        container.replaceChildren();

        products.slice(0, 10).forEach(product => {
            container.appendChild(
                window.TaxiDogProdutos.productCard(product, true)
            );
        });

        if (!products.length) {
            container.textContent = 'Nenhum produto cadastrado.';
            return;
        }

        // Inicializa o carrossel depois de carregar os produtos.
        if (typeof window.inicializarCarrossel === 'function') {
            window.inicializarCarrossel();
        }

    } catch (error) {
        console.error('Erro ao carregar produtos:', error);
        container.textContent = 'Não foi possível carregar os produtos.';
    }
});
