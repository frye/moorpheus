cmake_minimum_required(VERSION 3.13)
project(display_layouts_tests C)
set(CMAKE_C_STANDARD 11)
set(CMAKE_C_STANDARD_REQUIRED ON)
enable_testing()

include(../assets.cmake)
add_library(layout_data STATIC ../layouts.c "${LAYOUT_ASSET_SOURCE}")
target_include_directories(layout_data PUBLIC .. ../../display-hello)
target_compile_options(layout_data PRIVATE -Wall -Wextra -Werror)

add_executable(layout_rows test_rows.c)
target_link_libraries(layout_rows PRIVATE layout_data)
add_test(NAME layout_rows COMMAND layout_rows)

add_executable(layout_driver test_driver.c ../../display-hello/epd.c)
target_link_libraries(layout_driver PRIVATE layout_data)
target_include_directories(layout_driver PRIVATE ../../display-hello/tests/fakes)
add_test(NAME layout_driver COMMAND layout_driver)

add_executable(layout_timer test_timer.c ../demo.c)
target_include_directories(layout_timer PRIVATE .. ../../display-hello
    ../../display-hello/tests/fakes)
add_test(NAME layout_timer COMMAND layout_timer)

foreach(target layout_rows layout_driver layout_timer)
    target_compile_options(${target} PRIVATE -Wall -Wextra -Werror -UNDEBUG)
endforeach()
