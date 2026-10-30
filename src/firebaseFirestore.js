import { getFirestore } from "firebase/firestore";
import { app } from "./firebase.js";

export const db = app ? getFirestore(app) : null;
