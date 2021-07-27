import * as vscode from 'vscode'
import * as Commanding from './commanding'

import Native from './lib/binding'

let hasDictationStarted = false
const voiceRecognizer = new Native.VoiceRecognizer({
  key: process.env.SUBSCRIPTION_KEY || '',
  region: process.env.REGION || '',
})

const toggleDictation = () => {
  if (!hasDictationStarted) {
    vscode.window.showInformationMessage(
      'Dictation session started. Speak into the microphone'
    )
    voiceRecognizer.startRecognition()
  } else {
    vscode.window.showInformationMessage('Dictation session ended')
    voiceRecognizer.stopRecognition()
  }
  hasDictationStarted = !hasDictationStarted
}

voiceRecognizer.addPhrase('on line')

voiceRecognizer.addIntent('Create new file {fileName}', 'Voice.CreateFile')

voiceRecognizer.addIntent('Add {numNewLines} new line', 'Voice.InsertNewLine')
voiceRecognizer.addIntent('Add {numNewLines} new lines', 'Voice.InsertNewLine')

voiceRecognizer.addIntent('Toggle break point line {breakpointLine}', 'Voice.Debugging')
voiceRecognizer.addIntent('Toggle breakpoint line {breakpointLine}', 'Voice.Debugging')
voiceRecognizer.addIntent('Toggle break point on line {breakpointLine}', 'Voice.Debugging')
voiceRecognizer.addIntent('Toggle breakpoint on line {breakpointLine}', 'Voice.Debugging')

voiceRecognizer.addIntent('Insert text {textInsertion}', 'Voice.InsertText')
voiceRecognizer.addIntent('Insert comment {textInsertion}', 'Voice.InsertComment')

voiceRecognizer.addIntent('{terminalPhrase} in terminal', 'Voice.Terminal')

voiceRecognizer.addIntent('Move cursor to line {lineNumber}', 'Voice.Positioning')
voiceRecognizer.addIntent('Go to line {lineNumber}', 'Voice.Positioning')
voiceRecognizer.addIntent('Show message {dialogText}', 'Voice.Dialog')

voiceRecognizer.onRecognized(result => {
  if (result.text) {
    Commanding.handleResultText(result.text.toLocaleLowerCase().replace('.', ''))
  }

  if (result.intentMatches.length > 0) {
    console.log(result)
    Commanding.handleIntentMatches(result.intentMatches)
  }
})

export function activate(context: vscode.ExtensionContext) {
  vscode.window.showInformationMessage("Extension loaded")

  context.subscriptions.push(
    vscode.commands.registerCommand('voice-commanding.toggleDictation', toggleDictation)
  )
}

export function deactivate() {}
