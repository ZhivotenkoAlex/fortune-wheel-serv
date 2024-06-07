let store = {
    userId: null,
    gameId: null,
    companyId: null,
    startAt: null,
    finishAt: null,
};

function setStoreKey(key, value) {
    store[key] = value;
}

function getStoreKey(key) {
    return store[key];
}

function removeStoreKey(key) {
    delete store[key];
}

function clearStoreKey(key) {
    store[key] = null;
}

module.exports = { store, setStoreKey, getStoreKey, removeStoreKey, clearStoreKey };