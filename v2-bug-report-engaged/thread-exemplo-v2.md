[Título]
| Movimentações não exibem vendas aprovadas
|
[Contexto]
| OrgID: 69f1f470b408f9001cd9ef66
| Cliente: Empresa XPTO
| Link de reprodução do erro: htts:\\admin.online.engaged.com.br\org\69f1f470b408f9001cd9ef66

[Impacto]
ex: Financeiro não consegue validar fechamento diário.

[Comportamento esperado]
ex: Vendas aprovadas devem aparecer na tela de movimentações.

[Comportamento atual]
Tela retorna vazia.

[Variables]
{
 "orgId":"69f1f470b408f9001cd9ef66"
}

[Observações]
Na tela /pagamentos os dados existem normalmente.

[Hipótese]
Possível problema de filtro de data/timezone ou indexação no banco.