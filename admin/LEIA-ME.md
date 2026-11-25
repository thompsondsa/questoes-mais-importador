# Importador de provas do Questões+

Esta é uma ferramenta administrativa experimental e separada da tela principal do aplicativo.

## Abrir
Depois que a ramificação `desenvolvimento-importador` estiver publicada em um ambiente de teste, abrir `admin/importador.html`.

## Fluxo
1. Selecione o PDF da prova e, se houver, o PDF do gabarito.
2. Clique em **Ler PDFs**. A leitura atual funciona com PDFs que contenham texto selecionável. PDFs escaneados exigem OCR, que ainda não está incluído.
3. Confira a identificação da prova e cada questão. Adicione/remova questões e preencha alternativas.
4. O gabarito detectado no PDF é apenas uma sugestão. Compare com o gabarito definitivo, incluindo anulações e retificações.
5. Preencha explicação/comentário revisado. O importador não cria explicações automaticamente.
6. Registre a origem e confirme a autorização ou fundamento válido para reproduzir o conteúdo integral.
7. Clique em **Validar e gerar pacote JSON**.

## Proteções
- Não gera pacote se faltar enunciado, alternativas suficientes, gabarito ou comentário revisado.
- Não gera pacote sem confirmação explícita de autorização/fundamento para reprodução.
- Gera IDs de questões com prefixo do concurso para reduzir colisões no histórico do estudante.
- Não envia PDFs ou questões para servidor. A leitura ocorre no navegador; a biblioteca PDF.js é carregada de CDN, portanto a primeira leitura exige internet.
- O JSON gerado precisa passar por revisão humana antes de entrar no catálogo.

## Limitações da primeira versão
- Não faz OCR de PDFs escaneados.
- Não identifica automaticamente imagens, tabelas, fórmulas ou questões que continuam na página seguinte.
- A identificação de respostas no gabarito é uma sugestão simples e pode falhar em layouts diferentes.
- Não importa diretamente para o catálogo e não publica nada no GitHub.
