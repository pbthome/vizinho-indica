# Vizinho Indica

MVP mobile em React Native com Expo e TypeScript para moradores encontrarem recomendações confiáveis do próprio condomínio.

## Como rodar

```bash
npm install
npx expo start
```

Depois, abra no iPhone pelo Expo Go, no Android pelo Expo Go, ou use os atalhos do Expo para simuladores.

Para testar no navegador local, use:

```bash
npm run web:local
```

Esse comando evita a abertura automática do navegador e serve a prévia web em `http://localhost:8081`.

## Fluxos de teste

Na tela de login, use qualquer senha e um destes emails:

- Morador aprovado: `pedro@vizinho.com`
- Morador pendente: `pendente@vizinho.com`
- Morador rejeitado: `rejeitado@vizinho.com`
- Administrador: `admin@vizinho.com`

Se o campo não corresponder a nenhum email mockado, o app entra como o morador aprovado padrão.

## O que está implementado

- Cadastro com solicitação manual de acesso, sem código de convite ou indicação.
- Bloqueio de usuários pendentes, rejeitados e bloqueados antes das recomendações.
- Experiência aprovada com abas fixas: Início, Buscar, Indicar e Perfil.
- Busca por nome do fornecedor, categoria e comentários.
- Filtros simples por categoria, nota mínima e mais recomendados.
- Detalhe da recomendação com contato por WhatsApp, comentários, confiança e reporte.
- Cadastro de recomendação com validação e confirmação de uso real.
- Painel administrativo para aprovar/rejeitar moradores e moderar denúncias.
- Dados locais isolados em `src/services/mockApi.ts` para troca futura por Supabase, Firebase ou API.

## Estrutura

```text
src/
  components/   componentes reutilizáveis
  constants/    cores, espaçamentos, tipografia e categorias
  data/         dados mockados iniciais
  navigation/   stacks, tabs e guards
  screens/      telas do MVP
  services/     camada de dados mockada e utilitários
  types/        modelos TypeScript
```

## Próximos passos naturais

- Persistir sessão e dados em backend.
- Substituir `mockApi.ts` por adapters de Supabase/Firebase/API.
- Adicionar testes de navegação e validação de formulários.
- Criar configuração visual de ícone/splash final para publicação.
