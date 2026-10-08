
/**
 * Helper للتعامل مع المسارات النسبية على GitHub Pages
 */
(function(global) {
    'use strict';

    function getBasePath() {
        const path = window.location.pathname;
        
        // GitHub Pages: /repo-name/...
        const segments = path.split('/').filter(Boolean);
        
        // إذا كان المسار /repo/legal/eula.html
        if (segments[0]) {
            // احذف آخر segment (الملف)
            const lastSegment = segments[segments.length - 1];
            
            if (lastSegment.includes('.')) {
                // الملف الحالي — احذفه
                segments.pop();
            }
            
            // أول segment هو اسم المستودع
            return '/' + segments[0] + '/';
        }
        
        return '/';
    }

    function url(path) {
        const base = getBasePath();
        const cleanPath = String(path || '').replace(/^\/+/, '');
        return base + cleanPath;
    }

    function go(path) {
        window.location.href = url(path);
    }

    global.BasePath = {
        getBasePath: getBasePath,
        url: url,
        go: go,
    };
})(window);
