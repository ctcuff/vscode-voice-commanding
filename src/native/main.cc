#include <napi.h>
#include "voice_recognizer.h"

// Exports all C++ classess and functions under an object with
// the root key "Native". When imported in JS/TS, classess will
// be accessed as: const someClass = new Native.SomeClass()
Napi::Object InitAll(Napi::Env env, Napi::Object exports)
{
    Napi::Object obj = Napi::Object::New(env);

    VoiceRecognizer::Init(env, obj);

    exports.Set("Native", obj);
    return exports;
}

NODE_API_MODULE(addon, InitAll)
