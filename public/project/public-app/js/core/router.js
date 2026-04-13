import { setState } from "./store.js";

export function navigate(view) {
    setState({ view });
}