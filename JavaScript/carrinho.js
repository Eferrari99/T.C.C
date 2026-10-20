document.addEventListener('DOMContentLoaded', async () => {
    const list = document.getElementById('itensCarrinho');
    const empty = document.getElementById('carrinhoVazio');
    const selectAll = document.getElementById('todosProdutos');
    const confirmButton = document.getElementById('confirmarCompra');
    const message = document.getElementById('mensagemCompra');
    if (!list || !window.TaxiDogProdutos) return;

    let products = [];
    let cart = TaxiDogProdutos.getCart();
    const money = TaxiDogProdutos.money;

    function save() {
        TaxiDogProdutos.saveCart(cart);
        render();
    }

    function render() {
        list.replaceChildren();
        cart = cart.filter(item => products.some(product => product.id === item.id) && Number(item.quantity) > 0);
        TaxiDogProdutos.saveCart(cart);
        empty.hidden = cart.length > 0;
        selectAll.checked = cart.length > 0;
        selectAll.disabled = cart.length === 0;

        cart.forEach(item => {
            const product = products.find(product => product.id === item.id);
            if (!product) return;

            const row = document.createElement('article');
            row.className = 'item-carrinho';

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.className = 'produto-checkbox';
            checkbox.checked = item.selected !== false;
            checkbox.setAttribute('aria-label', `Selecionar ${product.nome}`);
            checkbox.addEventListener('change', () => {
                item.selected = checkbox.checked;
                updateSummary();
            });

            const img = document.createElement('img');
            img.src = product.imagem;
            img.alt = product.nome;

            const info = document.createElement('div');
            info.className = 'info-produto';

            const title = document.createElement('div');
            title.className = 'nome-preco';
            const name = document.createElement('strong');
            name.textContent = product.nome;
            const price = document.createElement('span');
            price.textContent = money(product.preco);
            title.append(name, price);

            const store = document.createElement('p');
            store.className = 'local';
            store.textContent = `Loja: ${product.loja}`;

            const quantity = document.createElement('div');
            quantity.className = 'quantidade';
            const less = document.createElement('button');
            less.type = 'button'; less.textContent = '−'; less.setAttribute('aria-label', 'Diminuir quantidade');
            const count = document.createElement('span');
            count.className = 'numero-quantidade'; count.textContent = item.quantity;
            const more = document.createElement('button');
            more.type = 'button'; more.textContent = '+'; more.setAttribute('aria-label', 'Aumentar quantidade');
            less.addEventListener('click', () => { item.quantity = Math.max(1, item.quantity - 1); save(); });
            more.addEventListener('click', () => { item.quantity = Math.min(Number(product.estoque) || 99, item.quantity + 1); save(); });
            quantity.append(less, count, more);

            const remove = document.createElement('button');
            remove.type = 'button';
            remove.className = 'remover-item';
            remove.textContent = 'Remover';
            remove.addEventListener('click', () => {
                cart = cart.filter(cartItem => cartItem.id !== item.id);
                save();
            });

            info.append(title, store, quantity, remove);
            row.append(checkbox, img, info);
            list.appendChild(row);
        });

        updateSummary();
    }

    function updateSummary() {
        const selected = cart.filter(item => item.selected !== false);
        const quantity = selected.reduce((sum, item) => sum + item.quantity, 0);
        const subtotal = selected.reduce((sum, item) => {
            const product = products.find(product => product.id === item.id);
            return sum + (product ? product.preco * item.quantity : 0);
        }, 0);
        const shipping = quantity > 0 ? 10 : 0;

        document.getElementById('quantidade-produtos').textContent = quantity;
        document.getElementById('totalItensCabecalho').textContent = `${cart.length} produto(s)`;
        document.getElementById('subtotal').textContent = money(subtotal);
        document.getElementById('frete').textContent = money(shipping);
        document.getElementById('total').textContent = money(subtotal + shipping);
        confirmButton.disabled = quantity === 0;
        if (selectAll) selectAll.checked = cart.length > 0 && cart.every(item => item.selected !== false);
    }

    selectAll.addEventListener('change', () => {
        cart.forEach(item => { item.selected = selectAll.checked; });
        TaxiDogProdutos.saveCart(cart);
        render();
    });

    confirmButton.addEventListener('click', () => {
        const selected = cart.filter(item => item.selected !== false);
        if (!selected.length) {
            message.hidden = false;
            message.textContent = 'Selecione pelo menos um produto para confirmar a compra.';
            return;
        }
        const count = selected.reduce((sum, item) => sum + item.quantity, 0);
        // Remove do carrinho os itens comprados; itens desmarcados permanecem.
        cart = cart.filter(item => item.selected === false);
        TaxiDogProdutos.saveCart(cart);
        message.hidden = false;
        message.textContent = `Compra confirmada! ${count} unidade(s) comprada(s).`;
        render();
        message.hidden = false;
    });

    try {
        products = await TaxiDogProdutos.getProducts();
        render();
    } catch (error) {
        list.textContent = error.message;
    }
});