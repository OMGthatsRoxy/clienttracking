// 环境变量配置
export const config = {
  firebase: {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyCGs4G8VrT5ooLJy9emlfItMrx447dMzi8",
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "client-tracking-system-b5d89.firebaseapp.com",
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "client-tracking-system-b5d89",
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "client-tracking-system-b5d89.firebasestorage.app",
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "211406703842",
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:211406703842:web:2669493b1b0e5f68b0e2bb",
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-1GK1JHRNBC"
  },
  app: {
    name: "TrainerLogbook",
    version: "1.0.0",
    maxFileSize: 5 * 1024 * 1024, // 5MB
    supportedImageTypes: ['image/jpeg', 'image/png', 'image/webp'],
    pagination: {
      defaultPageSize: 10,
      maxPageSize: 50
    }
  },
  features: {
    enableAnalytics: process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === 'true',
    enableNotifications: process.env.NEXT_PUBLIC_ENABLE_NOTIFICATIONS === 'true',
    enableOfflineMode: process.env.NEXT_PUBLIC_ENABLE_OFFLINE_MODE === 'true'
  }
}; 