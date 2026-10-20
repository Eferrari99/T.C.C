document.addEventListener('DOMContentLoaded', async () => {
    const container = document.getElementById('produtos');
    if (!container || !window.TaxiDogProdutos) return;
    try {
        const products = await TaxiDogProdutos.getProducts();
        container.replaceChildren();
        products.slice(0, 10).forEach(product => container.appendChild(TaxiDogProdutos.productCard(product, true)));
        if (!products.length) container.textContent = 'Nenhum produto cadastrado.';
    } catch (error) {
        container.textContent = error.message;
    }
});