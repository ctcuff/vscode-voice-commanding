#include <iostream>
// https://stackoverflow.com/a/22419083
// Because the SendInput function is only supported in
// Windows 2000 and later, WINVER needs to be set as
// follows so that SendInput gets defined when windows.h
// is included below.
#define WINVER 0x0500
#include <windows.h>
#include <WinUser.h>
#include "system.h"

System::System(const Napi::CallbackInfo &info) : Napi::ObjectWrap<System>(info)
{
    Napi::TypeError::New(info.Env(), "Cannot instantiate private constructor").ThrowAsJavaScriptException();
}

void System::SimulateInput(const Napi::CallbackInfo &info)
{
    Napi::Env env = info.Env();

    if (info.Length() < 1 || !info[0].IsNumber())
    {
        Napi::Error::New(env, "Argument keyCode must be of type number").ThrowAsJavaScriptException();
        return;
    }

    int keyCode = (int)info[0].As<Napi::Number>().Int32Value();
    INPUT input;

    input.type = INPUT_KEYBOARD;
    input.ki.wScan = 0;
    input.ki.time = 0;
    input.ki.dwExtraInfo = 0;

    // Virtual code of the key
    input.ki.wVk = keyCode;
    // Must be 0 in order to press the key
    input.ki.dwFlags = 0;
    SendInput(1, &input, sizeof(INPUT));
}

void System::Init(Napi::Env &env, Napi::Object &exports)
{
    Napi::Function func = DefineClass(
        env,
        "System",
        {
            StaticMethod<&System::SimulateInput>("simulateInput")
        }
    );

    exports.Set("System", func);
}
