# Simulador visual de airflow

Simulação interativa em Three.js para demonstrar o fluxo de ar de um gabinete “Aquário (tipo O11 Dynamic)”. O foco é educativo (não é CFD) e inclui fumaça volumétrica, 10 fans interativas, máquina de fumaça externa, e presets de pressão positiva/negativa.

## Como executar

1. Instale dependências globais mínimas se ainda não tiver um servidor de arquivos estático:
   ```bash
   npm install -g serve
   ```

2. Inicie um servidor a partir da raiz do projeto (não abra via `file://`):
   ```bash
   serve .
   ```
   ou, se preferir Python:
   ```bash
   python -m http.server 5000
   ```

3. Acesse em `http://localhost:3000` (ou a porta exibida).

## Controles principais

- Mouse: orbitar/zoom via OrbitControls para inspecionar o interior.
- Combo “Gabinete”: seleção de modelos (extensível). Atualmente inclui “Aquário (tipo O11 Dynamic)”.
- Botões:
  - **Configuração recomendada**: balanceia intake/exhaust.
  - **Pressão positiva** e **Pressão negativa**: alternam presets de fluxo.
  - **Resetar**: volta ao estado padrão de cada fan.
  - **Fumaça: LIGAR/DESLIGAR**: controla a emissão de fumaça; ao desligar, a fumaça dissipa gradualmente.
- Clique em qualquer fan para alternar INTAKE → EXHAUST → OFF. Cores: azul (entra), vermelho (sai), cinza (off).

## Referencial

- X → direita, Y → cima, Z → frente (painel frontal).
- Vidros: apenas frente (+Z) e lateral direita (+X). Demais faces são opacas.
- Fans:
  - 3 inferiores (intake, soprando de baixo para cima, alinhadas em linha).
  - 3 laterais em coluna (intake, soprando direita → esquerda).
  - 3 superiores em linha (exhaust, soprando para cima).
  - 1 traseira (exhaust, soprando para trás).

## Estrutura do código

- `index.html` – canvas + container de UI.
- `src/main.js` – setup do renderer, câmera, controles, interação e animação.
- `src/cases/*` – registro de gabinetes e specs (dimensões, slots, presets).
- `src/scene/*` – construção do gabinete, fans, objetos internos, máquina de fumaça.
- `src/sim/*` – sistema de partículas/fumaça e regras de colisão/aberturas.
- `src/ui/*` – UI overlay e estilos globais.
- `src/utils/*` – constantes e import centralizado de Three.js/OrbitControls.

## Notas de implementação

- O gabinete é tratado como caixa selada; partículas só atravessam pelas aberturas de fan conforme o estado (intake/exhaust/off).
- O vidro não tem furos; os slots de fan usam anéis e túneis escuros para indicar as aberturas.
- A máquina de fumaça fica fixa fora do gabinete, do lado direito, emitindo partículas na direção base direita → esquerda.
- OrbitControls sempre permite ver o interior; evite usar `file://` para não bloquear imports ES Module.
