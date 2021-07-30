#ifndef SPEECH_RECOGNIZER_H
#define SPEECH_RECOGNIZER_H

#include <memory>
#include <speechapi_cxx.h>
#include <napi.h>
#include <napi-thread-safe-callback.hpp>

class VoiceRecognizer : public Napi::ObjectWrap<VoiceRecognizer>
{
public:
    VoiceRecognizer(const Napi::CallbackInfo &info);
    ~VoiceRecognizer();
    static void Init(Napi::Env &env, Napi::Object &exports);

private:
    void AddIntent(const Napi::CallbackInfo &info);
    void AddPhrase(const Napi::CallbackInfo &info);
    void StartContinuousRecognition(const Napi::CallbackInfo &info);
    void StopContinuousRecognition(const Napi::CallbackInfo &info);
    void SetOnStartedCallback(const Napi::CallbackInfo &info);
    void SetOnStoppedCallback(const Napi::CallbackInfo &info);
    void SetRecognizingCallback(const Napi::CallbackInfo &info);
    void SetRecognizedCallback(const Napi::CallbackInfo &info);
    void SetSessionCancelledCallback(const Napi::CallbackInfo &info);
    void InitIntentRecognizer(std::string &key, std::string &region);
    Napi::Value GetHasStarted(const Napi::CallbackInfo &info);

    bool m_hasStarted = false;
    std::shared_ptr<Microsoft::CognitiveServices::Speech::Intent::IntentRecognizer> m_intentRecognizer;
    std::shared_ptr<Microsoft::CognitiveServices::Speech::PhraseListGrammar> m_phraseList;
    std::shared_ptr<ThreadSafeCallback> m_onStartedCallback;
    std::shared_ptr<ThreadSafeCallback> m_onStoppedCallback;
    std::shared_ptr<ThreadSafeCallback> m_onSessionCancelledCallback;
    std::shared_ptr<ThreadSafeCallback> m_onRecognizingCallback;
    std::shared_ptr<ThreadSafeCallback> m_onRecognizedCallback;
};

#endif
