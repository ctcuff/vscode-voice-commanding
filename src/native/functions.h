#ifndef FUNCTIONS_H
#define FUNCTIONS_H

#include <napi.h>

namespace Functions
{
    void ExecuteCallback(const Napi::CallbackInfo &info);
    Napi::String Greet(const Napi::CallbackInfo &info);
    void Init(Napi::Env &env, Napi::Object &exports);
}

#endif
