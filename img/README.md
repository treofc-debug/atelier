# Pasta de imagens (`img/`)

Coloque aqui suas imagens locais para usar nos produtos.

## Como usar nos produtos

No arquivo `products.js`, cada produto pode ter um campo opcional `imageLocal` apontando para um arquivo dentro desta pasta.

Exemplo:

```js
{
  // ...
  image: "https://.../imagem-remota.jpg",
  imageLocal: "img/vestido-01.jpg"
}
```

## Importante

- O site aceita **caminho relativo** (ex.: `img/vestido-01.jpg`).
- Se a imagem local não existir, o site faz **fallback automático** para `image` (a imagem remota), mantendo tudo funcional.


