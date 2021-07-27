import * as vscode from 'vscode'
import * as Util from './util'
import * as path from 'path'
import Native from './lib/binding'

type CommandMap = {
  [key: string]: string
}

type FunctionMap = {
  [key: string]: () => void
}

/**
 * These commands should map to vscode's. The key is the exact occurrence
 * needed to execute the command
 */
const commandMap: CommandMap = {
  'toggle dev tools': 'workbench.action.toggleDevTools',
  'toggle developer tools': 'workbench.action.toggleDevTools',
  'toggle dev panel': 'workbench.action.toggleDevTools',
  'toggle developer panel': 'workbench.action.toggleDevTools',
  'step over': 'workbench.action.debug.stepOver',
  'start debugging': 'workbench.action.debug.start',
  'stop debugging': 'workbench.action.debug.stop',
  'break point': 'editor.debug.action.toggleBreakpoint',
  breakpoint: 'editor.debug.action.toggleBreakpoint',
  'toggle terminal': 'workbench.action.terminal.toggleTerminal',
  'toggle side bar': 'workbench.action.toggleSidebarVisibility',
  'toggle sidebar': 'workbench.action.toggleSidebarVisibility',
  continue: 'workbench.action.debug.continue',
  'step in to': 'workbench.action.debug.stepInto',
  'step into': 'workbench.action.debug.stepInto',
  'step out': 'workbench.action.debug.stepOut',
  restart: 'workbench.action.debug.restart',
  'close editor': 'workbench.action.closeActiveEditor',
  reopen: 'workbench.action.reopenClosedEditor'
}

const functionMap: FunctionMap = {
  save: saveCurrentFile,
  'remove all breakpoints': removeAllBreakpoints,
  'remove all break points': removeAllBreakpoints
}

function insertText(text: string, isComment = false) {
  const activeEditor = vscode.window.activeTextEditor

  if (!activeEditor) {
    return
  }

  const position = activeEditor.selection.end
  const uri = activeEditor.document.uri
  const edit = new vscode.WorkspaceEdit()

  edit.insert(uri, position, isComment ? `// ${text}` : text)

  vscode.workspace.applyEdit(edit).then(() => {
    activeEditor.document.save()
  })
}

function openNewFile(fileName: string) {
  const rootPath = vscode.workspace.workspaceFolders?.[0]?.uri.path || ''
  const newFile = vscode.Uri.parse(
    'untitled:' + path.join(rootPath.slice(1), `${fileName.replace(/ /g, '-')}.txt`)
  )
  console.log(newFile)
  vscode.workspace.openTextDocument(newFile).then(document => {    
    vscode.window.showTextDocument(document)
  })
}

function moveCursor(lineNumber: number) {
  const activeEditor = vscode.window.activeTextEditor

  if (!activeEditor || lineNumber < 0) {
    return
  }

  const position = activeEditor.selection.active
  const newPosition = position.with(lineNumber - 1, 0)
  const newSelection = new vscode.Selection(newPosition, newPosition)

  activeEditor.selection = newSelection
  activeEditor.revealRange(newSelection)
}

// TODO: Make toggle actually remove the break point
function toggleBreakpoint(lineNumber: number) {
  const activeEditor = vscode.window.activeTextEditor
  if (!activeEditor) {
    return
  }

  const location = new vscode.Location(
    activeEditor.document.uri,
    activeEditor.selection.active.with(lineNumber - 1)
  )
  const breakpoint = new vscode.SourceBreakpoint(location)

  vscode.debug.addBreakpoints([breakpoint])
  // console.log(vscode.debug.breakpoints[0])
}

// This writes to VSCode's integrated terminal if it's showing
function writeToTerminal(text: string) {
  if (!vscode.window.activeTerminal) {
    return
  }

  vscode.window.activeTerminal.sendText(text, true)
}

function removeAllBreakpoints() {
  vscode.debug.removeBreakpoints(vscode.debug.breakpoints)
}

function saveCurrentFile() {
  vscode.window.activeTextEditor?.document.save()
}

export function handleResultText(text: string) {
  if (commandMap[text]) {
    vscode.commands.executeCommand(commandMap[text])
  } else if (functionMap[text]) {
    functionMap[text]()
  }
}

export function handleIntentMatches(intentMatches: Native.Intent[]) {
  intentMatches.forEach(intent => {
    if (intent.textInsertion) {
      insertText(intent.textInsertion, intent.id === 'Voice.InsertComment')
    }

    if (intent.numNewLines) {
      // The number from this intent is usually treated as a word
      const repetitions = Util.parseNumberFromPhrase(intent.numNewLines)

      if (!Number.isNaN(repetitions)) {
        insertText('\n'.repeat(repetitions))
      }
    }

    if (intent.fileName) {
      openNewFile(intent.fileName)
    }

    // The line number intent usually returns numbers as words,
    // instead, we have to extract the number from the phrase if
    // it contains a number
    if (intent.lineNumber) {
      const lineNumber = Util.parseNumberFromPhrase(intent.text)

      if (!Number.isNaN(lineNumber)) {
        moveCursor(lineNumber)
      }
    }

    if (intent.dialogText) {
      vscode.window.showInformationMessage(intent.dialogText)
    }

    if (intent.breakpointLine) {
      const lineNumber = Util.parseNumberFromPhrase(intent.text)

      if (!Number.isNaN(lineNumber)) {
        toggleBreakpoint(lineNumber)
      }
    }

    if (intent.terminalPhrase) {
      writeToTerminal(intent.terminalPhrase)
    }
  })
}
