# VS Code Voice Commanding

A _extremely_ experimental extension for VS Code that lets you execute a subset of the editor's commands with your voice using [Microsoft's Cognitive Service Speech SDK](https://docs.microsoft.com/en-us/azure/cognitive-services/speech-service/)

## Requirements
* VS Code version 1.58.2 (any other versions must be running electron version 12.0.13)
* x64 Windows OS
* [An Azure subscription key](https://docs.microsoft.com/en-us/azure/cognitive-services/speech-service/overview#find-keys-and-locationregion)
* [cmake](https://cmake.org/download/)
* [nuget](https://www.nuget.org/downloads)
* [yarn](https://classic.yarnpkg.com/en/docs/install/#windows-stable)

## Building
Before building, you'll need to create an `env` file in the root directory that looks like this:

```properties
SUBSCRIPTION_KEY=your-azure-subscription-key-here
REGION=the-region-used-in-your-azure-account
```

To build and run the extension, execute the following commands:
* `yarn` - Install dependencies
* `yarn native:configure` - Configure C++ build
* `yarn compile:all` - Build C++ code and compile TS code
* `F5` - Start the extension

In order to activate dictation, you'll need to have at least one file open. You should see a microphone icon at the top right of the editor. To get a sense of what commands and phrases you can say, take a look at [command-map.ts](/src/command-map.ts) and [commanding.ts](/src/commanding.ts)
