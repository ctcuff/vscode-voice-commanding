#ifndef SPEECH_RECOGNIZER_H
#define SPEECH_RECOGNIZER_H

#include <memory>
#include <speechapi_cxx.h>
#include <napi.h>
#include <napi-thread-safe-callback.hpp>

using namespace Microsoft::CognitiveServices::Speech;
using namespace Microsoft::CognitiveServices::Speech::Intent;

class VoiceRecognizer : public Napi::ObjectWrap<VoiceRecognizer>
{
public:
    VoiceRecognizer(const Napi::CallbackInfo &info);
    ~VoiceRecognizer();
    static void Init(Napi::Env &env, Napi::Object &exports);

private:
    void AddIntent(const Napi::CallbackInfo &info);
    void AddPhrase(const Napi::CallbackInfo &info);
    void StartRecognition(const Napi::CallbackInfo &info);
    void StopRecognition(const Napi::CallbackInfo &info);
    void SetRecognizingCallback(const Napi::CallbackInfo &info);
    void SetRecognizedCallback(const Napi::CallbackInfo &info);

    std::shared_ptr<IntentRecognizer> m_intentRecognizer;
    std::shared_ptr<PhraseListGrammar> m_phraseList;
    std::shared_ptr<ThreadSafeCallback> m_onRecognizingCallback;
    std::shared_ptr<ThreadSafeCallback> m_onRecognizedCallback;
};

#endif
