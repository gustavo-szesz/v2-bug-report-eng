[Título]
| Movimentações não exibem vendas aprovadas
|
[Contexto]
| BugID: {ID DE ERRO QUE FAÇA SENTIDO}
| OrgID: {69f1f470b408f9001cd9ef66}
| Cliente: {Empresa XPTO}
| Link de reprodução do erro: htts:\\admin.online.engaged.com.br\org\69f1f470b408f9001cd9ef66

[Impacto]
ex: Financeiro não consegue validar fechamento diário.

[Passo - Passo]
{EXEMPLO} = 
Open https://www.creoven.eu/

Add any product to the cart and proceed to the cart page

Click the "Checkout" button

Scroll down the page to the "Ordering without an account" section

Enter an invalid email, e.g. de456@@qa.team in the "Email" box


[Comportamento esperado]
ex: Vendas aprovadas devem aparecer na tela de movimentações.

[Comportamento atual]
ex: Tela retorna vazia com erro 500 no console


[Variables]
{
 "orgId":"69f1f470b408f9001cd9ef66"
}

[Observações]
Na tela /pagamentos os dados existem normalmente.

[Hipótese]
Possível problema de filtro de data/timezone ou indexação no banco.