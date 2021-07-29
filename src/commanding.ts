import * as vscode from 'vscode'
import * as Util from './util'
import * as path from 'path'
import Native from './lib/native'
import commandMap from './command-map'

type FunctionMap = {
  [key: string]: () => void
}

/**
 * These functions are triggered then a speech occurrence matches a key
 * in this object. These don't (and shouldn't) contain any intents and should
 * also be different from the commands used in the commandMap
 */
const functionMap: FunctionMap = {
  save: saveCurrentFile,
  'remove all breakpoints': removeAllBreakpoints,
  'remove all break points': removeAllBreakpoints,
  'run code': runCurrentFile,
  'new line': () => insertText('\n')
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

// TODO: Creating a file is buggy???
function createNewFile(fileName: string) {
  const rootPath = vscode.workspace.workspaceFolders?.[0]?.uri.path || ''
  const newFile = vscode.Uri.parse(
    'untitled:' + path.join(rootPath.slice(1), `${fileName.replace(/ /g, '-')}.txt`)
  )

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

  // Used to make sure the editor moves downward a few extra
  // lines to reveal the cursor
  const editorRange = new vscode.Selection(
    newPosition.with(lineNumber + 10, 0),
    newPosition
  )

  activeEditor.selection = newSelection
  activeEditor.revealRange(editorRange)
}

function toggleBreakpoint(lineNumber: number) {
  const activeEditor = vscode.window.activeTextEditor
  if (!activeEditor) {
    return
  }

  const location = new vscode.Location(
    activeEditor.document.uri,
    activeEditor.selection.active.with(lineNumber - 1)
  )
  const newBreakpoint = new vscode.SourceBreakpoint(location)
  const currentBreakpoint = vscode.debug.breakpoints.find(breakpoint => {
    return (
      (breakpoint as vscode.SourceBreakpoint).location.range.start.line === lineNumber - 1
    )
  })

  if (currentBreakpoint) {
    vscode.debug.removeBreakpoints([currentBreakpoint])
  } else {
    vscode.debug.addBreakpoints([newBreakpoint])
  }
}

/**
 * Writes to VS Code's integrated terminal if it's showing
 */
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

function runCurrentFile() {
  if (!vscode.extensions.getExtension('formulahendry.code-runner')) {
    vscode.window.showWarningMessage(
      'This command requires extension formulahendry.code-runner'
    )
  } else {
    vscode.commands.executeCommand('code-runner.run')
  }
}

function handleTextResult(text: string) {
  const command = commandMap[text]
  const func = functionMap[text]

  if (command) {
    vscode.commands.executeCommand(command)
  } else if (func) {
    func()
  }
}

function handleIntentMatches(intentMatches: Native.Intent[]) {
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
      createNewFile(intent.fileName)
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

export { handleTextResult, handleIntentMatches }
