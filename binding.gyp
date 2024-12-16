{
  "targets": [
    {
      "target_name": "handle",
      "sources": [ "deps/worker.cpp" ],
      "cflags": [ "-std=c++17" ],
      "cflags_cc": [ "-std=c++17" ],
      "include_dirs": [
        "<!@(node -p \"require('node-addon-api').include\")"
      ],
      "libraries": [],
      "defines": [
        "NODE_ADDON_API_DISABLE_CPP_EXCEPTIONS"
      ]
    }
  ]
}
