declare namespace binding {
  // functions.cc
  export function greet(name: string): string
  export function executeCallback(callback: (result: { success: boolean }) => void): void

  // voice_recognizer.cc
  export interface Intent {
    [key: string]: string
    id: string
    text: string
  }

  export interface VoiceRecognizingCallbackArgs {
    text: string
  }

  export interface VoiceRecognizedCallbackArgs {
    text: string
    intentMatches: Intent[]
  }

  export interface VoiceRecognizerOptions {
    key: string
    region: string
  }

  export class VoiceRecognizer {
    constructor(options: VoiceRecognizerOptions)
    addIntent(phrase: string, intentId: string): void
    addPhrase(phrase: string): void
    startRecognition(): void
    stopRecognition(): void
    onRecognizing(callback: (result: VoiceRecognizingCallbackArgs) => void): void
    onRecognized(callback: (result: VoiceRecognizedCallbackArgs) => void): void
  }
}

export default binding
