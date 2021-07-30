#ifndef SYSTEM_H
#define SYSTEM_H

#include <napi.h>

class System : public Napi::ObjectWrap<System>
{
public:
    System(const Napi::CallbackInfo &info);
    static void Init(Napi::Env &env, Napi::Object &exports);
private:
    static void SimulateInput(const Napi::CallbackInfo &info);
};

#endif
