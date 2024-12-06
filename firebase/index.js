const { setStoreKey } = require('../store');
const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const config = {
    type: process.env.TYPE,
    project_id: process.env.FIREBASE_PROJECT_ID,
    private_key_id: process.env.PRIVATE_KEY_ID,
    private_key: process.env.FIREBASE_PRIVATE_KEY
        ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/gm, '\n')
        : undefined,
    client_email: process.env.CLIENT_EMAIL,
    client_id: process.env.CLIENT_ID,
    auth_uri: process.env.AUTH_URI,
    token_uri: process.env.TOKEN_URI,
    auth_provider_x509_cert_url: process.env.AUTH_PROVIDER_X509_CERT_URL,
    client_x509_cert_url: process.env.CLIENT_X509_CERT_URL,
    universe_domain: process.env.UNIVERSE_DOMAIN,
};

admin.initializeApp({
    credential: admin.credential.cert(config),
});

const dbInstance = getFirestore(admin.app(), process.env.FIREBASE_DATABASE_ID);

const db = dbInstance;

async function verifyToken(accessToken) {
    try {
        const decoded = jwt.verify(accessToken, process.env.JWT_ACCESS_SECRET);
        const sub = decoded.sub;
        const snapshot = await db.collection('users').doc(sub).get();
        if (!snapshot.exists) {
            throw new Error('No such document!');
        } else {
            // Get the data from the document
            const userData = snapshot.data();
            setStoreKey('userId', userData.id);
            return {
                isValid: true,
                userId: userData.id,
            };
        }
    } catch (error) {
        console.log('Error verifying ID token:', error);
        return {
            isValid: false,
            error: error,
        };
    }
}

async function getGameConfigs(gameID) {
    const snapshot = await db.collection('game_config').doc(gameID).get();
    if (!snapshot.exists) {
        throw new Error('No such document!');
    } else {
        // Get the data from the document
        const gameData = snapshot.data();
        const gridSkewY = 90 - 360 / gameData.items.length;
        const gridRotate = 360 / gameData.items.length;
        // Store data
        setStoreKey('gameId', snapshot.id);
        setStoreKey('companyId', gameData.companyId);

        return { ...gameData, gridSkewY, gridRotate };
    }
}

async function getCompany(companyId) {
    const snapshot = await db.collection('company').doc(companyId).get();
    if (!snapshot.exists) {
        throw new Error('No such document!');
    } else {
        // Get the data from the document
        return snapshot.data();
    }
}

async function storeResults(result) {
    try {
        await db.collection('game_history').add(result);
        await updateInfopage(result.gameId, result.userId, result.companyId);
    } catch (error) {
        console.log('Error getting document:', error);
    }
}

async function updateFan(userId, companyId, points) {
    try {
        let query = await db
            .collection('fans')

        if (userId) {
            query = query.where('user_id', '==', userId);
        }
        if (companyId) {
            query = query.where('company_id', '==', companyId);
        }

        const fanSnapshot = await query.get();
        if (fanSnapshot.empty) {
            throw new Error('No such document!');
        }
        const fan = fanSnapshot.docs[0].data();
        const currentPoints = fan.money;
        const updatedPoints = currentPoints + Number(points);
        fanSnapshot.docs[0].ref.update({ money: updatedPoints });
    } catch (error) {
        console.log('Error getting document:', error);
    }
}

async function updateInfopage(gameId, user_id, companyId) {
    try {
        const infopageQuery = db
            .collection("infopage")
            .where("foreign_id", "==", gameId)
            .where("user_id", "==", user_id)
            .where("company_id", "==", companyId)
            .where("finished", "==", 0).get();

        const infopageSnapshot = (await infopageQuery).docs[0];

        const demoGameId = '1OfYYkkvnWsn2D748qrx';
        if (!infopageSnapshot?.exists || gameId === demoGameId) {
            if (!infopageSnapshot.exists) {
                throw new Error('No such infopage or it is marked as finished');
            }
            return
        } else {
            await infopageSnapshot.ref.update({ finished: 1 })
        }
    } catch (error) {
        console.log('Error getting document:', error);
    }
}

async function getGameConfig(userId, companyId) {
    try {
        let query = await db
            .collection('game_config')

        if (userId) {
            query = query.where('userId', '==', userId);
        }
        if (companyId) {
            query = query.where('companyId', '==', companyId);
        }

        const configSnapshot = await query.get();
        const gameConfig = configSnapshot.docs[0].data();
        return gameConfig;

    } catch (error) {
        console.log('Error getting document:', error);
    }
}

module.exports = { db, verifyToken, getGameConfigs, storeResults, getCompany, updateFan, getGameConfig };
