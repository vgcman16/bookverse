import { firebase } from '@nativescript/firebase-core';
import '@nativescript/firebase-auth';

export const firebaseConfig = {
    android: {
        apiKey: "YOUR_API_KEY",
        appId: "YOUR_APP_ID",
        projectId: "YOUR_PROJECT_ID",
        storageBucket: "YOUR_STORAGE_BUCKET",
        messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    },
    ios: {
        apiKey: "YOUR_API_KEY",
        appId: "YOUR_APP_ID",
        projectId: "YOUR_PROJECT_ID",
        storageBucket: "YOUR_STORAGE_BUCKET",
        messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
        bundleId: "YOUR_BUNDLE_ID"
    },
    native: true
};

export const initializeFirebase = () => {
    try {
        return firebase().initializeApp(firebaseConfig);
    } catch (error) {
        console.error('Error initializing Firebase:', error);
        throw error;
    }
};

export const getFirebaseAuth = () => {
    try {
        return firebase().auth();
    } catch (error) {
        console.error('Error getting Firebase Auth:', error);
        throw error;
    }
};

// Helper to get error message from Firebase error
export const getFirebaseErrorMessage = (error: unknown): string => {
    if (error && typeof error === 'object' && 'message' in error) {
        return error.message as string;
    }
    return 'An unknown error occurred';
};
