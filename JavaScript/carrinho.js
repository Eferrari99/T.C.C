
document.addEventListener('DOMContentLoaded', async () => {
    const list = document.getElementById('itensCarrinho');
    const empty = document.getElementById('carrinhoVazio');
    const selectAll = document.getElementById('todosProdutos');
    const confirmButton = document.getElementById('confirmarCompra');
    const message = document.getElementById('mensagemCompra');
    const paymentSelect = document.getElementById('metodoPagamento');

    if (!list || !window.TaxiDogProdutos) return;

    let products = [];
    let cart = TaxiDogProdutos.getCart();

    const money = TaxiDogProdutos.money;

    function save() {
        TaxiDogProdutos.saveCart(cart);
        render();
    }

    // Calcula o frete com base no subtotal selecionado.
    function calcularFrete(subtotal) {
        if (subtotal <= 0) return 0;
        if (subtotal <= 50) return 10;
        if (subtotal < 150) return 25;
        return 40;
    }

    function render() {
        list.replaceChildren();

        cart = cart.filter(item =>
            products.some(product => product.id === item.id) &&
            Number(item.quantity) > 0
        );

        TaxiDogProdutos.saveCart(cart);

        empty.hidden = cart.length > 0;
        selectAll.disabled = cart.length === 0;

        cart.forEach(item => {
            const product = products.find(
                product => product.id === item.id
            );

            if (!product) return;

            const row = document.createElement('article');
            row.className = 'item-carrinho';

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.className = 'produto-checkbox';
            checkbox.checked = item.selected !== false;
            checkbox.setAttribute(
                'aria-label',
                `Selecionar ${product.nome}`
            );

            checkbox.addEventListener('change', () => {
                item.selected = checkbox.checked;
                TaxiDogProdutos.saveCart(cart);
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
            price.textContent = money(Number(product.preco) || 0);

            title.append(name, price);

            const store = document.createElement('p');
            store.className = 'local';
            store.textContent = `Loja: ${product.loja || 'Não informada'}`;

            const quantity = document.createElement('div');
            quantity.className = 'quantidade';

            const less = document.createElement('button');
            less.type = 'button';
            less.textContent = '−';
            less.setAttribute('aria-label', 'Diminuir quantidade');

            const count = document.createElement('span');
            count.className = 'numero-quantidade';
            count.textContent = item.quantity;

            const more = document.createElement('button');
            more.type = 'button';
            more.textContent = '+';
            more.setAttribute('aria-label', 'Aumentar quantidade');

            less.addEventListener('click', () => {
                item.quantity = Math.max(
                    1,
                    Number(item.quantity) - 1
                );
                save();
            });

            more.addEventListener('click', () => {
                const estoque = Number(product.estoque) || 99;
                item.quantity = Math.min(
                    estoque,
                    Number(item.quantity) + 1
                );
                save();
            });

            quantity.append(less, count, more);

            const remove = document.createElement('button');
            remove.type = 'button';
            remove.className = 'remover-item';
            remove.textContent = 'Remover';

            remove.addEventListener('click', () => {
                cart = cart.filter(
                    cartItem => cartItem.id !== item.id
                );
                save();
            });

            info.append(title, store, quantity, remove);
            row.append(checkbox, img, info);
            list.appendChild(row);
        });

        updateSummary();
    }

    function updateSummary() {
        const selected = cart.filter(
            item => item.selected !== false
        );

        const quantity = selected.reduce(
            (sum, item) => sum + Number(item.quantity), 0
        );

        const subtotal = selected.reduce((sum, item) => {
            const product = products.find(
                product => product.id === item.id
            );

            return sum + (
                product
                    ? (Number(product.preco) || 0) *
                      Number(item.quantity)
                    : 0
            );
        }, 0);

        const shipping = calcularFrete(subtotal);
        const total = subtotal + shipping;

        document.getElementById('quantidade-produtos')
            .textContent = quantity;

        document.getElementById('totalItensCabecalho')
            .textContent = `${cart.length} produto(s)`;

        document.getElementById('subtotal')
            .textContent = money(subtotal);

        document.getElementById('frete')
            .textContent = money(shipping);

        document.getElementById('total')
            .textContent = money(total);

        selectAll.checked =
            cart.length > 0 &&
            cart.every(item => item.selected !== false);

        confirmButton.disabled = quantity === 0;
    }

    selectAll.addEventListener('change', () => {
        cart.forEach(item => {
            item.selected = selectAll.checked;
        });

        TaxiDogProdutos.saveCart(cart);
        render();
    });

    // Confirmação da compra.
    confirmButton.addEventListener('click', () => {
        const selected = cart.filter(
            item => item.selected !== false
        );

        message.hidden = false;
        message.style.background = '#fbe8d0';
        message.style.color = '#6b3b00';

        if (!selected.length) {
            message.textContent =
                'Selecione pelo menos um produto para continuar.';
            return;
        }

        const paymentMethod = paymentSelect.value;

        if (!paymentMethod) {
            message.textContent =
                'Selecione um método de pagamento antes de confirmar.';
            paymentSelect.focus();
            return;
        }

        const count = selected.reduce(
            (sum, item) => sum + Number(item.quantity), 0
        );

        const subtotal = selected.reduce((sum, item) => {
            const product = products.find(
                product => product.id === item.id
            );

            return sum + (
                product
                    ? (Number(product.preco) || 0) *
                      Number(item.quantity)
                    : 0
            );
        }, 0);

        const shipping = calcularFrete(subtotal);
        const total = subtotal + shipping;

        const nomesPagamento = {
            pix: 'Pix',
            credito: 'Cartão de crédito',
            debito: 'Cartão de débito',
            boleto: 'Boleto bancário'
        };

        // Remove somente os produtos comprados.
        cart = cart.filter(item => item.selected === false);

        TaxiDogProdutos.saveCart(cart);
        render();

        message.hidden = false;
        message.style.background = '#e7f7e2';
        message.style.color = '#176b2c';
        message.textContent =
            `Compra confirmada! ${count} unidade(s). ` +
            `Total: ${money(total)}. ` +
            `Pagamento escolhido: ${nomesPagamento[paymentMethod]}.`;

        // Limpa a seleção de pagamento para a próxima compra.
        paymentSelect.value = '';
    });

    try {
        products = await TaxiDogProdutos.getProducts();
        render();
    } catch (error) {
        console.error('Erro ao carregar o carrinho:', error);
        list.textContent = 'Não foi possível carregar os produtos.';
    }
});
