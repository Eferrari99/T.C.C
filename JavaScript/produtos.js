(function () {
    const CART_KEY = 'taxidog_carrinho';

    function getCart() {
        try {
            const cart = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
            return Array.isArray(cart) ? cart : [];
        } catch {
            return [];
        }
    }

    function saveCart(cart) {
        localStorage.setItem(CART_KEY, JSON.stringify(cart));
        updateCartCounter();
    }

    function money(value) {
        return Number(value || 0).toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        });
    }

    async function getProducts() {
        const response = await fetch('/api/products', { cache: 'no-store' });
        if (!response.ok) throw new Error('Não foi possível carregar os produtos.');
        const data = await response.json();
        return data.products || [];
    }

    function addToCart(productId, quantity = 1) {
        const cart = getCart();
        const existing = cart.find(item => item.id === productId);
        if (existing) existing.quantity += quantity;
        else cart.push({ id: productId, quantity });
        saveCart(cart);
    }

    function updateCartCounter() {
        const counter = document.getElementById('contadorCarrinho');
        if (!counter) return;
        const count = getCart().reduce((sum, item) => sum + Number(item.quantity || 0), 0);
        counter.textContent = count ? `(${count})` : '';
    }

    function productCard(product, compact = false) {
        const card = document.createElement('article');
        card.className = 'produto-card';
        card.tabIndex = 0;
        card.setAttribute('role', 'link');
        card.setAttribute('aria-label', `Ver descrição de ${product.nome}`);
        card.dataset.productId = product.id;

        const imageBox = document.createElement('div');
        imageBox.className = 'produto-imagem';
        const image = document.createElement('img');
        image.src = product.imagem;
        image.alt = product.nome;
        image.loading = 'lazy';
        imageBox.appendChild(image);

        const name = document.createElement('h2');
        name.textContent = product.nome;

        const price = document.createElement('p');
        price.className = 'preco-produto';
        price.textContent = money(product.preco);

        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'produto-botao';
        button.textContent = '🛒 Ver opções';

        const open = () => { window.location.href = `descricao.html?id=${encodeURIComponent(product.id)}`; };
        card.addEventListener('click', open);
        card.addEventListener('keydown', event => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                open();
            }
        });
        button.addEventListener('click', event => {
            event.stopPropagation();
            open();
        });

        card.append(imageBox, name, price, button);
        return card;
    }

    window.TaxiDogProdutos = {
        getProducts,
        getCart,
        saveCart,
        addToCart,
        updateCartCounter,
        money,
        productCard
    };

    document.addEventListener('DOMContentLoaded', updateCartCounter);
})();