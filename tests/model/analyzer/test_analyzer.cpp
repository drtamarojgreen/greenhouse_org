#include "analyzer_queue.hpp"
#include "filter_manager.hpp"
#include "rpc_protocol.hpp"
#include "error_wrapper.hpp"
#include <cassert>
#include <cstring>
#include <iostream>
#include <thread>
#include <chrono>

using namespace rma;

void test_queue() {
    std::cout << "Testing AnalyzerQueue..." << std::endl;
    AnalyzerQueue queue(10);

    ErrorWrapper<int> err1(ErrorType::LOGIC_BUG, 42, "test.cpp", 10, "Test error 1");
    queue.enqueue(err1);

    assert(queue.size() == 1);

    ErrorNodeBase* node = queue.dequeue(std::chrono::milliseconds(10));
    assert(node != nullptr);
    assert(node->get_type() == ErrorType::LOGIC_BUG);
    assert(node->get_source_line() == 10);

    delete node;
    assert(queue.size() == 0);
    std::cout << "AnalyzerQueue tests passed!" << std::endl;
}

void test_filter_manager() {
    std::cout << "Testing FilterManager..." << std::endl;
    FilterManager filters;

    assert(filters.shouldDisplay(ErrorType::LOGIC_BUG) == true);

    filters.disable(ErrorType::LOGIC_BUG);
    assert(filters.shouldDisplay(ErrorType::LOGIC_BUG) == false);

    filters.enable(ErrorType::LOGIC_BUG);
    assert(filters.shouldDisplay(ErrorType::LOGIC_BUG) == true);

    char key = error_type_key(ErrorType::OUT_OF_BOUNDS);
    filters.toggle(key);
    assert(filters.shouldDisplay(ErrorType::OUT_OF_BOUNDS) == false);

    std::cout << "FilterManager tests passed!" << std::endl;
}

void test_rpc_protocol() {
    std::cout << "Testing RpcProtocol..." << std::endl;
    RpcProtocol host_rpc;
    RpcProtocol analyzer_rpc;

    uint32_t session_id = 1234;

    bool host_ok = host_rpc.init_host(session_id);
    assert(host_ok == true);

    bool analyzer_ok = analyzer_rpc.init_analyzer(session_id);
    assert(analyzer_ok == true);

    const char* test_msg = "Hello RPC";
    size_t msg_len = std::strlen(test_msg) + 1;
    bool sent = host_rpc.send(reinterpret_cast<const uint8_t*>(test_msg), msg_len, 1);
    assert(sent == true);

    uint8_t buffer[1024];
    uint32_t type_id = 0;
    size_t received = analyzer_rpc.receive(buffer, sizeof(buffer), &type_id);

    assert(received == msg_len);
    assert(type_id == 1);
    assert(std::strcmp(reinterpret_cast<const char*>(buffer), test_msg) == 0);

    std::cout << "RpcProtocol tests passed!" << std::endl;
}

int main() {
    try {
        test_queue();
        test_filter_manager();
        test_rpc_protocol();
        std::cout << "All analyzer unit tests passed successfully!" << std::endl;
    } catch (const std::exception& e) {
        std::cerr << "Test failed with exception: " << e.what() << std::endl;
        return 1;
    }
    return 0;
}
