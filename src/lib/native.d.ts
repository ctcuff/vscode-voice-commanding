declare namespace Native {
  export interface Intent {
    [intentName: string]: string
    id: string
    text: string
  }

  export interface OnRecognizingCallbackArgs {
    text: string
  }

  export interface OnRecognizedCallbackArgs {
    text: string
    intentMatches: Intent[]
  }

  export interface IntentRecognizerOptions {
    key: string
    region: string
  }

  export class IntentRecognizer {
    readonly hasSessionStarted: boolean

    constructor(options: IntentRecognizerOptions)

    addIntent(phrase: string, intentId: string): void
    addPhrase(phrase: string): void
    startContinuousRecognition(): void
    stopContinuousRecognition(): void
    onStarted(callback: (sessionId: string) => void): void
    onStopped(callback: (sessionId: string) => void): void
    onRecognizing(callback: (result: OnRecognizingCallbackArgs) => void): void
    onRecognized(callback: (result: OnRecognizedCallbackArgs) => void): void
    onCancelled(callback: (errorDetails: string) => void): void
  }

  export class System {
    private constructor()
    /**
     * See {@link https://docs.microsoft.com/en-us/windows/win32/inputdev/virtual-key-codes Virtual-Key Codes documentation}
     * for a list of acceptable key codes
     */
    static simulateInput(keyCode: number): void
  }
}

export default Native
