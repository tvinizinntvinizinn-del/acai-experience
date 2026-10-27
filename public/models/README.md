# Modelo 3D (opcional)

Coloque aqui `acai-cup.glb` e mude `renderer` para `"model"` em
`src/config/experience.ts`. Sem o arquivo, o site usa a sequência de imagens.

## Convenções

- glTF binário (`.glb`), preferencialmente com compressão Meshopt ou Draco e texturas KTX2/WebP (meta: < 4 MB).
- Origem na **base** do copo, eixo Y para cima, altura ≈ 2,3 unidades (ajuste fino com `experience.model.scale`).
- Frente do copo voltada para +Z.
- Coberturas como nós separados com nome iniciando em `topping` (ex.: `topping_morango_1`): eles se afastam do copo durante a "explosão" dos ingredientes e voltam na montagem.
- Materiais PBR (metal/rugosidade). O plástico pode usar `KHR_materials_transmission`.

O renderizador volta automaticamente para a sequência de imagens se o WebGL
não estiver disponível, se o aparelho for fraco ou se o modelo falhar ao carregar.
