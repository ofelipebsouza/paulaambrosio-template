# Projetos & Imagens — contrato de organização

Este documento define como projetos e imagens são organizados e o **workflow obrigatório**
para adicionar ou alterar projetos. O objetivo: nenhuma imagem pode passar batida — toda foto
entra nomeada, otimizada e referenciada.

## Layout (contrato)

```
src/content/projects/<slug>.mdx            entrada do projeto (1 por projeto, sem draft)
src/assets/projects/<slug>/NN.ext          foto fonte (NN = 01..99, ext original preservada)
src/assets/projects/<slug>/web/NN.webp     versão otimizada, referenciada pelo MDX
```

- `01` = `featuredImage` (card em /projects, hero da página, Open Graph)
- `02..NN` = `gallery`, na ordem exibida
- Toda fonte `NN.ext` tem `web/NN.webp` correspondente
- WebP órfão ou fonte não referenciada = violação (o `check` falha)

## Workflow: adicionar fotos de um projeto

1. Coloque as fotos recebidas em qualquer pasta (ex.: Downloads).
2. Rode o import (copia, deduplica por hash, numera, otimiza e reescreve a galeria):

   ```bash
   npm run projects:import -- home-ka "C:\Users\...\home-ka"
   ```

3. Se o projeto for novo, crie `src/content/projects/<slug>.mdx` antes (copie a estrutura
   de um projeto existente) e rode `npm run projects:sync` depois de preencher o conteúdo.
4. Valide e só então faça build:

   ```bash
   npm run projects:check
   npm run build
   ```

O `import`/`sync` garantem: nomes `01..NN`, WebP gerado (1800px, EXIF corrigido, q82),
galeria reescrita no MDX, órfãos removidos. Não edite caminhos de imagem manualmente —
o `sync` reescreve `featuredImage`/`gallery` a partir da numeração em disco.

## Trocar a capa de um projeto

A capa é sempre `01`. Para escolher outra foto: troque a posição dela no MDX e rode
`npm run projects:sync -- <slug>` (renumera e reescreve refs). Ex.: mover a foto `14`
para capa = reordenar para o topo da lista antes do sync.

## Comandos

| Comando | Função |
|---|---|
| `npm run projects:import -- <slug> <dir>` | Copia fotos de `<dir>`, deduplica e sincroniza |
| `npm run projects:sync` (ou `-- <slug>`) | Renumera 01..NN, otimiza, poda órfãos, reescreve galerias |
| `npm run projects:check` | Valida o contrato inteiro; exit 1 se algo violar |

## O que o `check` valida

- 1 MDX por diretório de assets, e vice-versa (sem projetos órfãos)
- `draft: true` proibido (publique ou delete)
- Referências na sequência exata `01..NN`, sem duplicatas, sem saltos
- Toda fonte tem seu `web/NN.webp`; nenhum WebP órfão; nenhum arquivo fora do padrão
- Pelo menos capa + 1 imagem de galeria

Rode `npm run projects:check` em qualquer mudança de imagens antes do build.
