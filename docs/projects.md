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

## projectType (taxonomia)

`projectType` é obrigatório e deve ser um destes valores:

| projectType | Aba em /projects | Uso |
|---|---|---|
| `Residential` | Residential | casas, apartamentos, residências construídas |
| `Penthouse` | Residential | penthouses construídos |
| `Commercial` | Commercial | projetos comerciais construídos |
| `Hospitality` | Commercial | hospitality construído |
| `Renders` | Renders | estudos em 3D render (fotografia real não é render) |

As abas do hub `/projects` agrupam esses valores em três blocos editoriais —
**Residential · Commercial · Renders** — para separar obra real de estudo de render.
Projetos de render **não entram na rotação da hero da home** (fotografia real como protagonista).

## Setores (projetos com grupos de imagens)

Projetos podem declarar **setores** (ex.: render-pm: Club Room, Living, Master) como faixas
contíguas da galeria — `name` + quantidade de imagens, na ordem da numeração:

```yaml
sectors:
  - name: "Club Room"
    images: 24
  - name: "Living"
    images: 4
  - name: "Master"
    images: 7
gallery:
  - "../../assets/projects/render-pm/web/02.webp"
  - "../../assets/projects/render-pm/web/03.webp"
```

Regras (validadas pelo `check`):
- a soma de `images` cobre exatamente a galeria (a capa `01` fica fora das faixas);
- nomes de setor sem duplicata;
- a contiguidade é estrutural: cada faixa é uma fatia sequencial da galeria.

Na página do projeto a galeria é exibida **agrupada por setor**, com um heading editorial
(um `<h2>`) por bloco. O `sync` recalcula as faixas a partir das etiquetas em memória
(ordem de import), então mover imagens entre setores = reordenar no MDX + `sync`.

## Workflow: adicionar fotos de um projeto

1. Coloque as fotos recebidas em qualquer pasta (ex.: Downloads). Se o projeto tiver setores,
   organize em **uma subpasta por setor** (`Club Room/`, `Living/`, `MASTER/…`) — o nome da
   pasta vira o setor ("MASTER" → "Master"); subpastas mais fundas pertencem ao setor do topo.
2. Rode o import (copia, deduplica por hash, numera por setor, otimiza e reescreve a galeria):

   ```bash
   npm run projects:import -- home-ka "C:\Users\...\home-ka"
   npm run projects:import -- render-pm "C:\Users\...\render-pm"
   ```

3. Se o projeto for novo, crie `src/content/projects/<slug>.mdx` antes (copie a estrutura
   de um projeto existente — para renders, use `render-pm.mdx` como base) e rode
   `npm run projects:sync` depois de preencher o conteúdo.
4. Valide e só então faça build:

   ```bash
   npm run projects:check
   npm run build
   ```

O `import`/`sync` garantem: nomes `01..NN`, WebP gerado (1800px, EXIF corrigido, q82),
galeria reescrita no MDX com as faixas de setor atualizadas, órfãos removidos. Não edite
caminhos de imagem manualmente — o `sync` reescreve `featuredImage`/`gallery`/`sectors`
a partir da numeração em disco. Fotos adicionadas depois a um projeto com setores entram
na faixa do setor certo (import recursivo por pasta).

## Trocar a capa de um projeto

A capa é sempre `01`. Para escolher outra foto: troque a posição dela no MDX e rode
`npm run projects:sync -- <slug>` (renumera e reescreve refs). Ex.: mover a foto `14`
para capa = reordenar para o topo da lista antes do sync.

## Comandos

| Comando | Função |
|---|---|
| `npm run projects:import -- <slug> <dir>` | Copia fotos de `<dir>` (subpastas = setores), deduplica e sincroniza |
| `npm run projects:sync` (ou `-- <slug>`) | Renumera 01..NN, otimiza, poda órfãos, reescreve galerias/setores |
| `npm run projects:check` | Valida o contrato inteiro; exit 1 se algo violar |

## O que o `check` valida

- 1 MDX por diretório de assets, e vice-versa (sem projetos órfãos)
- `draft: true` proibido (publique ou delete)
- `projectType` presente e dentro da taxonomia; `imageAlt` presente
- Referências na sequência exata `01..NN`, sem duplicatas, sem saltos
- Setores: faixas cobrem exatamente a galeria, sem nomes duplicados
- Toda fonte tem seu `web/NN.webp`; nenhum WebP órfão; nenhum arquivo fora do padrão
- Pelo menos capa + 1 imagem de galeria

Rode `npm run projects:check` em qualquer mudança de imagens antes do build.
