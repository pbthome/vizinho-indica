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

## Teste no iPhone com development build

Use esse modo quando precisar validar login por link, recuperaÃ§Ã£o de senha, links externos e outros fluxos nativos que nÃ£o sÃ£o confiÃ¡veis no Expo Go.

### O que muda

- `Expo Go` = app genÃ©rico de teste do Expo. Bom para telas simples.
- `development build` = app prÃ³prio do projeto instalado no iPhone. NecessÃ¡rio para testar redirecionamento de autenticaÃ§Ã£o com mais fidelidade.

### Preparar a primeira vez

1. Instale o app `Expo Orbit` no computador:
   [https://expo.dev/orbit](https://expo.dev/orbit)
2. Tenha uma conta Expo criada:
   [https://expo.dev/signup](https://expo.dev/signup)
3. No terminal, dentro da pasta do projeto, entre na conta:

```bash
npx eas login
```

4. Se o Expo pedir para vincular o projeto, aceite.

### Gerar o build de desenvolvimento para iPhone

No terminal, dentro da pasta do projeto:

```bash
npx eas build --profile development --platform ios
```

Atalho equivalente:

```bash
npm run build:dev:ios
```

### Instalar no iPhone

1. Quando o build terminar, o Expo mostrarÃ¡ um link.
2. Abra esse link.
3. Instale o app no iPhone usando o `Expo Orbit` ou o link de instalaÃ§Ã£o fornecido pelo Expo.

### Rodar o app instalado

Depois que o app estiver instalado no iPhone, inicie o servidor local com:

```bash
npm run start:dev
```

Em seguida:

1. Abra o app instalado no iPhone.
2. Ele vai procurar o servidor de desenvolvimento.
3. Se necessÃ¡rio, escaneie o QR code exibido.

### Testar recuperaÃ§Ã£o de senha por link

1. No app instalado, toque em `Entrar`.
2. Toque em `Esqueci minha senha`.
3. Digite seu email.
4. Abra o email no mesmo iPhone.
5. Toque no link de recuperaÃ§Ã£o.
6. O app deve abrir na tela de redefinir senha.
7. Digite a nova senha e salve.

### Resultado esperado

- o iPhone abre o app automaticamente pelo link;
- a tela de nova senha aparece sem pedir cÃ³digo manual;
- apÃ³s salvar, o app volta para login;
- o usuÃ¡rio consegue entrar com a nova senha.

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
