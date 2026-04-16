export function CK(n, courseId, userId) {
    let key = `cachimboz_${n}`;
    if (courseId) key += `@${courseId}`;
    if (userId) key += `:${userId}`;
    return key;
}

const APP_KEY = 'cachimboz';

function K(key) {
    return `${APP_KEY}_${key}`;
}

export const Storage = {

    getFormData() {
        const raw = localStorage.getItem('formData');
        return raw
            ? JSON.parse(raw)
            : { Nombre: 'Cachimbo' };
    },
    saveFormData(data) {
        localStorage.setItem('formData', JSON.stringify(data));
    },
    getStreak(userId) {
        if (!userId) return 0;
        return Number(localStorage.getItem(`streak_${userId}`)) || 0;
    },
    setStreak(userId,value) {
        if (!userId) return;
        localStorage.setItem(`streak_${userId}`, value);
    },
    saveLastCourse(name, link) {
        localStorage.setItem(
            'lastCourse',
            JSON.stringify({ name, link })
        );
    },
    setLastCourse(name, link) {
        localStorage.setItem(
            "lastCourse",
            JSON.stringify({ name, link })
        );
    },

    getLastCourse() {
        const raw = localStorage.getItem("lastCourse");
        return raw ? JSON.parse(raw) : null;
    },

    /* =====================
   PREMIUM / ACCESS
===================== */

    getPremiumGlobal() {

        const exp = localStorage.getItem('premium_exp');

        if (!exp) return null;

        return {
            email: localStorage.getItem('premium_email'),
            plan: localStorage.getItem('premium_plan'),
            start: localStorage.getItem('premium_start'),
            exp: exp,
            token: localStorage.getItem('premium_token')
        };
    },


    setPremiumGlobal({ email, plan, start, vencimiento, token }) {

       

        if (email) localStorage.setItem('premium_email', email);

        if (plan) {
            localStorage.setItem(
                'premium_plan',
                Array.isArray(plan) ? plan.join(',') : String(plan)
            );
        }

        if (start) {
            localStorage.setItem('premium_start', start);
        }

        if (vencimiento) {
            localStorage.setItem('premium_exp', vencimiento);
        }

        if (token) {
            localStorage.setItem('premium_token', token);
        }
    },
    getCourseAccess() {
        const exp = localStorage.getItem('access_exp');
        return exp ? new Date(exp) : null;
    },

    setCourseAccess({ email, vencimiento }) {
        if (!vencimiento) return;

        localStorage.setItem('access_email', email || '');
        localStorage.setItem('access_exp', vencimiento);
    },

    hasAccess() {

        const premium = Storage.getPremiumGlobal();

        if (premium?.exp) {
            const expDate = new Date(premium.exp);
            if (expDate.getTime() >= Date.now()) return true;
        }

        const courseExp = Storage.getCourseAccess();

        if (courseExp && new Date(courseExp).getTime() >= Date.now()) {
            return true;
        }

        return false;
    },

    /* =========================
   CLASS STATE (CLASE.HTML)
========================= */

    getCompleted(courseId, userId) {
        const cid = courseId || Storage.getCurrentCourseId();
        const key = CK('comp', cid, userId);
        const fallback = CK('comp', cid);
        const raw = localStorage.getItem(key) || localStorage.getItem(fallback) || localStorage.getItem('comp');
        return new Set(JSON.parse(raw || '[]'));
    },

    saveCompleted(set, courseId, userId) {
        const cid = courseId || Storage.getCurrentCourseId();
        localStorage.setItem(CK('comp', cid, userId), JSON.stringify([...set]));
    },

    getCurrentCourseId() {
        const params = new URLSearchParams(window.location.search);
        return params.get('id') || 'global';
    },

    getFavorites(courseId, userId) {
        const cid = courseId || Storage.getCurrentCourseId();
        const key = CK('favs', cid, userId);
        const fallback = CK('favs', cid);
        // Use per-course favorites only; no global fallback to avoid cross-course carryover.
        const raw = localStorage.getItem(key) || localStorage.getItem(fallback);
        return raw ? new Set(JSON.parse(raw)) : new Set();
    },

    saveFavorites(set, courseId, userId) {
        const cid = courseId || Storage.getCurrentCourseId();
        localStorage.setItem(CK('favs', cid, userId), JSON.stringify([...set]));
    },

    getLastIndex(courseId, userId) {
        const cid = courseId || Storage.getCurrentCourseId();
        const key = CK('last', cid, userId);
        const fallback = CK('last', cid);
        const v = localStorage.getItem(key) || localStorage.getItem(fallback) || localStorage.getItem('last');
        return v !== null ? parseInt(v) : 0;
    },

    setLastIndex(idx, courseId, userId) {
        const cid = courseId || Storage.getCurrentCourseId();
        localStorage.setItem(CK('last', cid, userId), idx);
    },
    getQuizUsage(courseId, userId) {
        const cid = courseId || Storage.getCurrentCourseId();
        const key = CK('quiz_usage', cid, userId);
        const fallback = CK('quiz_usage', cid);
        const raw = localStorage.getItem(key) || localStorage.getItem(fallback) || localStorage.getItem(CK('quiz_usage'));
        return raw ? JSON.parse(raw) : {};
    },

    setQuizUsed(idx, usage, courseId, userId) {
        const cid = courseId || Storage.getCurrentCourseId();
        const key = CK('quiz_usage', cid, userId);
        usage[idx] = true;
        localStorage.setItem(key, JSON.stringify(usage));
    },

    saveQuizUsage(data) {
        localStorage.setItem('quiz_usage', JSON.stringify(data));
    },

    getCourseClicks(courseId, userId) {
        const cid = courseId || Storage.getCurrentCourseId();
        const key = CK('course_clicks', cid, userId);
        const fallback = CK('course_clicks', cid);
        const v = localStorage.getItem(key) || localStorage.getItem(fallback) || localStorage.getItem('course_clicks');
        return v !== null ? parseInt(v) : 0;
    },

    setCourseClicks(value, courseId, userId) {
        const cid = courseId || Storage.getCurrentCourseId();
        localStorage.setItem(CK('course_clicks', cid, userId), value);
    },

    
};

window.Storage = Storage;