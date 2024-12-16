#include <napi.h>
#include <vector>

std::vector<std::vector<int>> HandleMatrix(const std::vector<std::vector<int>>& a, const std::vector<std::vector<int>>& b, int s, int e, int l) {
    std::vector<std::vector<int>> result(e - s, std::vector<int>(l));

    for (int y = s; y < e; ++y) {
        for (int x = 0; x < l; ++x) {
            int sum = 0;
            for (int i = 0; i < l; ++i) {
                sum += a[y][i] * b[i][x];
            }
            result[y - s][x] = sum;
        }
    }

    return result;
}

Napi::Array Handle(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    auto a = info[0].As<Napi::Array>();
    auto b = info[1].As<Napi::Array>();
    int s = info[2].As<Napi::Number>().Int32Value();
    int e = info[3].As<Napi::Number>().Int32Value();
    int l = info[4].As<Napi::Number>().Int32Value();

    std::vector<std::vector<int>> aVec(a.Length(), std::vector<int>(l));
    std::vector<std::vector<int>> bVec(b.Length(), std::vector<int>(l));
    for (size_t i = 0; i < a.Length(); i++) {
        Napi::Array row = a.Get(i).As<Napi::Array>();
        for (size_t j = 0; j < row.Length(); j++) {
            aVec[i][j] = row.Get(j).As<Napi::Number>().Int32Value();
        }
    }
    for (size_t i = 0; i < b.Length(); i++) {
        Napi::Array row = b.Get(i).As<Napi::Array>();
        for (size_t j = 0; j < row.Length(); j++) {
            bVec[i][j] = row.Get(j).As<Napi::Number>().Int32Value();
        }
    }

    // Calculate
    auto resultVec = HandleMatrix(aVec, bVec, s, e, l);

    Napi::Array result = Napi::Array::New(env, resultVec.size());
    for (size_t i = 0; i < resultVec.size(); i++) {
        Napi::Array row = Napi::Array::New(env, resultVec[i].size());
        for (size_t j = 0; j < resultVec[i].size(); j++) {
            row.Set(j, Napi::Number::New(env, resultVec[i][j]));
        }
        result.Set(i, row);
    }

    return result;
}

// Export to JS
Napi::Object Init(Napi::Env env, Napi::Object exports) {
    exports.Set(Napi::String::New(env, "handle"), Napi::Function::New(env, Handle));
    return exports;
}

NODE_API_MODULE(taik_kepet, Init)
