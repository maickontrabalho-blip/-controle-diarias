# CD - Controle de Diárias

Aplicativo web responsivo/PWA para controlar empresas tomadoras, diárias, notas fiscais e recebimentos. **Não utiliza Supabase.**

## Como os dados são armazenados

- Os registros operacionais ficam no IndexedDB do navegador/aparelho.
- O Google Drive recebe cópias de segurança JSON quando o usuário toca em **Fazer backup agora**.
- Os arquivos ficam visíveis na raiz de **Meu Drive**, com nome `CD-Controle-de-Diarias-backup-...json`.
- A integração usa Google Identity Services + Drive API v3 com escopo `drive.file`, que limita o acesso aos arquivos criados/abertos pelo aplicativo. O app não lê seus documentos pessoais.
- O token OAuth fica somente em memória. Depois de atualizar/reabrir o app ou quando o token expirar, conecte o Gmail novamente.
- Não há sincronização automática entre aparelhos. Para levar os dados para outro celular, faça backup no aparelho antigo e restaure no novo.

> Atenção: dados novos ficam inicialmente apenas no aparelho. Se limpar os dados do navegador, desinstalar/formatar ou trocar de aparelho antes de enviar um backup, os lançamentos que ainda não foram copiados ao Drive não poderão ser recuperados.

## Arquivos

- `index.html`: interface e bibliotecas externas.
- `styles.css`: tema escuro responsivo.
- `app.js`: telas, CRUD local, cálculos, exportação Excel/JSON e importação/restauração.
- `drive.js`: autenticação Google e operações de backup/restauração no Drive.
- `config.js`: OAuth Client ID opcional.
- `manifest.webmanifest`, `sw.js`, `icon.svg`, `icon-192.png`, `icon-512.png`: instalação PWA e cache básico.

## Configurar Google Drive (faça uma vez)

1. Acesse [Google Cloud Console](https://console.cloud.google.com/) com o Gmail que será usado para os backups.
2. Crie um projeto (por exemplo, `CD Controle de Diarias`).
3. No seletor de APIs, abra **APIs e serviços → Biblioteca**, procure **Google Drive API** e clique em **Ativar**.
4. Configure a tela de consentimento OAuth em **Google Auth Platform** (ou **APIs e serviços → Tela de consentimento OAuth**, conforme a interface):
   - Tipo de usuário: **Externo**, se aparecer essa opção.
   - Nome do app: `CD - Controle de Diárias`.
   - Informe um e-mail de suporte e seu e-mail de contato.
   - Em **Público-alvo / Audience**, deixe em **Testing / Teste** enquanto só você usa e adicione seu próprio Gmail em **Test users / Usuários de teste**.
   - Não solicite escopos amplos de Drive. O aplicativo pede somente `https://www.googleapis.com/auth/drive.file`.
5. Vá a **Clientes / Clients → Criar cliente / Create client** e escolha **Aplicativo da Web / Web application**.
6. Dê um nome, por exemplo `CD Vercel`.
7. Em **Origens JavaScript autorizadas**, adicione a origem do seu site Vercel, sem caminho e sem barra final, por exemplo `https://seu-projeto.vercel.app`. Adicione também `http://localhost:3000` apenas se for testar localmente. Depois que tiver domínio próprio, adicione também `https://seudominio.com`.
8. Crie o cliente e copie o **Client ID** que termina em `.apps.googleusercontent.com`. Não use nem publique Client Secret. Este projeto usa o fluxo de token no navegador e não precisa de Client Secret.
9. Abra o app publicado, entre em **Configurações / Backup**, cole o Client ID e toque em **Salvar configuração neste navegador**.
10. Toque em **Conectar meu Gmail**, escolha a conta correta e autorize o acesso. Depois toque em **Procurar backups no Drive** ou **Fazer backup agora**.

Durante o modo de teste, o Google pode mostrar um aviso de aplicativo não verificado. Como você adicionou seu Gmail como usuário de teste, prossiga somente se reconhecer o nome do aplicativo e o projeto que criou. Para disponibilizar a terceiros, será necessário configurar a publicação e cumprir as exigências de verificação do Google aplicáveis ao app/escopos.

## Subir no GitHub e publicar na Vercel

1. Baixe e extraia o ZIP do projeto.
2. No GitHub, crie um repositório novo, por exemplo `CD-Controle-de-Diarias`.
3. Envie **todos os arquivos e pastas que estão dentro** da pasta extraída para a raiz do repositório. O `index.html` deve ficar na raiz, não dentro de outra pasta.
4. Entre em [Vercel](https://vercel.com/), escolha **Add New → Project**, importe o repositório GitHub.
5. Como é um site estático simples, use preset **Other**; deixe Build Command vazio e Output Directory como `.` (raiz do projeto).
6. Clique em Deploy. A Vercel fornecerá um endereço `https://...vercel.app`.
7. Volte ao Google Cloud Console e confirme que esse endereço exato está nas Origens JavaScript autorizadas do cliente OAuth. Se adicionar ou mudar o domínio, atualize essa lista.
8. A cada novo envio/commit para a branch de produção conectada (normalmente `main`), a Vercel fará uma nova implantação automaticamente.

## Instalar como aplicativo no Android

1. Abra o endereço `https://...vercel.app` no Chrome do celular.
2. Aguarde o site carregar e abra o menu de três pontinhos do Chrome.
3. Toque em **Instalar app** ou **Adicionar à tela inicial** (o texto pode variar).
4. Confirme. O ícone CD aparecerá na tela inicial.

O PWA precisa ser servido por HTTPS (a Vercel já fornece HTTPS). A instalação não cria uma cópia independente dos dados: ela usa o armazenamento do navegador no mesmo aparelho.

## Backup e restauração

Há duas formas de proteger e recuperar os dados:

1. **Sem configurar Google Cloud:** em Configurações / Backup, toque em **Baixar backup completo**. O navegador baixa um arquivo JSON. Você pode guardá-lo no aparelho, em Downloads, ou enviar manualmente para o Google Drive. Para recuperar, selecione o mesmo arquivo no campo **Restaurar backup do celular, Downloads ou Google Drive**.
2. **Planilha Excel:** toque em **Exportar planilha Excel**. O arquivo contém abas de Empresas, Diarias, Notas Fiscais e Recebimentos e mantém os IDs internos para permitir a importação. Também pode ser selecionado no campo de restauração.
3. **Integração direta com Drive:** continua disponível para quem já configurou OAuth Client ID. Conecte o Gmail, faça backup ou procure os arquivos criados pelo aplicativo.

Para restauração mais fiel, prefira o JSON completo. A importação substitui os dados atuais do aparelho e pede confirmação antes de executar. Faça uma cópia dos dados atuais antes de restaurar.
- Recomenda-se fazer um backup antes de qualquer troca/formatação do aparelho e conferir no Drive se o arquivo foi criado.

## Limitações conhecidas

- Esta versão é local-first: não sincroniza automaticamente vários aparelhos e não oferece edição simultânea.
- O navegador pode apagar armazenamento local em cenários de limpeza/gerenciamento; backups manuais são essenciais.
- Comprovantes continuam sendo registrados como links (não há upload de anexos nesta versão).
- A autenticação Google autoriza somente o Drive para backups; não existe conta/senha própria do sistema.
- A consulta de CNPJ utiliza BrasilAPI.
- A conciliação é uma visão inicial de notas fiscais menos recebimentos, sem vínculo individual entre recebimento e NF.


## Atualização de novembro/2026
- Painel inicial agora mostra total de diárias, diárias pagas e pendentes, notas fiscais, recebimentos e saldo das NFs por mês.
- Cada diária possui situação de pagamento (Pendente/Pago), editável no histórico.
- Valores de diária já utilizados aparecem como sugestões no próximo lançamento.
- Ao salvar uma diária, o aplicativo retorna à visão geral para mostrar os indicadores atualizados.
- Layout aprimorado para celulares, com cartões em duas colunas e tabelas com rolagem horizontal.


## Atualização v5 — comprovantes e relatório por empresa

- Cadastro de nota fiscal aceita anexo PDF ou imagem (até 12 MB por arquivo).
- Cadastro de recebimento aceita anexo PDF ou imagem (até 12 MB por arquivo).
- Os anexos ficam armazenados no IndexedDB junto ao registro e podem ser abertos/baixados nas telas de Notas fiscais, Recebimentos e no relatório individual da empresa.
- O relatório individual por empresa mostra serviços/diárias, notas fiscais, recebimentos e saldo pendente por mês, além dos totais acumulados de todo o histórico.
- O backup JSON local e o backup no Google Drive incluem os anexos. Para preservar documentos ao trocar de aparelho, faça backup JSON ou no Drive.
- A planilha Excel exporta os dados tabulares e o nome/tipo dos anexos, mas não incorpora o conteúdo binário dos arquivos. Use JSON/Drive para restauração integral com documentos.
- O arquivo Excel pode restaurar os registros tabulares, mas não recupera os anexos; para isso, restaure o JSON.
