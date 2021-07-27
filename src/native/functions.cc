#include <napi.h>
#include "functions.h"

void Functions::ExecuteCallback(const Napi::CallbackInfo &info)
{
    Napi::Env env = info.Env();
    Napi::Function callback = info[0].As<Napi::Function>();
    Napi::Object callbackData = Napi::Object::New(env);
    callbackData.Set("success", true);

    callback.Call({ callbackData });
}

Napi::String Functions::Greet(const Napi::CallbackInfo &info)
{
    Napi::Env env = info.Env();
    if (info.Length() != 1 || !info[0].IsString())
    {
        Napi::TypeError::New(env, "Argument must be of type string").ThrowAsJavaScriptException();
        return Napi::String::New(env,  "");
    }

    Napi::String name = info[0].As<Napi::String>();

    return Napi::String::New(env, "Hello, " + name.Utf8Value() + "!");
}

void Functions::Init(Napi::Env &env, Napi::Object& exports)
{
    exports.Set("greet", Napi::Function::New(env, Greet));
    exports.Set("executeCallback", Napi::Function::New(env, ExecuteCallback));
}
