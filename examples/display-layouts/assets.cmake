find_package(Python3 REQUIRED COMPONENTS Interpreter)
set(LAYOUT_ROOT "${CMAKE_CURRENT_LIST_DIR}")
set(LAYOUT_ASSET_SOURCE "${CMAKE_CURRENT_BINARY_DIR}/layout_assets.c")
set(LAYOUT_BINARIES)
foreach(concept watch big grid swing ledger)
    list(APPEND LAYOUT_BINARIES "${LAYOUT_ROOT}/assets/${concept}.bin")
endforeach()
add_custom_command(
    OUTPUT "${LAYOUT_ASSET_SOURCE}"
    COMMAND "${Python3_EXECUTABLE}" "${LAYOUT_ROOT}/tools/embed.py"
        "${LAYOUT_ROOT}/assets" "${LAYOUT_ASSET_SOURCE}"
    DEPENDS "${LAYOUT_ROOT}/tools/embed.py" "${LAYOUT_ROOT}/assets/manifest.json"
        ${LAYOUT_BINARIES}
    VERBATIM
)
