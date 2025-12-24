const loginPage = `
    <div>
        <h2>Login MFA</h2>
        <form>
            <label for="username">Username</label>
            <input type="text" id="username" name="username">
            <br>
            <label for="password">Password</label>
            <input type="password" id="password" name="password">
            <br>
            <button type="submit">Login</button>
        </form>
        <br>
        <form>
            <label for="mfa_code">MFA Code</label>
            <input type="text" id="mfa_code" name="mfa_code">
            <br>
            <button type="submit">Verify</button>
        </form>
    </div>
`;

export default loginPage;
