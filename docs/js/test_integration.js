import { hello } from 'backend/testModule';

$w.onReady(function () {
    hello()
        .then(message => console.log("Test Module Response:", message))
        .catch(error => console.error("Test Module Error:", error));
});