import numpy as np

class SimpleAutoencoder:
    def __init__(self, input_dim, hidden_dim, learning_rate=0.01):
        self.input_dim = input_dim
        self.hidden_dim = hidden_dim
        self.lr = learning_rate

        # Xavier initialization
        self.W1 = np.random.randn(input_dim, hidden_dim) * np.sqrt(1. / input_dim)
        self.b1 = np.zeros((1, hidden_dim))
        self.W2 = np.random.randn(hidden_dim, input_dim) * np.sqrt(1. / hidden_dim)
        self.b2 = np.zeros((1, input_dim))

    def sigmoid(self, x):
        return 1 / (1 + np.exp(-x))

    def sigmoid_derivative(self, x):
        return x * (1 - x)

    def train(self, X, epochs=100, batch_size=32):
        for epoch in range(epochs):
            # Shuffle
            indices = np.arange(X.shape[0])
            np.random.shuffle(indices)
            X = X[indices]

            for i in range(0, X.shape[0], batch_size):
                batch = X[i:i+batch_size]

                # Forward
                hidden = self.sigmoid(np.dot(batch, self.W1) + self.b1)
                output = self.sigmoid(np.dot(hidden, self.W2) + self.b2)

                # Backward (MSE loss)
                error = output - batch
                d_output = error * self.sigmoid_derivative(output)

                error_hidden = np.dot(d_output, self.W2.T)
                d_hidden = error_hidden * self.sigmoid_derivative(hidden)

                # Update
                self.W2 -= self.lr * np.dot(hidden.T, d_output) / batch.shape[0]
                self.b2 -= self.lr * np.sum(d_output, axis=0, keepdims=True) / batch.shape[0]
                self.W1 -= self.lr * np.dot(batch.T, d_hidden) / batch.shape[0]
                self.b1 -= self.lr * np.sum(d_hidden, axis=0, keepdims=True) / batch.shape[0]

    def encode(self, X):
        return self.sigmoid(np.dot(X, self.W1) + self.b1)

class SimpleMLP:
    def __init__(self, input_dim, hidden_dim, output_dim, learning_rate=0.01):
        self.W1 = np.random.randn(input_dim, hidden_dim) * np.sqrt(1. / input_dim)
        self.b1 = np.zeros((1, hidden_dim))
        self.W2 = np.random.randn(hidden_dim, output_dim) * np.sqrt(1. / hidden_dim)
        self.b2 = np.zeros((1, output_dim))
        self.lr = learning_rate

    def sigmoid(self, x):
        return 1 / (1 + np.exp(-x))

    def train(self, X, y, epochs=100):
        # y should be one-hot encoded or similar
        for epoch in range(epochs):
            # Forward
            hidden = self.sigmoid(np.dot(X, self.W1) + self.b1)
            output = self.sigmoid(np.dot(hidden, self.W2) + self.b2)

            # Backward
            error = output - y
            d_output = error # Assuming sigmoid and cross-entropy or similar

            error_hidden = np.dot(d_output, self.W2.T)
            d_hidden = error_hidden * hidden * (1 - hidden)

            self.W2 -= self.lr * np.dot(hidden.T, d_output) / X.shape[0]
            self.b2 -= self.lr * np.sum(d_output, axis=0, keepdims=True) / X.shape[0]
            self.W1 -= self.lr * np.dot(X.T, d_hidden) / X.shape[0]
            self.b1 -= self.lr * np.sum(d_hidden, axis=0, keepdims=True) / X.shape[0]

    def predict(self, X):
        hidden = self.sigmoid(np.dot(X, self.W1) + self.b1)
        return self.sigmoid(np.dot(hidden, self.W2) + self.b2)
