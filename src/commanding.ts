import * as vscode from 'vscode'
import * as Util from './util'
import * as path from 'path'
import * as fs from 'fs'
import Native from './lib/native'
import CommandMap from './command-map'

type FunctionMap = {
  [key: string]: () => void
}

// eslint-disable-next-line @typescript-eslint/naming-convention
const { System } = Native

/**
 * These functions are triggered when a speech occurrence matches a key
 * in this object. These don't (and shouldn't) contain any intents and should
 * also be different from the commands used in the CommandMap
 */
const functionMap: FunctionMap = {
  'delete current file': deleteCurrentFile,
  'new line': () => insertText('\n'),
  'remove all breakpoints': removeAllBreakpoints,
  'remove all break points': removeAllBreakpoints,
  'run code': runCurrentFile,
  save: saveCurrentFile
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

async function createNewFile(fileName: string) {
  const parsedFileName = `${fileName.replace(/ /g, '-')}.txt`
  const rootPath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || ''
  const filePath = path.join(rootPath, parsedFileName)
  const fileUri = vscode.Uri.file(filePath)

  if (await Util.doesFileExist(filePath)) {
    vscode.window.showErrorMessage(`${parsedFileName} already exists`)
    return
  }

  fs.writeFile(filePath, '', err => {
    if (err) {
      vscode.window.showErrorMessage(`Error creating file: ${err.message}`)
    } else {
      vscode.window.showTextDocument(fileUri)
    }
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

function pressKey(keyName: string) {
  switch (keyName.toLocaleLowerCase()) {
    case 'enter':
      System.simulateInput(0x0d)
      break
    case 'escape':
      System.simulateInput(0x1b)
      break
    case 'tab':
      System.simulateInput(0x09)
      break
    case 'right':
    case 'right arrow':
      System.simulateInput(0x27)
      break
    case 'up':
    case 'up arrow':
      System.simulateInput(0x26)
      break
  }
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
  const command = CommandMap[text as keyof typeof CommandMap]
  const func = functionMap[text]

  if (command) {
    vscode.commands.executeCommand(command)
  } else if (func) {
    func()
  }
}

async function deleteCurrentFile() {
  const currentFilePath = Util.getCurrentFilePath()

  if (!currentFilePath) {
    return
  }

  const fileName = path.parse(currentFilePath).base

  vscode.window
    .showInformationMessage(
      `Are you sure you want to delete ${fileName}?`,
      'Delete File',
      'Cancel'
    )
    .then(async response => {
      if (response === 'Delete File') {
        vscode.workspace.fs.delete(vscode.Uri.file(currentFilePath)).then(
          () => vscode.window.showInformationMessage(`${fileName} was deleted`),
          err => console.log(err)
        )
      }
    })

  // Wait for the notification to show
  await Util.wait(500)
  // Focus the notification so we can tab over to the confirm and cancel buttons
  vscode.commands.executeCommand('notifications.focusToasts')
  // Wait for the notification to focus
  await Util.wait(500)

  // After the notification is tabbed to and focused, pressing enter
  // will confirm the dialog while pressing escape will close it
  pressKey('tab')
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

    if (intent.id === 'Voice.Positioning' && intent.lineNumber) {
      // The line number intent usually returns numbers as words,
      // instead, we have to extract the number from the text of the intent
      // if it contains a number
      const lineNumber = Util.parseNumberFromPhrase(intent.text)

      if (!Number.isNaN(lineNumber)) {
        moveCursor(lineNumber)
      }
    }

    if (intent.id === 'Voice.InsertComment.LineNumber' && intent.lineNumber) {
      const lineNumber = Util.parseNumberFromPhrase(intent.text)

      if (!Number.isNaN(lineNumber)) {
        moveCursor(lineNumber)
        vscode.commands.executeCommand(CommandMap.comment)
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

    if (intent.keyName) {
      pressKey(intent.keyName)
    }
  })
}

export { handleTextResult, handleIntentMatches }
