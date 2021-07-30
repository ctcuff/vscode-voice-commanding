cmake_minimum_required(VERSION 3.9)
cmake_policy(SET CMP0042 NEW)
set (CMAKE_CXX_STANDARD 11)

project(speech-native)

include_directories(${CMAKE_JS_INC})

set(PKG_ROOT ${CMAKE_CURRENT_LIST_DIR}/pkgs)
set(TARGET_RESTORE RestorePackages)
set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -fno-exceptions")

find_program(NUGET nuget)

if(NOT NUGET)
    message(FATAL "Nuget is required to run this program")
else()
    execute_process(COMMAND
        ${NUGET} restore packages.config -PackagesDirectory ${PKG_ROOT}
        WORKING_DIRECTORY ${CMAKE_CURRENT_SOURCE_DIR}
    )
endif()

set(SOURCES
    src/native/main.cc
    src/native/voice_recognizer.cc
    src/native/system.cc
)
set(MICROSOFT_COGNITIVE_SERVICES_DIR ${PKG_ROOT}/Microsoft.CognitiveServices.Speech.1.18.0)

add_library(${PROJECT_NAME} SHARED ${SOURCES} ${CMAKE_JS_SRC})

set_target_properties(${PROJECT_NAME} PROPERTIES PREFIX "" SUFFIX ".node")

target_link_libraries(${PROJECT_NAME}
    ${CMAKE_JS_LIB}
    ${MICROSOFT_COGNITIVE_SERVICES_DIR}/build/native/x64/Release/Microsoft.CognitiveServices.Speech.core.lib
)

target_compile_features(${PROJECT_NAME} PUBLIC cxx_std_17)

# Include Node-API wrappers
execute_process(COMMAND node -p "require('node-addon-api').include"
    WORKING_DIRECTORY ${CMAKE_SOURCE_DIR}
    OUTPUT_VARIABLE NODE_ADDON_API_DIR
)
string(REGEX REPLACE "[\r\n\"]" "" NODE_ADDON_API_DIR ${NODE_ADDON_API_DIR})

# Include thread safe extension headers
execute_process(COMMAND node -p "require('napi-thread-safe-callback').include"
    WORKING_DIRECTORY ${CMAKE_SOURCE_DIR}
    OUTPUT_VARIABLE NAPI_THREAD_SAFE_CALLBACK_DIR
)
string(REGEX REPLACE "[\r\n\"]" "" NAPI_THREAD_SAFE_CALLBACK_DIR ${NAPI_THREAD_SAFE_CALLBACK_DIR})
add_compile_definitions(_HAS_EXCEPTIONS=1)

target_include_directories(${PROJECT_NAME} PRIVATE
    ${NODE_ADDON_API_DIR}
    ${NAPI_THREAD_SAFE_CALLBACK_DIR}
    ${MICROSOFT_COGNITIVE_SERVICES_DIR}/build/native/include/c_api
    ${MICROSOFT_COGNITIVE_SERVICES_DIR}/build/native/include/cxx_api
)

# define NPI_VERSION
add_definitions(-DNAPI_VERSION=6)

# Copy all .dll files to the build directory
add_custom_command(TARGET ${PROJECT_NAME} POST_BUILD
    COMMAND ${CMAKE_COMMAND} -E copy_directory ${MICROSOFT_COGNITIVE_SERVICES_DIR}/runtimes/win-x64/native/ $<TARGET_FILE_DIR:${PROJECT_NAME}>
    # Copy the folder that contains the .node file to the lib directory.
    # This is because we can't reference files outside of the src folders in TypeScript
    COMMAND ${CMAKE_COMMAND} -E copy_directory ${CMAKE_CURRENT_LIST_DIR}/build/Release ${CMAKE_CURRENT_LIST_DIR}/src/lib/release
)
