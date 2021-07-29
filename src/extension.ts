import * as vscode from 'vscode'
import * as Commanding from './commanding'
import Native from './lib/native'

const intentRecognizer = new Native.IntentRecognizer({
  key: process.env.SUBSCRIPTION_KEY || '',
  region: process.env.REGION || ''
})

const toggleDictation = () => {
  if (!intentRecognizer.hasSessionStarted) {
    intentRecognizer.startContinuousRecognition()
  } else {
    intentRecognizer.stopContinuousRecognition()
  }
}

intentRecognizer.addPhrase('on line')

intentRecognizer.addIntent('Create file {fileName}', 'Voice.CreateFile')
intentRecognizer.addIntent('Create new file {fileName}', 'Voice.CreateFile')
intentRecognizer.addIntent('New file {fileName}', 'Voice.CreateFile')

intentRecognizer.addIntent('Add {numNewLines} new line', 'Voice.InsertNewLine')
intentRecognizer.addIntent('Add {numNewLines} new lines', 'Voice.InsertNewLine')

intentRecognizer.addIntent('Toggle break point line {breakpointLine}', 'Voice.Debugging')
intentRecognizer.addIntent('Toggle breakpoint line {breakpointLine}', 'Voice.Debugging')
intentRecognizer.addIntent(
  'Toggle break point on line {breakpointLine}',
  'Voice.Debugging'
)
intentRecognizer.addIntent(
  'Toggle breakpoint on line {breakpointLine}',
  'Voice.Debugging'
)
intentRecognizer.addIntent('Breakpoint line {breakpointLine}', 'Voice.Debugging')
intentRecognizer.addIntent('Break point line {breakpointLine}', 'Voice.Debugging')

intentRecognizer.addIntent('Insert text {textInsertion}', 'Voice.InsertText')
intentRecognizer.addIntent('Insert comment {textInsertion}', 'Voice.InsertComment')

intentRecognizer.addIntent('{terminalPhrase} in terminal', 'Voice.Terminal')

intentRecognizer.addIntent('Move cursor to line {lineNumber}', 'Voice.Positioning')
intentRecognizer.addIntent('Go to line {lineNumber}', 'Voice.Positioning')
intentRecognizer.addIntent('Cursor line {lineNumber}', 'Voice.Positioning')

intentRecognizer.addIntent('Show message {dialogText}', 'Voice.Dialog')

intentRecognizer.onRecognized(result => {
  if (result.text) {
    Commanding.handleTextResult(result.text.toLocaleLowerCase().replace('.', ''))
  }

  if (result.intentMatches.length > 0) {
    console.log(result)
    Commanding.handleIntentMatches(result.intentMatches)
  }
})

intentRecognizer.onStarted(sessionId => {
  console.log(`Session started (ID: ${sessionId})`)
  vscode.window.showInformationMessage(
    'Dictation session started, speak into your microphone'
  )
})

intentRecognizer.onStopped(sessionId => {
  console.log(`Session stopped (ID: ${sessionId})`)
  vscode.window.showInformationMessage('Dictation session ended')
})

export function activate(context: vscode.ExtensionContext) {
  console.log('Extension activated')

  context.subscriptions.push(
    vscode.commands.registerCommand('voice-commanding.toggleDictation', toggleDictation)
  )
}

export function deactivate() {
  if (intentRecognizer.hasSessionStarted) {
    intentRecognizer.stopContinuousRecognition()
  }
}
