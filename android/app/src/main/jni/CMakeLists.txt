cmake_minimum_required(VERSION 3.13)

# Define the library name here.
project(appmodules)

# Keep generated object paths below Windows' path-length ceiling when React Native
# codegen expands library source paths during release builds.
set(CMAKE_OBJECT_PATH_MAX 180)

# Ensure libc++ is linked for all targets (NDK 27 + RN 0.84 needs this).
set(CMAKE_ANDROID_STL_TYPE c++_shared)
set(CMAKE_CXX_STANDARD_LIBRARIES "-lc++_shared -latomic -lm")

# This file includes all the necessary to let you build your application with the New Architecture.
include(${REACT_ANDROID_DIR}/cmake-utils/ReactNative-application.cmake)
