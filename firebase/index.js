const { setStoreKey, getStoreKey, removeStoreKey, clearStoreKey } = require('../store');
const admin = require('firebase-admin');
const { getFirestore } = require("firebase-admin/firestore")
var jwt = require('jsonwebtoken');
require('dotenv').config();

const config = {
    type: process.env.TYPE,
    project_id: process.env.FIREBASE_PROJECT_ID,
    private_key_id: process.env.PRIVATE_KEY_ID,
    private_key: process.env.FIREBASE_PRIVATE_KEY
        ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/gm, "\n")
        : undefined,
    client_email: process.env.CLIENT_EMAIL,
    client_id: process.env.CLIENT_ID,
    auth_uri: process.env.AUTH_URI,
    token_uri: process.env.TOKEN_URI,
    auth_provider_x509_cert_url: process.env.AUTH_PROVIDER_X509_CERT_URL,
    client_x509_cert_url: process.env.CLIENT_X509_CERT_URL,
    universe_domain: process.env.UNIVERSE_DOMAIN,
}

admin.initializeApp({
    credential: admin.credential.cert(config),
});

const dbInstance = getFirestore(admin.app(), process.env.FIREBASE_DATABASE_ID)

const db = dbInstance

async function verifyToken(accessToken) {
    try {
        var decoded = jwt.verify(accessToken, process.env.JWT_ACCESS_SECRET);
        const sub = decoded.sub;
        const snapshot = await db.collection('users').doc(sub).get()
        if (!snapshot.exists) {
            throw new Error('No such document!');
        } else {
            // Get the data from the document
            const userData = snapshot.data();
            setStoreKey('userId', userData.id)
            return {
                isValid: true,
                userId: userData.id,
            }
        }
    } catch (error) {
        console.log('Error verifying ID token:', error);
        return {
            isValid: false,
            error: error,
        }
    }
}

async function getGameConfigs(gameID) {
    const snapshot = await db.collection('game_config').doc(gameID).get()
    if (!snapshot.exists) {
        throw new Error('No such document!');
    } else {
        // Get the data from the document
        const gameData = snapshot.data();
        const gridSkewY = 90 - 360 / gameData.items.length;
        const gridRotate = 360 / gameData.items.length;
        // Store data
        setStoreKey('gameId', snapshot.id)
        setStoreKey('companyId', gameData.companyId)

        return { ...gameData, gridSkewY, gridRotate };
    }
}

async function storeResults(result) {
    try {
        await db.collection('game_history').add(result)
    } catch (error) {
        console.log('Error getting document:', error);
    }
}

module.exports = { db, verifyToken, getGameConfigs, storeResults };