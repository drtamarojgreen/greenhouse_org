#ifndef STATUS_H
#define STATUS_H

#include <string>

namespace Movie {
    enum class StatusCode {
        OK = 0,
        ERROR = 1,
        INVALID_ARGUMENT = 2,
        NOT_FOUND = 3,
        ALREADY_EXISTS = 4,
        PERMISSION_DENIED = 5,
        RESOURCE_EXHAUSTED = 6,
        INTERNAL_ERROR = 7,
        UNIMPLEMENTED = 8
    };

    struct Status {
        StatusCode code;
        std::string message;

        static Status OK() { return {StatusCode::OK, ""}; }
        bool ok() const { return code == StatusCode::OK; }
    };
}

#endif
