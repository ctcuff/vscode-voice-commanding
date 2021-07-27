#include <iostream>
#include <map>
#include <string>
#include <exception>
#include "voice_recognizer.h"

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

    std::shared_ptr<SpeechConfig> speechConfig  = SpeechConfig::FromSubscription(
        args.Get("key").As<Napi::String>().Utf8Value(),
        args.Get("region").As<Napi::String>().Utf8Value()
    );

    m_intentRecognizer = IntentRecognizer::FromConfig(speechConfig);
    m_phraseList = PhraseListGrammar::FromRecognizer(m_intentRecognizer);

    m_intentRecognizer->SessionStarted.Connect([](const SessionEventArgs &event)
    {
        std::cout << "Session started (ID: " << event.SessionId << ")" << std::endl;
    });

    m_intentRecognizer->SessionStopped.Connect([](const SessionEventArgs &event)
    {
        std::cout << "Session stopped (ID: " << event.SessionId << ")" << std::endl;
    });

    m_intentRecognizer->Canceled.Connect([](const IntentRecognitionCanceledEventArgs &event)
    {
        std::cout << "Session cancelled" << std::endl;
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


void VoiceRecognizer::StartRecognition(const Napi::CallbackInfo &info)
{
    m_intentRecognizer->StartContinuousRecognitionAsync();
}

void VoiceRecognizer::StopRecognition(const Napi::CallbackInfo &info)
{
    m_intentRecognizer->StopContinuousRecognitionAsync();
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

void VoiceRecognizer::Init(Napi::Env &env, Napi::Object &exports)
{
    Napi::Function func = DefineClass(
        env,
        "VoiceRecognizer",
        {
            InstanceMethod<&VoiceRecognizer::AddIntent>("addIntent"),
            InstanceMethod<&VoiceRecognizer::AddPhrase>("addPhrase"),
            InstanceMethod<&VoiceRecognizer::StartRecognition>("startRecognition"),
            InstanceMethod<&VoiceRecognizer::StopRecognition>("stopRecognition"),
            InstanceMethod<&VoiceRecognizer::SetRecognizingCallback>("onRecognizing"),
            InstanceMethod<&VoiceRecognizer::SetRecognizedCallback>("onRecognized")
        }
    );

    // TODO: Probably don't need this
    Napi::FunctionReference* constructor = new Napi::FunctionReference();
    *constructor = Napi::Persistent(func);

    env.SetInstanceData(constructor);
    exports.Set("VoiceRecognizer", func);
}
