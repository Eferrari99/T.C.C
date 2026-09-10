const input = document.getElementById("inputAjuda");
const sugestoes = document.getElementById("sugestoes");
const resposta = document.getElementById("resposta");

const perguntas = [
    {
        pergunta: "Como faço um pedido?",
        resposta: "Para fazer um pedido, primeiro escolha o produto ou serviço que deseja. Depois, adicione o item ao carrinho, confira as informações do pedido, escolha a forma de pagamento e confirme a compra. Após a confirmação, você poderá acompanhar o status do pedido pelo seu perfil."
    },

    {
        pergunta: "Como acompanhar meu pedido?",
        resposta: "Para acompanhar seu pedido, acesse a aba 'Perfil' e procure pela área de pedidos. Lá você poderá verificar o status atual da compra, desde a confirmação do pedido até a preparação e a entrega. Caso o pedido já tenha sido enviado, também será possível consultar as informações disponíveis sobre a entrega."
    },

    {
        pergunta: "Como cancelar um pedido?",
        resposta: "Caso queira cancelar um pedido, entre em contato com o suporte o quanto antes pelo telefone (11) 9999-9999. A possibilidade de cancelamento pode depender do estágio em que o pedido se encontra. Se ele ainda não tiver sido preparado ou enviado, será mais fácil verificar a possibilidade de cancelamento."
    },

    {
        pergunta: "Quais são as formas de pagamento?",
        resposta: "O Taxi-Dog disponibiliza diferentes formas de pagamento para facilitar sua compra. Atualmente, você pode utilizar Pix, cartão de crédito ou cartão de débito. Antes de finalizar o pedido, confira a opção escolhida e verifique se os dados estão corretos."
    },

    {
        pergunta: "Meu pagamento foi aprovado?",
        resposta: "Depois que o pagamento for realizado, o sistema irá processar a transação e atualizar o status do pedido. Quando o pagamento for aprovado, o pedido poderá continuar para as próximas etapas, como a reserva dos produtos e a preparação para entrega. Caso o status não seja atualizado, entre em contato com o suporte."
    },

    {
        pergunta: "Onde está meu pedido?",
        resposta: "Você pode verificar onde seu pedido está acessando a aba 'Perfil' e consultando seus pedidos. O sistema mostrará o status atual da compra, como pedido criado, pagamento aprovado, estoque reservado, pedido preparado ou pedido enviado. Se houver algum problema ou atraso, entre em contato com o suporte."
    },

    {
        pergunta: "Como alterar o endereço de entrega?",
        resposta: "Antes de finalizar o pedido, confira cuidadosamente o endereço informado para garantir que a entrega seja realizada no local correto. Caso precise alterar o endereço depois que o pedido já foi confirmado, entre em contato com o suporte pelo telefone (11) 9999-9999. A alteração poderá depender do estágio atual do pedido."
    },

    {
        pergunta: "Como entrar em contato com o suporte?",
        resposta: "Se você tiver alguma dúvida ou encontrar algum problema durante o uso do Taxi-Dog, poderá entrar em contato com nossa equipe de suporte pelo telefone (11) 9999-9999. Explique o problema com o máximo de detalhes possível para que nossa equipe consiga ajudar de forma mais rápida."
    },

    {
        pergunta: "Quanto tempo demora para chegar?",
        resposta: "O tempo de entrega pode variar de acordo com a distância, o tipo de serviço escolhido, a disponibilidade dos entregadores e a situação do pedido. Durante o processo de compra, verifique as informações de prazo apresentadas pelo sistema. Em caso de atraso, consulte o status do pedido ou entre em contato com o suporte."
    },

    {
        pergunta: "Posso alterar meu pedido?",
        resposta: "Se você precisar alterar algum item do pedido, entre em contato com o suporte o mais rápido possível. Caso o pedido ainda não tenha sido preparado, pode ser possível realizar algumas alterações. Depois que o pedido estiver preparado ou enviado, as possibilidades de alteração podem ser limitadas."
    },

    {
        pergunta: "O que faço se meu pedido estiver atrasado?",
        resposta: "Primeiro, acesse seu perfil e verifique o status atual do pedido. Se o prazo previsto já tiver passado e não houver novas atualizações, entre em contato com o suporte pelo telefone (11) 9999-9999. Nossa equipe poderá verificar a situação do pedido e orientar sobre os próximos passos."
    },

    {
        pergunta: "Como adicionar um produto ao carrinho?",
        resposta: "Acesse a aba 'Produtos' e procure pelo item que deseja comprar. Depois de encontrar o produto, confira suas informações e clique no botão 'Adicionar ao carrinho'. Você poderá continuar escolhendo outros produtos ou acessar o carrinho para revisar e finalizar seu pedido."
    },

    {
        pergunta: "Como remover um produto do carrinho?",
        resposta: "Para remover um produto, acesse a aba 'Carrinho' e localize o item que deseja retirar. Depois, clique na opção de remover o produto. Antes de finalizar a compra, confira novamente os itens e as quantidades para garantir que o pedido esteja correto."
    },

    {
        pergunta: "Posso pedir transporte para meu cachorro?",
        resposta: "Sim. O Taxi-Dog oferece um serviço de transporte para animais. Para solicitar uma corrida, acesse a aba 'Corrida' e informe os dados necessários sobre o transporte. Depois, escolha uma data e um horário disponíveis e confirme a solicitação."
    },

    {
        pergunta: "Como agendar uma corrida?",
        resposta: "Para agendar uma corrida, acesse a aba 'Corrida'. Informe os dados solicitados, como o local de origem, o destino e as informações do animal. Depois, escolha uma data e um horário disponíveis e confirme o agendamento. Verifique todas as informações antes de finalizar."
    },

    {
        pergunta: "Posso agendar banho para meu cachorro?",
        resposta: "Sim. Você pode utilizar o Taxi-Dog para encontrar e agendar serviços de banho e cuidados para seu cachorro. Escolha o serviço disponível, confira as informações do estabelecimento e selecione uma data e horário. Depois, confirme o agendamento."
    },

    {
        pergunta: "Posso agendar uma consulta veterinária?",
        resposta: "Sim. O Taxi-Dog disponibiliza serviços relacionados a atendimento veterinário. Para agendar uma consulta, procure pelo serviço desejado, escolha um estabelecimento disponível e selecione uma data e horário. Confira as informações antes de confirmar o agendamento."
    },

    {
        pergunta: "Como cadastrar meu cachorro?",
        resposta: "Para cadastrar seu cachorro, acesse a área de 'Perfil' e procure pela opção de cadastro de animal. Informe os dados solicitados, como nome, raça, idade, peso e outras informações importantes. Mantenha os dados atualizados para facilitar o atendimento e a utilização dos serviços."
    },

    {
        pergunta: "Como alterar meus dados do perfil?",
        resposta: "Para alterar seus dados, acesse a aba 'Perfil' e procure pela opção de edição das informações pessoais. Atualize os dados necessários e salve as alterações. É importante manter informações como telefone e endereço atualizadas para facilitar o contato e a realização dos serviços."
    },

    {
        pergunta: "O que faço se tiver um problema com o serviço?",
        resposta: "Se ocorrer algum problema durante a utilização de um produto ou serviço, primeiro verifique o status do pedido ou agendamento. Caso o problema continue, entre em contato com o suporte pelo telefone (11) 9999-9999. Informe o que aconteceu e, se possível, forneça os dados do pedido para facilitar a identificação."
    }
];

input.addEventListener("input", function () {

    const texto = input.value.toLowerCase();

    sugestoes.innerHTML = "";

    if (texto === "") {
        return;
    }

    const resultados = perguntas.filter(function(item) {
        return item.pergunta.toLowerCase().includes(texto);
    });

    resultados.forEach(function(item) {

        const div = document.createElement("div");

        div.textContent = item.pergunta;
        div.classList.add("sugestao");

        div.addEventListener("click", function() {

            // Coloca a pergunta selecionada no input
            input.value = item.pergunta;

            // Esconde as sugestões
            sugestoes.innerHTML = "";

            // Mostra a resposta
            resposta.textContent = item.resposta;
        });

        sugestoes.appendChild(div);
    });
});