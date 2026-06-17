# Plano de Implementação: Customização do Frontend (Branding do Provedor)

Este plano foca na adequação da interface pública (Captive Portal e telas de usuário) para refletir a identidade visual do seu provedor de internet (ISP).

## 1. Escopo das Alterações
Vamos customizar as seguintes páginas públicas do seu sistema (localizadas em `frontend/src/pages/public/`):
- **Tela de Conexão:** `LoginHotspot.jsx`
- **Telas de Captura:** `CadastroCliente.jsx`, `CadastroLead.jsx`, `CadastroLGPD.jsx`, `CadastroLeadPassivo.jsx`
- **Telas Comerciais:** `PlanosCliente.jsx`, `Pagamento.jsx`
- **Telas Auxiliares:** `CampanhaPlayer.jsx`, `Registro.jsx`

## 2. Open Questions (Design & Branding)
> [!IMPORTANT]
> Para deixarmos o sistema exatamente com a cara do seu provedor, preciso das seguintes informações:

1. **Cores da Marca:** Qual a cor principal (ex: Azul escuro, Vermelho, Laranja) e secundária? (Se tiver os códigos HEX, como #FF0000, melhor ainda).
2. **Logomarca:** Você possui um link/URL público para a sua logo, ou deseja que eu crie um espaço com uma "logo placeholder" para você substituir depois via código ou painel?
3. **Estilo / Tema:** Você prefere um visual **Dark Mode** (fundo escuro, pegada mais gamer/tech) ou **Light Mode** (fundo claro, visual corporativo e clean)?
4. **Imagens de Fundo:** Deseja adicionar alguma imagem de fundo (background) na tela de login, ou prefere apenas um fundo de cor sólida / gradiente?

## 3. Proposed Changes

### [Frontend / UI]
#### [MODIFY] `frontend/tailwind.config.js`
- Adição das variáveis de cores da marca (ex: `brand-primary`, `brand-secondary`).
#### [MODIFY] `frontend/src/index.css`
- Atualização das classes utilitárias globais (cores de fundo, texto).
#### [MODIFY] `frontend/src/pages/public/*`
- Refatoração dos botões, inputs, cards e background para utilizar as novas cores e melhorar a experiência do usuário (UX), garantindo um visual premium.

## 4. Verification Plan

### Manual Verification
- Iniciaremos o projeto localmente (`npm run dev` no frontend) para validar se o design está responsivo (mobile-first) e esteticamente premium.
- Validaremos se a legibilidade dos textos está adequada nas novas cores.
- O script `ux_audit.py` (ou validação manual equivalente) será utilizado para garantir boas práticas.

## User Review Required
> [!WARNING]
> Responda às **4 perguntas** do item 2 (Cores, Logo, Estilo e Background). Com suas respostas, iniciarei a Fase 2 (Implementação) alterando o código do frontend.
