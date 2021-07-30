#include <iostream>
#include <map>
#include <string>
#include <exception>
#include "voice_recognizer.h"

using namespace Microsoft::CognitiveServices::Speech;
using namespace Microsoft::CognitiveServices::Speech::Intent;

VoiceRecognizer::~VoiceRecognizer()
{
    if (m_intentRecognizer)
    {
        m_intentRecognizer->StopContinuousRecognitionAsync();
    }
}

VoiceRecognizer::VoiceRecognizer(const Napi::CallbackInfo &info) : Napi::ObjectWrap<VoiceRecognizer>(info)
{
    Napi::Env env = info.Env();

    if (info.Length() < 1 || !info[0].IsObject())
    {
        Napi::Error::New(env, "A config object containing a key and region is required").ThrowAsJavaScriptException();
        return;
    }

    Napi::Object args = info[0].As<Napi::Object>();
    
    if (!args.Has("key"))
    {
        Napi::Error::New(env, "key argument missing from config").ThrowAsJavaScriptException();
        return;
    }

    if (!args.Has("region"))
    {
        Napi::Error::New(env, "region argument missing from config").ThrowAsJavaScriptException();
        return;
    }

    std::string key = args.Get("key").As<Napi::String>().Utf8Value();
    std::string region = args.Get("region").As<Napi::String>().Utf8Value();

    if (key.empty() || region.empty())
    {
        Napi::Error::New(env, "key and region must be non-empty strings").ThrowAsJavaScriptException();
        return;
    }

    this->InitIntentRecognizer(key, region);
}

void VoiceRecognizer::InitIntentRecognizer(std::string &key, std::string &region)
{
    std::shared_ptr<SpeechConfig> speechConfig = SpeechConfig::FromSubscription(key, region);

    m_intentRecognizer = IntentRecognizer::FromConfig(speechConfig);
    m_phraseList = PhraseListGrammar::FromRecognizer(m_intentRecognizer);

    m_intentRecognizer->SessionStarted.Connect([this](const SessionEventArgs &event)
    {
        m_hasStarted = true;
        std::string sessionId = event.SessionId;

        m_onStartedCallback->call([sessionId](Napi::Env env, std::vector<napi_value> &args)
        {
            args = { Napi::String::New(env, sessionId) };
        });
    });

    m_intentRecognizer->SessionStopped.Connect([this](const SessionEventArgs &event)
    {
        m_hasStarted = false;
        std::string sessionId = event.SessionId;

        if (m_onStoppedCallback)
        {
            m_onStoppedCallback->call([sessionId](Napi::Env env, std::vector<napi_value> &args)
            {
                args = { Napi::String::New(env, sessionId) };
            });
        }
    });

    m_intentRecognizer->Canceled.Connect([this](const IntentRecognitionCanceledEventArgs &event)
    {
        m_hasStarted = false;
        std::string errorDetails = event.ErrorDetails;

        if (m_onSessionCancelledCallback)
        {
            m_onSessionCancelledCallback->call([errorDetails](Napi::Env env, std::vector<napi_value>& args)
            {
                args = { Napi::String::New(env, errorDetails) };
            });
        }
    });

    m_intentRecognizer->Recognizing.Connect([this](const IntentRecognitionEventArgs &event)
    {
        std::string text = event.Result->Text;
        std::cout << "Partial recognition: " << text << std::endl;
    });

    m_intentRecognizer->Recognized.Connect([this](const IntentRecognitionEventArgs &event)
    {
        std::string text = event.Result->Text;
        std::string intentId = event.Result->IntentId;
        std::map<std::string, std::string> entities = event.Result->GetEntities();
    
        try
        {
            m_onRecognizedCallback->call([text, intentId, entities](Napi::Env env, std::vector<napi_value>& args)
            {
                Napi::Object callbackData = Napi::Object::New(env);
                Napi::Array intentMatches = Napi::Array::New(env, entities.size());
                callbackData.Set("text", text);

                int i = 0;
                for (auto &pair : entities)
                {
                    Napi::Object obj = Napi::Object::New(env);
                    obj.Set(pair.first, pair.second);
                    obj.Set("id", intentId);
                    obj.Set("text", text);
                    intentMatches[i++] = obj;
                }

                callbackData.Set("intentMatches", intentMatches);

                args = { callbackData };
            });
        } catch (std::exception &e)
        {
            std::cout << "Error invoking recognized callback: " << e.what() << std::endl;
        }
    });
}

void VoiceRecognizer::AddIntent(const Napi::CallbackInfo &info)
{
    Napi::Env env = info.Env();
    if (info.Length() < 2)
    {
        Napi::TypeError::New(env, "Arguments must be of type string").ThrowAsJavaScriptException();
        return;
    }

    if (!info[0].IsString() || !info[1].IsString())
    {
        Napi::TypeError::New(env, "phrase and intentId must be of type string").ThrowAsJavaScriptException();
        return;
    }

    std::string phrase = info[0].As<Napi::String>().Utf8Value();
    std::string intentId = info[1].As<Napi::String>().Utf8Value();

    m_intentRecognizer->AddIntent(phrase, intentId);
}

void VoiceRecognizer::AddPhrase(const Napi::CallbackInfo &info)
{
    Napi::Env env = info.Env();

    if (info.Length() < 1)
    {
        Napi::TypeError::New(env, "phrase argument is require").ThrowAsJavaScriptException();
        return;
    }

    if (!info[0].IsString())
    {
        Napi::TypeError::New(env, "phrase must be of type string").ThrowAsJavaScriptException();
        return;
    }

    std::string phrase = info[0].As<Napi::String>().Utf8Value();
    m_phraseList->AddPhrase(phrase);
}

void VoiceRecognizer::StartContinuousRecognition(const Napi::CallbackInfo &info)
{
    m_intentRecognizer->StartContinuousRecognitionAsync();
}

void VoiceRecognizer::StopContinuousRecognition(const Napi::CallbackInfo &info)
{
    m_intentRecognizer->StopContinuousRecognitionAsync();
}

void VoiceRecognizer::SetOnStartedCallback(const Napi::CallbackInfo &info)
{
    Napi::Function callback = info[0].As<Napi::Function>();
    m_onStartedCallback = std::make_shared<ThreadSafeCallback>(callback);
}

void VoiceRecognizer::SetOnStoppedCallback(const Napi::CallbackInfo &info)
{
    Napi::Function callback = info[0].As<Napi::Function>();
    m_onStoppedCallback = std::make_shared<ThreadSafeCallback>(callback);
}

void VoiceRecognizer::SetRecognizingCallback(const Napi::CallbackInfo &info)
{
    Napi::Function callback = info[0].As<Napi::Function>();
    m_onRecognizingCallback = std::make_shared<ThreadSafeCallback>(callback);
}

void VoiceRecognizer::SetRecognizedCallback(const Napi::CallbackInfo &info)
{
    Napi::Function callback = info[0].As<Napi::Function>();
    m_onRecognizedCallback = std::make_shared<ThreadSafeCallback>(callback);
}

void VoiceRecognizer::SetSessionCancelledCallback(const Napi::CallbackInfo &info)
{
    Napi::Function callback = info[0].As<Napi::Function>();
    m_onSessionCancelledCallback = std::make_shared<ThreadSafeCallback>(callback);
}

Napi::Value VoiceRecognizer::GetHasStarted(const Napi::CallbackInfo &info)
{
    return Napi::Boolean::New(info.Env(), m_hasStarted);
}

void VoiceRecognizer::Init(Napi::Env &env, Napi::Object &exports)
{
    Napi::Function func = DefineClass(
        env,
        "IntentRecognizer",
        {
            InstanceMethod<&VoiceRecognizer::AddIntent>("addIntent"),
            InstanceMethod<&VoiceRecognizer::AddPhrase>("addPhrase"),
            InstanceMethod<&VoiceRecognizer::StartContinuousRecognition>("startContinuousRecognition"),
            InstanceMethod<&VoiceRecognizer::StopContinuousRecognition>("stopContinuousRecognition"),
            InstanceMethod<&VoiceRecognizer::SetOnStartedCallback>("onStarted"),
            InstanceMethod<&VoiceRecognizer::SetOnStoppedCallback>("onStopped"),
            InstanceMethod<&VoiceRecognizer::SetRecognizingCallback>("onRecognizing"),
            InstanceMethod<&VoiceRecognizer::SetRecognizedCallback>("onRecognized"),
            InstanceMethod<&VoiceRecognizer::SetSessionCancelledCallback>("onCancelled"),
            InstanceAccessor<&VoiceRecognizer::GetHasStarted>("hasSessionStarted")
        }
    );

    // TODO: Probably don't need this
    Napi::FunctionReference* constructor = new Napi::FunctionReference();
    *constructor = Napi::Persistent(func);

    env.SetInstanceData(constructor);
    exports.Set("IntentRecognizer", func);
}
