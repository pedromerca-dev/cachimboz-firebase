export const store = {
    user: null,
    authLoaded: false,
    courses: [],
    loading: false,
    view: "home"
};

const listeners = [];

export function subscribe(fn) {
    listeners.push(fn);
}

export function setState(newState) {
    Object.assign(store, newState);
    listeners.forEach(fn => fn(store));
}