type CommandMap = {
  [key: string]: string | undefined
}

/**
 * These commands should map to vscode's command ids.
 * The key is the exact occurrence needed to execute the command
 */
const commandMap: CommandMap = {
  'break point': 'editor.debug.action.toggleBreakpoint',
  breakpoint: 'editor.debug.action.toggleBreakpoint',
  'close editor': 'workbench.action.closeActiveEditor',
  'close terminal': 'workbench.action.terminal.toggleTerminal',
  comment: 'editor.action.commentLine',
  continue: 'workbench.action.debug.continue',
  copy: 'editor.action.clipboardCopyAction',
  'cursor left': 'cursorWordLeft',
  'cursor right': 'cursorWordRight',
  cut: 'editor.action.clipboardCutAction',
  'delete line': 'editor.action.deleteLines',
  'format document': 'editor.action.formatDocument',
  'go backward': 'workbench.action.navigateBack',
  'go forward': 'workbench.action.navigateForward',
  'go to definition': 'editor.action.revealDefinition',
  hover: 'editor.action.showHover',
  indent: 'editor.action.indentLines',
  'move line up': 'editor.action.moveLinesUpAction',
  'move line down': 'editor.action.moveLinesDownAction',
  redo: 'redo',
  'remove indent': 'editor.action.outdentLines',
  'reopen editor': 'workbench.action.reopenClosedEditor',
  're open editor': 'workbench.action.reopenClosedEditor',
  restart: 'workbench.action.debug.restart',
  'open terminal': 'workbench.action.terminal.focus',
  paste: 'editor.action.clipboardPasteAction',
  'start debugging': 'workbench.action.debug.start',
  'show explorer': 'workbench.view.explorer',
  'step in to': 'workbench.action.debug.stepInto',
  'step into': 'workbench.action.debug.stepInto',
  'step out': 'workbench.action.debug.stepOut',
  'step over': 'workbench.action.debug.stepOver',
  'stop debugging': 'workbench.action.debug.stop',
  'toggle dev panel': 'workbench.action.toggleDevTools',
  'toggle dev tools': 'workbench.action.toggleDevTools',
  'toggle developer panel': 'workbench.action.toggleDevTools',
  'toggle developer tools': 'workbench.action.toggleDevTools',
  // Toggles the panel that contains the terminal and output
  'toggle panel': 'workbench.action.togglePanel',
  'toggle side bar': 'workbench.action.toggleSidebarVisibility',
  'toggle sidebar': 'workbench.action.toggleSidebarVisibility',
  undo: 'undo'
}

export default commandMap
