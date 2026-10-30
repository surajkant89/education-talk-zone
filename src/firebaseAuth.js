import { getAuth } from "firebase/auth";
import { app } from "./firebase.js";

export const auth = app ? getAuth(app) : null;
