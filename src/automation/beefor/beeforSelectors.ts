/**
 * Centralized Beefor selectors with fallback chains.
 * Resolution order: stable text/role first, structural Angular Material next,
 * raw CSS last. If Beefor changes, update here only.
 */

export const Selectors = {
  login: {
    emailInput: [
      'input[type="email"]',
      'input[name="email"]',
      'input[formcontrolname="email"]',
      'input[autocomplete="email"]',
    ],
    passwordInput: [
      'input[type="password"]',
      'input[name="password"]',
      'input[formcontrolname="password"]',
      'input[autocomplete="current-password"]',
    ],
    nextButtonByText: ['Avançar', 'Próximo', 'Next'],
    submitButtonByText: ['Entrar', 'Login', 'Sign in'],
  },

  app: {
    loggedInIndicators: [
      'app-time-sheet-beefor-button',
      'app-time-sheet-beefor-lancamentos',
      'app-personal-mood-card',
      '[data-test="user-menu"]',
      'mat-toolbar:has-text("Beefor")',
    ],
    logoutButtonByText: ['Sair', 'Logout', 'Sign out'],
    userMenu: ['[aria-label="user menu"]', '.user-menu', 'button.avatar'],
  },

  autoLancamento: {
    component: 'app-time-sheet-beefor-button',
    buttonByText: 'Auto lançamento',
    buttonCss: [
      'app-time-sheet-beefor-button button',
      'button.mat-raised-button.mat-accent',
    ],
  },

  timesheet: {
    pageRoot: 'app-time-sheet-beefor-lancamentos',
    yearSelect: 'mat-select[formcontrolname="ano"]',
    monthSelect: 'mat-select[formcontrolname="mes"]',
    matOption: 'mat-option',
    dayRow: 'app-time-sheet-beefor-lancamentos .row-apontamento',
    rowTimeInputs: 'input[type="time"]',
    rowSaveButton: 'button.mat-icon-button:has(mat-icon:has-text("save"))',
    rowCommentInput: '.teste2 input[type="text"]',
  },

  kudoCard: {
    profileSection: 'app-card-kudo-card, [class*="kudo"]',
    addButtonByIcon: 'button:has(mat-icon:has-text("add"))',
    addButtonAria: [
      'button[aria-label*="kudo" i]',
      'button[aria-label*="adicionar" i]',
    ],
    dialog: 'mat-dialog-container, .mat-dialog-container, [role="dialog"]',
    dialogTitleText: 'Enviar Kudo Card',
    radioPerson: 'Enviar para uma pessoa',
    radioTeam: 'Enviar para um time',
    autocompleteInput:
      'input[type="text"][role="combobox"], input[aria-autocomplete="list"], mat-form-field input[type="text"]',
    autocompleteOption: '.cdk-overlay-container .mat-option, .mat-autocomplete-panel mat-option',
    messageTextarea: 'textarea',
    sendButtonText: 'Enviar',
    closeButtonText: 'Fechar',
    cardImageBySrc: (slug: string) => `img[src*="${slug}"]`,
  },

  mood: {
    component: 'app-personal-mood-card',
    toggleGroup: 'mat-button-toggle-group.sentimento',
    allToggles:
      'mat-button-toggle-group.sentimento mat-button-toggle, app-personal-mood-card mat-button-toggle',
    toggleByText: (mood: string) =>
      `mat-button-toggle-group.sentimento mat-button-toggle:has-text("${mood}"), app-personal-mood-card mat-button-toggle:has-text("${mood}")`,
    fallbackButtonByText: (mood: string) =>
      `button.mat-button-toggle-button:has-text("${mood}")`,
    activeClassByMood: {
      'Dia feliz': 'feliz',
      'Dia bom': 'bom',
      'Dia não tão bom': 'nao_tao_bom',
      'Dia triste': 'triste',
    } as Record<string, string>,
    svgIconToMood: {
      sentimento_dia_feliz: 'Dia feliz',
      sentimento_bom: 'Dia bom',
      sentimento_nao_tao_bom: 'Dia não tão bom',
      sentimento_triste: 'Dia triste',
    } as Record<string, string>,
  },
} as const;
