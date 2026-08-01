import axios from 'axios';

window.axios = axios;
window.axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

window.recaptchaSiteKey = '6Lcvg8krAAAAAEoghMGKFg4jZwQkh-vYfzzYMFcN';