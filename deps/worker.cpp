#include <napi.h>
#include <vector>
#include <string>
#include <cmath>

typedef std::vector<std::vector<double>> MatrixD;

MatrixD Inverse(MatrixD m) {
    int n = m.size();
    MatrixD res(n, std::vector<double>(n, 0));
    for (int i = 0; i < n; i++) res[i][i] = 1;

    for (int i = 0; i < n; i++) {
        double pivot = m[i][i];
        if (std::abs(pivot) < 1e-9) continue; 
        for (int j = 0; j < n; j++) {
            m[i][j] /= pivot;
            res[i][j] /= pivot;
        }
        for (int k = 0; k < n; k++) {
            if (k != i) {
                double factor = m[k][i];
                for (int j = 0; j < n; j++) {
                    m[k][j] -= factor * m[i][j];
                    res[k][j] -= factor * res[i][j];
                }
            }
        }
    }
    return res;
}

Napi::Array Handle(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();

    auto aArr = info[0].As<Napi::Array>();
    auto bArr = info[1].As<Napi::Array>();
    int s = info[2].As<Napi::Number>().Int32Value();
    int e = info[3].As<Napi::Number>().Int32Value();
    int l = info[4].As<Napi::Number>().Int32Value();
    std::string op = "mul";
    if (info.Length() > 5) {
        op = info[5].As<Napi::String>().Utf8Value();
    }

    MatrixD aVec(aArr.Length(), std::vector<double>(l));
    MatrixD bVec(bArr.Length(), std::vector<double>(l));

    for (size_t i = 0; i < aArr.Length(); i++) {
        Napi::Array row = aArr.Get(i).As<Napi::Array>();
        for (size_t j = 0; j < row.Length(); j++) {
            aVec[i][j] = row.Get(j).As<Napi::Number>().DoubleValue();
        }
    }
    for (size_t i = 0; i < bArr.Length(); i++) {
        Napi::Array row = bArr.Get(i).As<Napi::Array>();
        for (size_t j = 0; j < row.Length(); j++) {
            bVec[i][j] = row.Get(j).As<Napi::Number>().DoubleValue();
        }
    }

    MatrixD resultVec;
    if (op == "mul") {
        resultVec.assign(e - s, std::vector<double>(l));
        for (int y = s; y < e; ++y) {
            for (int x = 0; x < l; ++x) {
                double sum = 0;
                for (int i = 0; i < l; ++i) {
                    sum += aVec[y][i] * bVec[i][x];
                }
                resultVec[y - s][x] = sum;
            }
        }
    } else if (op == "add") {
        resultVec.assign(e - s, std::vector<double>(l));
        for (int y = s; y < e; ++y) {
            for (int x = 0; x < l; ++x) {
                resultVec[y - s][x] = aVec[y][x] + bVec[y][x];
            }
        }
    } else if (op == "sub") {
        resultVec.assign(e - s, std::vector<double>(l));
        for (int y = s; y < e; ++y) {
            for (int x = 0; x < l; ++x) {
                resultVec[y - s][x] = aVec[y][x] - bVec[y][x];
            }
        }
    } else if (op == "trans") {
        resultVec.assign(e - s, std::vector<double>(l));
        for (int y = s; y < e; ++y) {
            for (int x = 0; x < l; ++x) {
                resultVec[y - s][x] = aVec[x][y];
            }
        }
    } else if (op == "inv") {
        MatrixD invA = Inverse(aVec);
        resultVec.assign(e - s, std::vector<double>(l));
        for (int y = s; y < e; ++y) {
            for (int x = 0; x < l; ++x) {
                resultVec[y - s][x] = invA[y][x];
            }
        }
    }

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

Napi::Object Init(Napi::Env env, Napi::Object exports) {
    exports.Set(Napi::String::New(env, "handle"), Napi::Function::New(env, Handle));
    return exports;
}

NODE_API_MODULE(handle, Init)
