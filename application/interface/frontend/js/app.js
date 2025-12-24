// A simple router
const routes = {
    '/': 'login',
    '/dashboard': 'dashboard',
    '/patient-record': 'patientRecord',
    '/practitioner-dashboard': 'practitionerDashboard',
    '/model-review': 'modelReview',
    '/query-console': 'queryConsole',
    '/admin-console': 'adminConsole',
};

const rootDiv = document.getElementById('root');

const renderPage = async (page) => {
    const pageModule = await import(`./pages/${page}.js`);
    rootDiv.innerHTML = pageModule.default;
};

const router = () => {
    const path = window.location.hash.slice(1) || '/';
    const page = routes[path];
    if (page) {
        renderPage(page);
    } else {
        rootDiv.innerHTML = '<h2>404 - Page not found</h2>';
    }
};

window.addEventListener('hashchange', router);
window.addEventListener('load', router);
