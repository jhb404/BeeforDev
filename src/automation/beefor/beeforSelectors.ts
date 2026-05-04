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
    // any of these visible == considered logged in
    loggedInIndicators: [
      'app-time-sheet-beefor-button',
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
    /** Each day row on the apontamento list */
    dayRow: 'app-time-sheet-beefor-lancamentos .row-apontamento',
    /** Within a row: 6 time inputs (entrada, int1, ret1, int2, ret2, saída) in DOM order */
    rowTimeInputs: 'input[type="time"]',
    /** Save button (floppy disk icon) within row */
    rowSaveButton: 'button.mat-icon-button:has(mat-icon:has-text("save"))',
    /** Comment text input within row */
    rowCommentInput: '.teste2 input[type="text"]',
  },

  mood: {
    component: 'app-personal-mood-card',
    toggleGroup: 'mat-button-toggle-group.sentimento',
    /** All toggles in the group, regardless of selected state */
    allToggles:
      'mat-button-toggle-group.sentimento mat-button-toggle, app-personal-mood-card mat-button-toggle',
    // labels exist on the toggle button text
    toggleByText: (mood: string) =>
      `mat-button-toggle-group.sentimento mat-button-toggle:has-text("${mood}"), app-personal-mood-card mat-button-toggle:has-text("${mood}")`,
    fallbackButtonByText: (mood: string) =>
      `button.mat-button-toggle-button:has-text("${mood}")`,
    /** Map UI label → CSS class suffix on <mat-button-toggle> when active */
    activeClassByMood: {
      'Dia feliz': 'feliz',
      'Dia bom': 'bom',
      'Dia não tão bom': 'nao_tao_bom',
      'Dia triste': 'triste',
    } as Record<string, string>,
    /** Map svgicon attr → mood UI label */
    svgIconToMood: {
      sentimento_dia_feliz: 'Dia feliz',
      sentimento_bom: 'Dia bom',
      sentimento_nao_tao_bom: 'Dia não tão bom',
      sentimento_triste: 'Dia triste',
    } as Record<string, string>,
  },
} as const;
