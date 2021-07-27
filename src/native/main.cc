#include <napi.h>
#include "functions.h"
#include "voice_recognizer.h"

Napi::Object InitAll(Napi::Env env, Napi::Object exports)
{
    Napi::Object obj = Napi::Object::New(env);

    Functions::Init(env, obj);
    VoiceRecognizer::Init(env, obj);

    exports.Set("Native", obj);
    return exports;
}

NODE_API_MODULE(addon, InitAll)
