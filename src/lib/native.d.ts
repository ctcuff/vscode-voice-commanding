declare namespace Native {
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
    readonly hasSessionStarted: boolean

    addIntent(phrase: string, intentId: string): void
    addPhrase(phrase: string): void
    startRecognition(): void
    stopRecognition(): void
    onRecognizing(callback: (result: VoiceRecognizingCallbackArgs) => void): void
    onRecognized(callback: (result: VoiceRecognizedCallbackArgs) => void): void
  }
}

export default Native
